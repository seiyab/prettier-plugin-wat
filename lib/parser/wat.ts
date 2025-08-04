import { parser, Node } from "./p";
import { ModuleElement, ModuleNodes, Program, program } from "./wat-modules";
import { TypeNodes } from "./wat-types";
import { ValueNodes } from "./wat-values";
import { Comment } from "./wat-lexical-format";
import { InstructionNode } from "./wat-instructions";

export type WatNode = Node<
	| ModuleNodes
	| ModuleElement
	| ValueNodes
	| TypeNodes
	| InstructionNode
	| Comment
>;

export function parse(source: string): Node<Program> {
	const out = parser(program).parse({ source, index: 0 });
	if (out instanceof Error) throw out;
	return out.node;
}
