import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { Local } from "./parser/wat-modules";
import { WatNode } from "./parser/wat";

const { group, join } = doc.builders;

export function printLocal(
	node: Local,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(local"];
	if (node.id) {
		parts.push(" ", print("id"));
	}
	parts.push(" ", join(" ", path.map(print, "valtypes")));
	parts.push(")");
	return group(parts);
}
