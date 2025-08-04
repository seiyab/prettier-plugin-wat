import { do_, literal, many, Node, oneOf, Parser } from "./p";
import { Index, index } from "./wat-values";

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
	const op = $(literal("i32.add")).value;
	return { type: "NumericInstruction", op };
});

type PlainInstruction = VariableInstruction | NumericInstruction;
export const plainInstruction: Parser<PlainInstruction> =
	oneOf<PlainInstruction>([variableInstruction, numericInstruction]);

export const instruction: Parser<InstructionNode> = do_(($) =>
	$(oneOf<InstructionNode>([plainInstruction, foldedInstrucion])),
);

export type FoldedInstruction = FoldedPlainInstruction;
export const foldedInstrucion: Parser<FoldedInstruction> = do_(($) =>
	$(oneOf<FoldedInstruction>([foldedPlainInstruction])),
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
