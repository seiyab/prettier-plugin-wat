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
		parts.push(" ", path.call(print, "id"));
	}
	if (node.mode === "declarative") {
		parts.push(" declare");
	}
	if (node.tableuse) {
		parts.push(" ", path.call(print, "tableuse"));
	}
	if (node.offset) {
		parts.push(" (offset ", path.call(print, "offset"), ")");
	}
	parts.push(indent([line, path.call(print, "elemlist")]));
	parts.push(")");
	return group(parts);
}
