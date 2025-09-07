import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { Table } from "./parser/wat-modules";
import { WatNode } from "./parser/wat";

const { group } = doc.builders;

export function printTable(
	node: Table,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(table"];
	if (node.id) {
		parts.push(" ", path.call(print, "id"));
	}
	if (node.export) {
		parts.push(" ", path.call(print, "export"));
	}
	parts.push(" ", path.call(print, "tabletype"));
	parts.push(")");
	return group(parts);
}
