import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { WatNode } from "./parser/wat";
import { ImportDesc } from "./parser/wat-modules";

const { group, indent, line } = doc.builders;

export function printImportDesc(
	node: ImportDesc,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(", node.kind];
	if (node.id) {
		parts.push(" ", path.call(print, "id"));
	}
	parts.push(indent([line, path.call(print, "target")]));
	parts.push(")");
	return group(parts);
}
