import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { Memarg } from "./parser/wat-instructions";
import { WatNode } from "./parser/wat";

const { group } = doc.builders;

export function printMemarg(
	node: Memarg,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = [];
	if (node.offset) {
		parts.push(["offset=", print("offset")]);
	}
	if (node.align) {
		parts.push(" ", ["align=", print("align")]);
	}
	return group(parts);
}
