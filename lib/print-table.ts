import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { InlineTable, Table } from "./parser/wat-modules";
import { WatNode } from "./parser/wat";

const { group, join, line, softline, indent } = doc.builders;

export function printTable(
	node: Table,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(table"];
	if (node.id) {
		parts.push(" ", print("id"));
	}
	if (node.export) {
		parts.push(" ", print("export"));
	}
	parts.push(" ", print("tabletype"));
	parts.push(")");
	return group(parts);
}

export function printInlineTable(
	node: InlineTable,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(table"];
	if (node.id) {
		parts.push(" ", print("id"));
	}
	if (node.at) {
		parts.push(" ", print("at"));
	}
	parts.push(" ", print("reftype"));

	parts.push(
		group([
			indent(["(elem", line, print("elemlist"), softline, ")"]),
			softline,
		]),
	);

	parts.push(")");
	return group(parts);
}
