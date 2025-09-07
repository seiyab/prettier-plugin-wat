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
		parts.push(["offset=", path.call(print, "offset")]);
	}
	if (node.align) {
		parts.push(" ", ["align=", path.call(print, "align")]);
	}
	return group(parts);
}
