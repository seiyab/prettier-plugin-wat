import { AstPath, doc, Doc } from "prettier";
import {} from "prettier/doc";
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
	const typeuse = path.call(print, "typeuse");
	if (typeuse !== "") {
		signature.push(indent([line, typeuse]));
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
