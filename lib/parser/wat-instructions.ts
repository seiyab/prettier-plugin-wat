import { do_, literal, many, AST, oneOf, Parser, opt, Many, Node } from "./p";
import { Result, result } from "./wat-types";
import { Index, index, integer, Integer } from "./wat-values";
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

export type NumericInstruction = { type: "NumericInstruction"; op: string };

export const numericInstruction: Parser<NumericInstruction> = do_(($) => {
	const op = $(oneOf([literal("i32.add"), literal("i32.ge_s")])).value;
	return { type: "NumericInstruction", op };
});

export type VectorInstruction = { type: "VectorInstruction"; op: string };
export const vectorInstruction: Parser<VectorInstruction> = do_(($) => {
	const op = $(
		oneOf([
			literal("v128.store"),
			literal("i8x16.swizzle"),
			literal("v128.load"),
		]),
	).value;
	return { type: "VectorInstruction", op };
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

export type V128ConstInstruction = {
	type: "V128ConstInstruction";
	op: "v128.const";
	lanetype: "i8x16";
	vals: AST<Integer>[];
};

export const v128ConstInstruction: Parser<V128ConstInstruction> = do_(($) => {
	const op = $(literal("v128.const")).value as "v128.const";
	const lanetype = $(literal("i8x16")).value as "i8x16";
	const vals = $(many(integer));
	return { type: "V128ConstInstruction", op, lanetype, vals: vals.nodes };
});

type PlainInstruction =
	| VariableInstruction
	| NumericInstruction
	| ConstInstruction
	| VectorInstruction
	| V128ConstInstruction;
export const plainInstruction: Parser<PlainInstruction> =
	oneOf<PlainInstruction>([
		variableInstruction,
		numericInstruction,
		constInstruction,
		vectorInstruction,
		v128ConstInstruction,
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
