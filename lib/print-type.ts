import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { Type } from "./parser/wat-modules";
import { WatNode } from "./parser/wat";

const { group, indent, line } = doc.builders;

export function printType(node: Type, path: AstPath<WatNode>, print: Print) {
	const parts: Doc[] = ["(type"];
	if (node.id) {
		parts.push(" ", path.call(print, "id"));
	}
	if (node.functype) {
		parts.push(indent([line, path.call(print, "functype")]));
	}
	parts.push(")");
	return group(parts);
}
