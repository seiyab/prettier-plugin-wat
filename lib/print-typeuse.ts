import { doc, type AstPath, type Doc } from "prettier";
import { TypeUse } from "./parser/wat-modules";
import { WatNode } from "./parser/wat";
import { Print } from "./types";

const { group, indent, join, line } = doc.builders;

export function printTypeUse(
	node: TypeUse,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = [];
	if (node.index !== undefined) {
		parts.push(group(["(type ", print("index"), ")"]));
	}
	if (node.params.length > 0) {
		parts.push(indent(group(join(line, path.map(print, "params")))));
	}
	if (node.results.length > 0) {
		parts.push(indent(group(join(line, path.map(print, "results")))));
	}

	if (parts.length === 0) return "";

	return group(join(line, parts));
}
