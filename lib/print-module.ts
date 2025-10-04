import { AstPath, Doc, doc } from "prettier";
import { Print } from "./types";
import { WatNode } from "./parser/wat";
import { Module } from "./parser/wat-modules";
import { printWithBlankLines } from "./printer-utils";

const { group, indent, hardline, softline, join } = doc.builders;

export function printModule(
	node: Module,
	path: AstPath<WatNode>,
	options: unknown,
	print: Print,
) {
	const parts: Doc[] = ["(module"];
	if (node.id) {
		parts.push(" ", print("id"));
	}
	if (node.modulefields && node.modulefields.length > 0) {
		parts.push(
			indent([
				hardline,
				join(
					hardline,
					path.map(printWithBlankLines(print, options), "modulefields"),
				),
			]),
		);
	}
	parts.push(softline, ")");
	return group(parts);
}
