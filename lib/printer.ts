import { Doc, doc, Printer } from "prettier";
import { WatNode } from "./parser/wat";

const { group, indent, softline, hardline, join, line } = doc.builders;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- FIXME
type Print = (...args: any[]) => Doc;

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
			parts.push(")");
			return group(parts);
		}
		case "Function": {
			const parts: Doc[] = ["(func"];
			if (node.id) {
				parts.push(" ", path.call(print, "id"));
			}
			if (node.export_) {
				parts.push(" ", path.call(print, "export_"));
			}
			if (node.params) {
				parts.push(" ");
				parts.push(join(" ", path.map(print, "params")));
			}
			if (node.results) {
				parts.push(" ");
				parts.push(join(" ", path.map(print, "results")));
			}
			if (node.locals) {
				parts.push(" ");
				parts.push(join(" ", path.map(print, "locals")));
			}

			if (node.instructions && node.instructions.length > 0) {
				parts.push(indent([line, join(line, path.map(print, "instructions"))]));
			}

			parts.push(")");
			return group(parts);
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
		case "FoldedPlainInstruction":
			return group([
				"(",
				path.call(print, "operator"),
				indent([softline, join(softline, path.map(print, "operands"))]),
				")",
			]);
		case "VariableInstruction":
			return [node.op, " ", path.call(print, "index")];
		case "NumericInstruction":
			return node.op;
		case "Comment":
			throw new Error("should not be reached if printComment is defined");
		default:
			throw new Error(`Unknown node type: ${node.type}`);
	}
};
