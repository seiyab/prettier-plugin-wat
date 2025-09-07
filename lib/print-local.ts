import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { Local } from "./parser/wat-modules";
import { WatNode } from "./parser/wat";

const { group } = doc.builders;

export function printLocal(
	node: Local,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(local"];
	if (node.id) {
		parts.push(" ", path.call(print, "id"));
	}
	parts.push(" ", path.call(print, "v"));
	parts.push(")");
	return group(parts);
}
