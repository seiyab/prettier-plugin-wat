import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { Global } from "./parser/wat-modules";
import { WatNode } from "./parser/wat";

const { group, indent, line, join } = doc.builders;

export function printGlobal(
	node: Global,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(global"];
	if (node.id) {
		parts.push(" ", path.call(print, "id"));
	}
	parts.push(" ", path.call(print, "globaltype"));
	parts.push(indent([line, join(line, path.map(print, "expr"))]));
	parts.push(")");
	return group(parts);
}
