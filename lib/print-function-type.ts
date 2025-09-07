import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { FunctionType } from "./parser/wat-types";
import { WatNode } from "./parser/wat";

const { group, indent, line, join } = doc.builders;

export function printFunctionType(
	node: FunctionType,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(func"];
	if (node.params && node.params.length > 0) {
		parts.push(indent([line, join(line, path.map(print, "params"))]));
	}
	if (node.results && node.results.length > 0) {
		parts.push(indent([line, join(line, path.map(print, "results"))]));
	}
	parts.push(")");
	return group(parts);
}
