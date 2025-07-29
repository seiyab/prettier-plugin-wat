import { parser, Node } from "./p";
import { ModuleNodes, program } from "./wat-modules";
import { TypeNodes } from "./wat-types";
import { ValueNodes } from "./wat-values";

export type WatNode = Node<ModuleNodes | ValueNodes | TypeNodes>;

export function parse(source: string): Node<WatNode> {
	const out = parser(program).parse({ source, index: 0 });
	if (out instanceof Error) throw new Error();
	return out.node;
}
