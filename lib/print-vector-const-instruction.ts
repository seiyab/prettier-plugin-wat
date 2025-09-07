import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { VectorConstInstruction } from "./parser/wat-instructions";
import { WatNode } from "./parser/wat";

const { group, indent, line, join } = doc.builders;

export function printVectorConstInstruction(
	node: VectorConstInstruction,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = [
		node.op,
		" ",
		node.shape,
		indent([line, join(line, path.map(print, "vals"))]),
	];
	return group(parts);
}
