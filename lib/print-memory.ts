import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { Memory } from "./parser/wat-modules";
import { WatNode } from "./parser/wat";

const { group } = doc.builders;

export function printMemory(
	node: Memory,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(memory"];
	if (node.id) {
		parts.push(" ", print("id"));
	}
	if (node.export) {
		parts.push(" ", print("export"));
	}
	parts.push(" ", print("memtype"));
	parts.push(")");
	return group(parts);
}
