import { do_, Fail, literal, Node, oneOf, Parser } from "./p";
import { spaces } from "./wat-misc";
import { Index, u32 } from "./wat-values";

export type Instruction = VariableInstruction;

export type VariableInstruction = {
	type: "VariableInstruction";
	op: `${"local" | "global"}.${"get" | "set" | "tee"}`;
	index: Node<Index>;
};
export const variableInstruction: Parser<VariableInstruction | Fail> = do_(
	($) => {
		const op = $(
			oneOf(
				["local.get", "local.set", "local.tee", "global.get", "global.set"].map(
					literal,
				),
			),
		).value as VariableInstruction["op"];
		void $(spaces);
		const index = $(u32);
		return { type: "VariableInstruction", op, index };
	},
);
