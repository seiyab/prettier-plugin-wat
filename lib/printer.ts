import { Doc, doc, Printer } from "prettier";
import { WatNode } from "./parser/wat";
import { Print } from "./types";
import { printFunction } from "./print-function";
import { printFoldedIfInstruction } from "./print-folded-if-struction";

const { group, indent, softline, hardline, join, line } = doc.builders;

export const print: Printer<WatNode>["print"] = (
	path,
	_options,
	print: Print,
) => {
	const node = path.node;

	switch (node.type) {
		case "Program":
			return [join(hardline, path.map(print, "body")), hardline];
		case "Module": {
			const parts: Doc[] = ["(module"];
			if (node.id) {
				parts.push(" ", path.call(print, "id"));
			}
			if (node.modulefields && node.modulefields.length > 0) {
				parts.push(
					indent([hardline, join(hardline, path.map(print, "modulefields"))]),
				);
			}
			parts.push(softline, ")");
			return group(parts);
		}
		case "Function": {
			return printFunction(node, path, print);
		}
		case "Identifier":
			return node.value;
		case "Param":
			return group([
				"(param ",
				path.call(print, "id"),
				" ",
				path.call(print, "v"),
				")",
			]);
		case "Result":
			return group(["(result ", path.call(print, "v"), ")"]);
		case "ValueType":
			return node.value;
		case "InlineExport":
			return group(["(export ", path.call(print, "name"), ")"]);
		case "StringLiteral":
			return `"${node.value}"`;
		case "Integer":
			return node.text;
		case "FoldedPlainInstruction": {
			const body = [];
			if (node.operands.length > 0) {
				body.push(indent([line, join(line, path.map(print, "operands"))]));
			}
			return group(["(", path.call(print, "operator"), body, ")"]);
		}
		case "VariableInstruction":
			return [node.op, " ", path.call(print, "index")];
		case "NumericSimpleInstruction":
			return node.op;
		case "NumericConstInstruction":
			return [node.op, " ", path.call(print, "val")];
		case "Comment":
			throw new Error("should not be reached if printComment is defined");
		case "FoldedIfInstruction":
			return printFoldedIfInstruction(node, path, print);
		default:
			throw new Error(`Unknown node type: ${node.type}`);
	}
};
