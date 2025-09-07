import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { WatNode } from "./parser/wat";
import { ImportDesc } from "./parser/wat-modules";

const { group } = doc.builders;

export function printImportDesc(
	node: ImportDesc,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(", node.kind];
	if (node.id) {
		parts.push(" ", path.call(print, "id"));
	}
	switch (node.kind) {
		case "func":
			parts.push(" ", path.call(print, "target"));
			break;
		case "memory":
			parts.push(" ", path.call(print, "target"));
			break;
	}
	parts.push(")");
	return group(parts);
}
