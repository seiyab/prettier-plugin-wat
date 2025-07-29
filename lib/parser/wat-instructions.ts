import { do_, literal, Node, oneOf, Parser } from "./p";
import { Index, u32 } from "./wat-values";

export type Instruction = VariableInstruction;

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
	const index = $(u32);
	return { type: "VariableInstruction", op, index };
});
