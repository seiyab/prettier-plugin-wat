import { AstPath, doc, Doc } from "prettier";
import { Function } from "./parser/wat-modules";
import { Print } from "./types";
import { WatNode } from "./parser/wat";

const { group, indent, hardline, join, line } = doc.builders;

export function printFunction(
	node: Function,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const signature: Doc[] = ["(func"];
	if (node.id) {
		signature.push(" ", path.call(print, "id"));
	}
	if (node.export_) {
		signature.push(" ", path.call(print, "export_"));
	}
	const typeuse: Doc[] = [];
	if (node.params.length > 0) {
		typeuse.push(group(join(line, path.map(print, "params"))));
	}
	if (node.results.length > 0) {
		typeuse.push(group(join(line, path.map(print, "results"))));
	}
	if (typeuse.length > 0) {
		signature.push(indent([line, group(join(line, typeuse))]));
	}
	const parts: Doc[] = [group(signature)];
	if (node.locals.length > 0) {
		parts.push(indent([line, group(join(line, path.map(print, "locals")))]));
	}

	if (node.instructions.length > 0) {
		parts.push(indent([line, join(hardline, path.map(print, "instructions"))]));
	}

	parts.push(hardline, ")");
	return group(parts);
}
