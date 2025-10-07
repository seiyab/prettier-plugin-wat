import { parser, AST } from "./p";
import { ModuleElement, ModuleNodes, Program, program } from "./wat-modules";
import { TypeNodes } from "./wat-types";
import { ValueNodes } from "./wat-values";
import { Comment } from "./wat-lexical-format";
import { InstructionNode } from "./wat-instructions";
import { Assert } from "./wat-spec-test";

export type WatNode = AST<
	| ModuleNodes
	| ModuleElement
	| ValueNodes
	| TypeNodes
	| InstructionNode
	| Comment
	| Assert
>;

export function parse(source: string): AST<Program> {
	const out = parser(program).parse({ source, index: 0 });
	if (out instanceof Error) throw out;
	return out.node;
}
