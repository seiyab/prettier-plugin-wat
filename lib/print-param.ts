import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { Param } from "./parser/wat-types";
import { WatNode } from "./parser/wat";

const { group, indent, join } = doc.builders;

export function printParam(
	_node: Param,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	return group([
		indent([
			"(param ",
			path.call(print, "id"),
			" ",
			join(" ", path.map(print, "valtype")),
		]),
		")",
	]);
}
