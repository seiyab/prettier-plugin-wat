import { AstPath, Doc, doc } from "prettier";
import { Print } from "./types";
import { IfInstruction } from "./parser/wat-instructions";
import { WatNode } from "./parser/wat";

const { group, indent, hardline, join } = doc.builders;

export function printIfInstruction(
	node: IfInstruction,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["if"];
	if (node.label) {
		parts.push(" ", path.call(print, "label"));
	}
	const blocktype = path.call(print, "blocktype");
	if (blocktype !== "") {
		parts.push(" ", blocktype);
	}

	if (node.then.length > 0) {
		parts.push(indent([hardline, join(hardline, path.map(print, "then"))]));
	}

	if (node.else !== undefined) {
		parts.push(hardline, "else");
		if (node.elseId) {
			parts.push(" ", path.call(print, "elseId"));
		}
		parts.push(indent([hardline, join(hardline, path.map(print, "else"))]));
	}
	parts.push(hardline, "end");
	if (node.endId) {
		parts.push(" ", path.call(print, "endId"));
	}
	return group(parts);
}
