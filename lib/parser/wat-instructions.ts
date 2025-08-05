import { do_, literal, many, Node, oneOf, Parser, opt } from "./p";
import { Result, result } from "./wat-types";
import { Index, index, integer, Integer } from "./wat-values";

export type InstructionNode = PlainInstruction | FoldedInstruction;

export type VariableInstruction = {
	type: "VariableInstruction";
	op: `${"local" | "global"}.${"get" | "set" | "tee"}`;
	index: Node<Index>;
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

export type ConstInstruction = {
	type: "ConstInstruction";
	op: "i32.const";
	val: Node<Integer>;
};

export const constInstruction: Parser<ConstInstruction> = do_(($) => {
	const op = $(literal("i32.const")).value as "i32.const";
	const val = $(integer);
	return { type: "ConstInstruction", op, val };
});

type PlainInstruction =
	| VariableInstruction
	| NumericInstruction
	| ConstInstruction;
export const plainInstruction: Parser<PlainInstruction> =
	oneOf<PlainInstruction>([
		variableInstruction,
		numericInstruction,
		constInstruction,
	]);

export const instruction: Parser<InstructionNode> = do_(($) =>
	$(oneOf<InstructionNode>([plainInstruction, foldedInstrucion])),
);

export type FoldedIfInstruction = {
	type: "FoldedIfInstruction";
	result: Node<Result> | null;
	cond: Node<InstructionNode>[];
	then: Node<InstructionNode>[];
	else: Node<InstructionNode>[] | null;
};

export const foldedIfInstruction: Parser<FoldedIfInstruction> = do_(($) => {
	void $(literal("("));
	void $(literal("if"));

	const result_ = $(opt(result));

	const cond = $(many(instruction)).nodes;

	void $(literal("("));
	void $(literal("then"));
	const thenClause = $(many(instruction)).nodes;
	void $(literal(")"));

	const elseClause = $(
		opt(
			do_(($$) => {
				void $$(literal("("));
				void $$(literal("else"));
				const elseInstructions = $$(many(instruction));
				void $$(literal(")"));
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
	};
});

export type FoldedInstruction = FoldedPlainInstruction | FoldedIfInstruction;
export const foldedInstrucion: Parser<FoldedInstruction> = do_(($) =>
	$(oneOf<FoldedInstruction>([foldedPlainInstruction, foldedIfInstruction])),
);

type FoldedPlainInstruction = {
	type: "FoldedPlainInstruction";
	operator: Node<PlainInstruction>;
	operands: Node<FoldedInstruction>[];
};
const foldedPlainInstruction: Parser<FoldedPlainInstruction> = do_(($) => {
	void $(literal("("));
	const operator = $(plainInstruction);
	const operands = $(many(foldedInstrucion)).nodes;
	void $(literal(")"));
	return { type: "FoldedPlainInstruction", operator, operands };
});
