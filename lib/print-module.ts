import { AstPath, Doc, doc } from "prettier";
import { Print } from "./types";
import { WatNode } from "./parser/wat";
import { Module } from "./parser/wat-modules";

const { group, indent, hardline, softline, join } = doc.builders;

export function printModule(
	node: Module,
	path: AstPath<WatNode>,
	print: Print,
) {
	const parts: Doc[] = ["(module"];
	if (node.id) {
		parts.push(" ", path.call(print, "id"));
	}
	if (node.modulefields && node.modulefields.length > 0) {
		parts.push(
			indent([hardline, join(hardline, path.map(print, "modulefields"))]),
		);
	}
	parts.push(softline, ")");
	return group(parts);
}
