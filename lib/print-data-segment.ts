import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { DataSegment } from "./parser/wat-modules";
import { WatNode } from "./parser/wat";

const { group, indent, line, join } = doc.builders;

export function printDataSegment(
	node: DataSegment,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(data"];
	if (node.memuse) {
		parts.push(" ", path.call(print, "memuse"));
	}
	parts.push(" ", path.call(print, "offset"));
	if (node.inits.length > 0) {
		parts.push(indent([line, join(line, path.map(print, "inits"))]));
	}
	parts.push(")");
	return group(parts);
}
