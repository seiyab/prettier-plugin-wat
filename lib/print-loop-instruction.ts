import { AstPath, Doc, doc } from "prettier";
import { Print } from "./types";
import { LoopInstruction } from "./parser/wat-instructions";
import { WatNode } from "./parser/wat";

const { group, indent, hardline, join } = doc.builders;

export function printLoopInstruction(
	node: LoopInstruction,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["loop"];
	if (node.label) {
		parts.push(" ", path.call(print, "label"));
	}
	const blocktype = path.call(print, "blocktype");
	if (blocktype !== "") {
		parts.push(" ", blocktype);
	}
	if (node.instructions.length > 0) {
		parts.push(
			indent([hardline, join(hardline, path.map(print, "instructions"))]),
		);
	}
	parts.push(hardline, "end");
	if (node.endId) {
		parts.push(" ", path.call(print, "endId"));
	}
	return group(parts);
}
