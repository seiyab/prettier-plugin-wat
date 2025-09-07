import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { WatNode } from "./parser/wat";
import { FoldedPlainInstruction } from "./parser/wat-instructions";

const { group, indent, line, join, softline } = doc.builders;

export function printFoldedPlainInstruction(
	node: FoldedPlainInstruction,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const body = [];
	if (node.operands.length > 0) {
		body.push(
			indent([line, join(line, path.map(print, "operands"))]),
			softline,
		);
	}
	return group(["(", path.call(print, "operator"), body, ")"]);
}
