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
	commentCollector,
	lazy,
} from "./p";
import { Result, result } from "./wat-types";
import {
	float,
	Float,
	Index,
	index,
	integer,
	Integer,
	uInteger,
	UInteger,
} from "./wat-values";
import { Comment, word } from "./wat-lexical-format";
import { typeuse, TypeUse } from "./wat-modules";
import { iife } from "../iife";

export type InstructionNode = Instruction | Memarg | Expression;

type Instruction =
	| BlockControlInstruction
	| PlainInstruction
	| FoldedInstruction;

export const instr: Parser<Instruction> = lazy(() =>
	oneOf<Instruction>([
		blockControlInstruction,
		plainInstruction,
		foldedInstrucion,
	]),
);
/** @deprecated use `instr` instead */
export const instruction = instr;

type BlockControlInstruction =
	| IfInstruction
	| BlockInstruction
	| LoopInstruction;
const blockControlInstruction: Parser<BlockControlInstruction> = lazy(() =>
	oneOf<BlockControlInstruction>([
		ifInstruction,
		blockInstruction,
		loopInstruction,
	]),
);

export type BlockInstruction = {
	type: "BlockInstruction";
	label?: AST<Index>;
	blocktype: AST<TypeUse>;
	instructions: AST<InstructionNode>[];
	endId?: AST<Index>;
};
const blockInstruction: Parser<BlockInstruction> = do_(($) => {
	void $(literal("block"));
	void $.exclusive();
	const c = commentCollector();
	const label = $(opt(index));
	const blocktype = $(typeuse);
	const instructions = c.drain($(many(instruction))).nodes;
	void $(literal("end"));
	const endId = $(opt(index));
	return {
		type: "BlockInstruction",
		label: dropNone(label),
		blocktype,
		instructions,
		endId: dropNone(endId),
		comments: c.comments(),
	};
});

export type LoopInstruction = {
	type: "LoopInstruction";
	label?: AST<Index>;
	blocktype: AST<TypeUse>;
	instructions: AST<InstructionNode>[];
	endId?: AST<Index>;
};
const loopInstruction: Parser<LoopInstruction> = do_(($) => {
	void $(literal("loop"));
	void $.exclusive();
	const c = commentCollector();
	const label = $(opt(index));
	const blocktype = $(typeuse);
	const instructions = c.drain($(many(instruction))).nodes;
	void $(literal("end"));
	const endId = $(opt(index));
	return {
		type: "LoopInstruction",
		label: dropNone(label),
		blocktype,
		instructions,
		endId: dropNone(endId),
		comments: c.comments(),
	};
});

export type IfInstruction = {
	type: "IfInstruction";
	label?: AST<Index>;
	blocktype: AST<TypeUse>;
	then: AST<InstructionNode>[];
	elseId?: AST<Index>;
	else?: AST<InstructionNode>[];
	endId?: AST<Index>;
};
const ifInstruction: Parser<IfInstruction> = do_(($) => {
	void $(literal("if"));
	void $.exclusive();
	const c = commentCollector();
	const label = $(opt(index));
	const blocktype = $(typeuse);
	const then = c.drain($(many(instruction))).nodes;
	const hasElse = $(opt(literal("else"))).type !== "None";
	const { elseId, else_ } =
		hasElse ?
			{
				elseId: dropNone($(opt(index))),
				else_: c.drain($(many(instruction))).nodes,
			}
		:	{ elseId: undefined, else_: undefined };
	void $(literal("end"));
	const endId = $.peek(index) ? dropNone($(opt(index))) : undefined;
	return {
		type: "IfInstruction",
		label: dropNone(label),
		blocktype,
		then,
		elseId: elseId,
		else: else_,
		endId: endId,
		comments: c.comments(),
	};
});

type PlainControlInstruction = {
	type: "PlainControlInstruction";
	op: string;
	args: AST<Index | TypeUse>[];
};

const pcis = new Set([
	"unreachable",
	"nop",
	"br_if",
	"br_table",
	"br",
	"return",
	"call_indirect",
	"call",
] as const);

const plainControlInstruction: Parser<PlainControlInstruction> = do_(($) => {
	const op = $(word(pcis)).value;
	$.exclusive();
	const c = commentCollector();
	const args = iife(() => {
		switch (op) {
			case "unreachable":
			case "nop":
			case "return":
				return [];
			case "br":
			case "br_if":
				return [$(index)];
			case "br_table":
				return c.drain($(many(index))).nodes;
			case "call":
				return [$(index)];
			case "call_indirect": {
				const id = $(opt(index));
				const typeuse_ = $(typeuse);
				if (id.type !== "None") return [id, typeuse_];
				return [typeuse_];
			}
			default:
				op satisfies never;
				return [];
		}
	});
	return { type: "PlainControlInstruction", op, args };
});

type ParametricInstruction = {
	type: "ParametricInstruction";
	op: "drop" | "select";
	args?: AST<Result>[];
};
const parameticInstruction: Parser<ParametricInstruction> = do_(($) => {
	const op = $(word(new Set(["drop", "select"] as const))).value;
	const c = commentCollector();
	const args = op === "select" ? c.drain($(many(result))).nodes : undefined;
	return { type: "ParametricInstruction", op, args, comments: c.comments() };
});

type VariableInstruction = {
	type: "VariableInstruction";
	op: string;
	index: AST<Index>;
};
export const variableInstruction: Parser<VariableInstruction> = lazy(() => {
	const o = do_(
		($) => {
			const scope = $(word(new Set(["local", "global"]))).value;
			void $(literal("."));
			const action = $(word(new Set(["get", "set", "tee"]))).value;
			return { type: "Temporal", value: `${scope}.${action}` };
		},
		{ separator: nop },
	);
	return do_(($) => {
		const op = $(o).value;
		void $.exclusive();
		const idx = $<Index>(index);
		return { type: "VariableInstruction", op, index: idx };
	});
});

export type Memarg = { type: "Memarg"; offset?: UInteger; align?: UInteger };
export const memarg: Parser<Memarg> = do_(($) => {
	const offset = $(
		opt(
			do_(($) => {
				void $(literal("offset="));
				void $.exclusive();
				return $(uInteger);
			}),
		),
	);
	const align = $(
		opt(
			do_(($) => {
				void $(literal("align="));
				void $.exclusive();
				return $(uInteger);
			}),
		),
	);
	return { type: "Memarg", offset: dropNone(offset), align: dropNone(align) };
});

export type NumericInstruction =
	| NumericSimpleInstruction
	| NumericConstInstruction;

export type NumericSimpleInstruction = {
	type: "NumericSimpleInstruction";
	op: string;
};

const nis = new Set([
	"clz",
	"ctz",
	"popcnt",
	"add",
	"sub",
	"mul",
	"div_s",
	"div_u",
	"rem_s",
	"rem_u",
	"and",
	"or",
	"xor",
	"shl",
	"shr_s",
	"shr_u",
	"rotl",
	"rotr",

	"eqz",
	"eq",
	"ne",
	"lt_s",
	"lt_u",
	"gt_s",
	"gt_u",
	"le_s",
	"le_u",
	"ge_s",
	"ge_u",
]);

export const numericSimpleInstruction: Parser<NumericSimpleInstruction> = do_(
	($) => {
		const ty = $(word(new Set(["i32", "i64", "f32", "f64"] as const))).value;
		void $(literal("."));
		const op = $(word(nis)).value;
		return { type: "NumericSimpleInstruction", op: `${ty}.${op}` };
	},
	{ separator: nop },
);

export type NumericConstInstruction = {
	type: "NumericConstInstruction";
	op: string;
	val: AST<Integer | Float>;
};

export const numericConstInstruction: Parser<NumericConstInstruction> = lazy(
	() => {
		const intOp = oneOf(["i32.const", "i64.const"].map(literal));
		const floatOp = oneOf(["f32.const", "f64.const"].map(literal));
		return oneOf<NumericConstInstruction>([
			do_(($) => {
				const op = $(intOp).value;
				const val = $(integer);
				return { type: "NumericConstInstruction", op, val };
			}),
			do_(($) => {
				const op = $(floatOp).value;
				const val = $(float);
				return { type: "NumericConstInstruction", op, val };
			}),
		]);
	},
);

export const numericInstruction: Parser<NumericInstruction> =
	oneOf<NumericInstruction>([
		numericSimpleInstruction,
		numericConstInstruction,
	]);

export type VectorInstruction =
	| VectorSimpleInstruction
	| VectorLaneInstruction
	| VectorMemoryInstruction
	| VectorConstInstruction;

const vis = new Set([
	"swizzle",
	"splat",
	"eq",
	"ne",
	"lt_s",
	"lt_u",
	"gt_s",
	"gt_u",

	"abs",
	"neg",
	"all_true",
	"bitmask",
	"narrow_i16x8_s",
	"narrow_i16x8_u",
	"shl",
	"shr_s",
	"shr_u",
	"add",
	"add_sat_s",
	"add_sat_u",
	"sub",
	"sub_sat_s",
	"sub_sat_u",
	"min_s",
	"min_u",
	"max_s",
	"max_u",
	"avgr_u",
	"popcnt",
]);
type VectorSimpleInstruction = { type: "VectorSimpleInstruction"; op: string };
const vectorSimpleInstruction: Parser<VectorSimpleInstruction> = oneOf([
	do_(
		($) => {
			const shape = $(word(shapes));
			void $(literal("."));
			const op = $(word(vis));
			return {
				type: "VectorSimpleInstruction",
				op: `${shape.value}.${op.value}`,
			};
		},
		{ separator: nop },
	),
	do_(
		($) => {
			void $(literal("v128"));
			void $(literal("."));
			const op = $(
				word(
					new Set([
						"not",
						"and",
						"andnot",
						"or",
						"xor",
						"bitselect",
						"any_true",
					]),
				),
			);
			return { type: "VectorSimpleInstruction", op: `v128.${op.value}` };
		},
		{ separator: nop },
	),
]);

type VectorLaneInstruction = {
	type: "VectorLaneInstruction";
	op: string;
	laneidx: Index;
};
const vectorLaneInstruction: Parser<VectorLaneInstruction> = lazy(() => {
	const o = do_(
		($) => {
			const shape = $(word(shapes)).value;
			void $(literal("."));
			const o = $(
				word(
					new Set([
						"extract_lane_s",
						"extract_lane_u",
						"replace_lane",
						"extract_lane",
					]),
				),
			).value;
			return { type: "Temporal", value: `${shape}.${o}` };
		},
		{ separator: nop },
	);
	return do_(($) => {
		const op = $(o).value;
		$.exclusive();
		const laneidx = $(uInteger);
		return { type: "VectorLaneInstruction", op, laneidx };
	});
});

export type VectorMemoryInstruction = {
	type: "VectorMemoryInstruction";
	op: string;
	memarg: AST<Memarg>;
	laneindex?: AST<UInteger>;
};
const vectorMemoryInstruction: Parser<VectorMemoryInstruction> = do_(($) => {
	const op = $(
		do_(
			($) => {
				void $(literal("v128."));
				const ls = $(word(new Set(["load", "store"])));
				return { type: "Temporal", value: `v128.${ls.value}` };
			},
			{ separator: nop },
		),
	).value;

	const ma = $(memarg);
	return { type: "VectorMemoryInstruction", op, memarg: ma };
});

export type VectorConstInstruction = {
	type: "VectorConstInstruction";
	op: "v128.const";
	shape: Shape;
	vals: AST<Integer | Float>[];
};

const vectorConstInstruction: Parser<VectorConstInstruction> = do_(($) => {
	const op = $(literal("v128.const")).value;
	const shape = $(word(shapes)).value;
	const vals = shape.startsWith("i") ? $(many(integer)) : $(many(float));
	return {
		type: "VectorConstInstruction",
		op,
		shape,
		vals: vals.nodes,
		comments: vals.comments,
	};
});

export const vectorInstruction = oneOf<VectorInstruction>([
	vectorSimpleInstruction,
	vectorLaneInstruction,
	vectorMemoryInstruction,
	vectorConstInstruction,
]);

type Shape = typeof shapes extends Set<infer U> ? U : unknown;
const shapes = new Set([
	"i8x16",
	"i16x8",
	"i32x4",
	"i64x2",
	"f32x4",
	"f64x2",
] as const);

export type MemoryInstruction = {
	type: "MemoryInstruction";
	op: string;
	arg?: AST<Memarg> | AST<Index>;
};
export const memoryInstruction: Parser<MemoryInstruction> = do_(($) => {
	const op = $(
		oneOf<{ type: string; value: string }>([
			do_(
				($) => {
					void $(literal("memory"));
					void $(literal("."));
					$.exclusive();
					const o = $(word(mos));
					return { type: "Temporal", value: `memory.${o.value}` };
				},
				{ separator: nop },
			),
			do_(
				($) => {
					const ty = $(word(new Set(["i32", "i64", "f32", "f64"]))).value;
					void $(literal("."));
					const ls = dropNone($(opt(word(new Set(["load", "store"])))));
					if (ls !== undefined)
						return { type: "Temporal", value: `${ty}.${ls.value}` };
					if (!ty.startsWith("i")) return new Error("invalid memory op");
					const o = $(word(mios));
					return { type: "Temporal", value: `${ty}.${o.value}` };
				},
				{ separator: nop },
			),
		]),
	).value;
	const arg =
		op.includes("store") || op.includes("load") ? $(memarg) : undefined;
	return { type: "MemoryInstruction", op, arg };
});
const mos = new Set(["grow", "size", "fill"] as const);
const mios = new Set([
	"load8_s",
	"load8_u",
	"load16_s",
	"load16_u",
	"load32_s",
	"load32_u",
	"store8",
	"store16",
	"store32",
]);

type PlainInstruction =
	| PlainControlInstruction
	| ParametricInstruction
	| VariableInstruction
	| NumericInstruction
	| VectorInstruction
	| MemoryInstruction;
export const plainInstruction: Parser<PlainInstruction> =
	oneOf<PlainInstruction>([
		plainControlInstruction,
		parameticInstruction,
		variableInstruction,
		numericInstruction,
		vectorInstruction,
		memoryInstruction,
	]);

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
	void $.exclusive();

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

export type FoldedInstruction =
	| FoldedPlainInstruction
	| FoldedIfInstruction
	| FoldedBlockInstruction
	| FoldedLoopInstruction;
export const foldedInstrucion: Parser<FoldedInstruction> = do_(($) => {
	if (!$.peek(literal("("))) return new Error("expected '('");
	return $(
		oneOf<FoldedInstruction>([
			foldedIfInstruction,
			foldedBlockInstruction,
			foldedLoopInstruction,
			foldedPlainInstruction,
		]),
	);
});

export type FoldedPlainInstruction = {
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

export type FoldedBlockInstruction = {
	type: "FoldedBlockInstruction";
	label?: AST<Index>;
	blocktype: AST<TypeUse>;
	instructions: AST<InstructionNode>[];
};
const foldedBlockInstruction: Parser<FoldedBlockInstruction> = do_(($) => {
	void $(literal("("));
	void $(literal("block"));
	void $.exclusive();
	const c = commentCollector();
	const label = $(opt(index));
	const blocktype = $(typeuse);
	const instructions = c.drain($(many(instruction))).nodes;
	void $(literal(")"));
	return {
		type: "FoldedBlockInstruction",
		label: dropNone(label),
		blocktype,
		instructions,
		comments: c.comments(),
	};
});

export type FoldedLoopInstruction = {
	type: "FoldedLoopInstruction";
	label?: AST<Index>;
	blocktype: AST<TypeUse>;
	instructions: AST<InstructionNode>[];
};
const foldedLoopInstruction: Parser<FoldedLoopInstruction> = do_(($) => {
	void $(literal("("));
	void $(literal("loop"));
	void $.exclusive();
	const c = commentCollector();
	const label = $(opt(index));
	const blocktype = $(typeuse);
	const instructions = c.drain($(many(instruction))).nodes;
	void $(literal(")"));
	return {
		type: "FoldedLoopInstruction",
		label: dropNone(label),
		blocktype,
		instructions,
		comments: c.comments(),
	};
});

export type Expression = { type: "Expression"; instrs: AST<InstructionNode>[] };
export const expr: Parser<Expression> = do_(($) => {
	const c = commentCollector();
	const instrs = c.drain($(many(instr))).nodes;
	return { type: "Expression", instrs, comments: c.comments() };
});
