import { AstPath, doc, Doc } from "prettier";
import { Print } from "./types";
import { WatNode } from "./parser/wat";
import { FoldedIfInstruction } from "./parser/wat-instructions";

const { group, indent, softline, join, line } = doc.builders;

export function printFoldedIfInstruction(
	node: FoldedIfInstruction,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(if"];
	if (node.result) {
		parts.push(" ", path.call(print, "result"));
	}
	if (node.cond.length > 0) {
		parts.push(indent([line, join(line, path.map(print, "cond"))]));
	}
	parts.push(
		line,
		group([
			"(then",
			indent([line, join(line, path.map(print, "then"))]),
			line,
			")",
		]),
	);
	if (node.else) {
		parts.push(
			line,
			group([
				"(else",
				indent([line, join(line, path.map(print, "else"))]),
				line,
				")",
			]),
		);
	}
	parts.push(softline, ")");
	return group(parts);
}
