import { AstPath, doc, Doc } from "prettier";
import { Function } from "./parser/wat-modules";
import { Print } from "./types";
import { WatNode } from "./parser/wat";
import { printWithBlankLines } from "./printer-utils";

const { group, indent, hardline, join, line } = doc.builders;

export function printFunction(
	node: Function,
	path: AstPath<WatNode>,
	options: unknown,
	print: Print,
): Doc {
	const signature: Doc[] = ["(func"];
	if (node.id) {
		signature.push(" ", print("id"));
	}
	if (node.export_) {
		signature.push(" ", print("export_"));
	}
	const typeuse = print("typeuse");
	if (typeuse !== "") {
		signature.push(indent([line, typeuse]));
	}
	const parts: Doc[] = [group(signature)];
	if (node.locals.length > 0) {
		parts.push(
			indent([
				line,
				group(
					join(line, path.map(printWithBlankLines(print, options), "locals")),
				),
			]),
		);
	}

	if (node.instructions.length > 0) {
		parts.push(
			indent([
				line,
				join(
					hardline,
					path.map(printWithBlankLines(print, options), "instructions"),
				),
			]),
		);
	}

	parts.push(hardline, ")");
	return group(parts);
}
