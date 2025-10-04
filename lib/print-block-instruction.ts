import { AstPath, Doc, doc } from "prettier";
import { Print } from "./types";
import { BlockInstruction } from "./parser/wat-instructions";
import { WatNode } from "./parser/wat";

const { group, indent, hardline, join } = doc.builders;

export function printBlockInstruction(
	node: BlockInstruction,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["block"];
	if (node.label) {
		parts.push(" ", print("label"));
	}
	const blocktype = print("blocktype");
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
		parts.push(" ", print("endId"));
	}
	return group(parts);
}
