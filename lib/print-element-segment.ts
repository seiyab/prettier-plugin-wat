import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { WatNode } from "./parser/wat";
import { ElementSegment } from "./parser/wat-modules";

const { group, indent, line } = doc.builders;

export function printElementSegment(
	node: ElementSegment,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(elem"];
	if (node.id) {
		parts.push(" ", print("id"));
	}
	if (node.mode === "declarative") {
		parts.push(" declare");
	}
	if (node.tableuse) {
		parts.push(" ", print("tableuse"));
	}
	if (node.offset) {
		parts.push(" (offset ", print("offset"), ")");
	}
	parts.push(indent([line, print("elemlist")]));
	parts.push(")");
	return group(parts);
}
