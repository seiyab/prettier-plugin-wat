import {
	do_,
	literal,
	many,
	AST,
	oneOf,
	Parser,
	opt,
	Many,
	Node,
	dropNone,
	nop,
} from "./p";
import { Result, result } from "./wat-types";
import {
	Index,
	index,
	integer,
	Integer,
	uInteger,
	UInteger,
} from "./wat-values";
import { Comment } from "./wat-lexical-format";

export type InstructionNode = PlainInstruction | FoldedInstruction;

export type VariableInstruction = {
	type: "VariableInstruction";
	op: `${"local" | "global"}.${"get" | "set" | "tee"}`;
	index: AST<Index>;
};
export const variableInstruction: Parser<VariableInstruction> = do_(($) => {
	const op = $(
		oneOf(
			["local.get", "local.set", "local.tee", "global.get", "global.set"].map(
				literal,
			),
		),
	).value as VariableInstruction["op"];
	const idx = $<Index>(index);
	return { type: "VariableInstruction", op, index: idx };
});

export type Memarg = { type: "Memarg"; offset?: UInteger; align?: UInteger };
export const memarg: Parser<Memarg> = do_(($) => {
	const offset = $(
		opt(
			do_(($) => {
				void $(literal("offset="));
				return $(uInteger);
			}),
		),
	);
	const align = $(
		opt(
			do_(($) => {
				void $(literal("align="));
				return $(uInteger);
			}),
		),
	);
	return { type: "Memarg", offset: dropNone(offset), align: dropNone(align) };
});

export type NumericInstruction = { type: "NumericInstruction"; op: string };

export const numericInstruction: Parser<NumericInstruction> = do_(($) => {
	const op = $(oneOf([literal("i32.add"), literal("i32.ge_s")])).value;
	return { type: "NumericInstruction", op };
});

export type ConstInstruction = {
	type: "ConstInstruction";
	op: "i32.const";
	val: AST<Integer>;
};

export const constInstruction: Parser<ConstInstruction> = do_(($) => {
	const op = $(literal("i32.const")).value as "i32.const";
	const val = $(integer);
	return { type: "ConstInstruction", op, val };
});

export type VectorInstruction =
	| VectorSimpleInstruction
	| VecotrMemoryInstructoin
	| VectorConstInstruction;

type VectorSimpleInstruction = { type: "VectorSimpleInstruction"; op: string };
const vectorSimpleInstruction: Parser<VectorSimpleInstruction> = do_(
	($) => {
		const type = $(
			oneOf(
				["i8x16", "i16x8", "i32x4", "i64x2", "f32x4", "f64x2"].map(literal),
			),
		);
		void $(literal("."));
		const op = $(
			oneOf(
				["swizzle", "splat", "eq", "ne", "lt_s", "lt_u", "gt_s", "gt_u"].map(
					literal,
				),
			),
		);

		return { type: "VectorSimpleInstruction", op: `${type.value}.${op.value}` };
	},
	{ separator: nop },
);

export type VecotrMemoryInstructoin = {
	type: "VecotrMemoryInstructoin";
	op: string;
	memarg: AST<Memarg>;
	laneindex?: AST<UInteger>;
};
const vectorMemoryInstruction: Parser<VecotrMemoryInstructoin> = do_(($) => {
	const op = $(
		do_(
			($) => {
				void $(literal("v128."));
				const ls = $(oneOf([literal("load"), literal("store")]));
				return { type: "Temporal", value: `v128.${ls.value}` };
			},
			{ separator: nop },
		),
	).value;

	const ma = $(memarg);
	return { type: "VecotrMemoryInstructoin", op, memarg: ma };
});

export type VectorConstInstruction = {
	type: "VectorConstInstruction";
	op: "v128.const";
	lanetype: "i8x16";
	vals: AST<Integer>[];
};

const vectorConstInstruction: Parser<VectorConstInstruction> = do_(($) => {
	const op = $(literal("v128.const")).value as "v128.const";
	const lanetype = $(literal("i8x16")).value as "i8x16";
	const vals = $(many(integer));
	return { type: "VectorConstInstruction", op, lanetype, vals: vals.nodes };
});

export const vectorInstruction = oneOf<VectorInstruction>([
	vectorSimpleInstruction,
	vectorMemoryInstruction,
	vectorConstInstruction,
]);

type PlainInstruction =
	| VariableInstruction
	| NumericInstruction
	| ConstInstruction
	| VectorInstruction
	| VectorConstInstruction;
export const plainInstruction: Parser<PlainInstruction> =
	oneOf<PlainInstruction>([
		variableInstruction,
		numericInstruction,
		constInstruction,
		vectorInstruction,
	]);

export const instruction: Parser<InstructionNode> = do_(($) =>
	$(oneOf<InstructionNode>([plainInstruction, foldedInstrucion])),
);

export type FoldedIfInstruction = {
	type: "FoldedIfInstruction";
	result: AST<Result> | null;
	cond: AST<InstructionNode>[];
	then: AST<InstructionNode>[];
	else: AST<InstructionNode>[] | null;
};

export const foldedIfInstruction: Parser<FoldedIfInstruction> = do_(($) => {
	const comments: AST<Comment>[] = [];
	const c = <T extends Node>(mn: AST<Many<T>>): AST<Many<T>> => {
		comments.push(...(mn.comments ?? []));
		return mn;
	};

	void $(literal("("));
	void $(literal("if"));

	const result_ = $(opt(result));

	const cond = c($(many(instruction))).nodes;

	void $(literal("("));
	void $(literal("then"));
	const thenClause = c($(many(instruction))).nodes;
	void $(literal(")"));

	const elseClause = $(
		opt(
			do_(($) => {
				void $(literal("("));
				void $(literal("else"));
				const elseInstructions = $(many(instruction));
				void $(literal(")"));
				return elseInstructions;
			}),
		),
	);

	void $(literal(")"));

	return {
		type: "FoldedIfInstruction",
		result: result_.type === "None" ? null : result_,
		cond: cond,
		then: thenClause,
		else: elseClause.type === "None" ? null : elseClause.nodes,
		comments,
	};
});

export type FoldedInstruction = FoldedPlainInstruction | FoldedIfInstruction;
export const foldedInstrucion: Parser<FoldedInstruction> = do_(($) =>
	$(oneOf<FoldedInstruction>([foldedPlainInstruction, foldedIfInstruction])),
);

type FoldedPlainInstruction = {
	type: "FoldedPlainInstruction";
	operator: AST<PlainInstruction>;
	operands: AST<FoldedInstruction>[];
};
const foldedPlainInstruction: Parser<FoldedPlainInstruction> = do_(($) => {
	void $(literal("("));
	const operator = $(plainInstruction);
	const { nodes: operands, comments } = $(many(foldedInstrucion));
	void $(literal(")"));
	return { type: "FoldedPlainInstruction", operator, operands, comments };
});
