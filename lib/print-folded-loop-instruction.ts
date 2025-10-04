import { AstPath, Doc, doc } from "prettier";
import { Print } from "./types";
import { FoldedLoopInstruction } from "./parser/wat-instructions";
import { WatNode } from "./parser/wat";

const { group, indent, line, softline, join } = doc.builders;

export function printFoldedLoopInstruction(
	node: FoldedLoopInstruction,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(loop"];
	if (node.label) {
		parts.push(" ", print("label"));
	}
	const blocktype = print("blocktype");
	if (blocktype !== "") {
		parts.push(" ", blocktype);
	}
	if (node.instructions.length > 0) {
		parts.push(indent([line, join(line, path.map(print, "instructions"))]));
	}
	parts.push(softline, ")");
	return group(parts);
}
