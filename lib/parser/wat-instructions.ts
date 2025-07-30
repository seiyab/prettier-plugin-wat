import { do_, literal, Node, oneOf, Parser } from "./p";
import { Index, index } from "./wat-values";

export type Instruction = VariableInstruction | NumericInstruction;

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

export type NumericInstruction = {
	type: "NumericInstruction";
	op: string;
	args?: []; // TODO
};

export const numericInstruction: Parser<NumericInstruction> = do_(($) => {
	const op = $(literal("i32.add")).value;
	return { type: "NumericInstruction", op };
});

export const instruction: Parser<Instruction> = oneOf<Instruction>([
	variableInstruction,
	numericInstruction,
]);
