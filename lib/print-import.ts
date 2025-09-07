import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { Import } from "./parser/wat-modules";
import { WatNode } from "./parser/wat";

const { group } = doc.builders;

export function printImport(
	node: Import,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	return group([
		"(import ",
		path.call(print, "module"),
		" ",
		path.call(print, "name"),
		" ",
		path.call(print, "desc"),
		")",
	]);
}
