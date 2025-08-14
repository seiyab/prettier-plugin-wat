import { Doc, doc, Printer } from "prettier";
import { WatNode } from "./parser/wat";
import { Print } from "./types";
import { printFunction } from "./print-function";
import { printFoldedIfInstruction } from "./print-folded-if-instruction";
import { printTypeUse } from "./print-typeuse";

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
		case "TypeUse": {
			return printTypeUse(node, path, print);
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
			return group(["(result ", join(line, path.map(print, "valtype")), ")"]);
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
		case "Import":
			return group([
				"(import ",
				path.call(print, "module"),
				" ",
				path.call(print, "name"),
				" ",
				path.call(print, "desc"),
				")",
			]);
		case "ImportDesc": {
			const parts: Doc[] = ["(", node.kind];
			if (node.id) {
				parts.push(" ", path.call(print, "id"));
			}
			switch (node.kind) {
				case "func":
					// TODO: print typeuse
					break;
				case "memory":
					parts.push(" ", path.call(print, "target"));
					break;
			}
			parts.push(")");
			return group(parts);
		}
		case "MemType":
			return path.call(print, "limits");
		case "Limits": {
			const parts: Doc[] = [path.call(print, "min")];
			if (node.max) {
				parts.push(" ", path.call(print, "max"));
			}
			return group(parts);
		}
		case "UInteger":
			return node.text;
		case "VectorMemoryInstruction": {
			const parts: Doc[] = [node.op];
			if (node.memarg) {
				parts.push(" ", path.call(print, "memarg"));
			}
			return group(parts);
		}
		case "Memarg": {
			const parts: Doc[] = [];
			if (node.offset) {
				parts.push(["offset=", path.call(print, "offset")]);
			}
			if (node.align) {
				parts.push(" ", ["align=", path.call(print, "align")]);
			}
			return group(parts);
		}
		case "VectorConstInstruction": {
			const parts: Doc[] = [
				node.op,
				" ",
				node.shape,
				indent([line, join(line, path.map(print, "vals"))]),
			];
			return group(parts);
		}
		case "VectorSimpleInstruction":
			return node.op;
		case "Memory": {
			const parts: Doc[] = ["(memory"];
			if (node.id) {
				parts.push(" ", path.call(print, "id"));
			}
			if (node.export) {
				parts.push(" ", path.call(print, "export"));
			}
			parts.push(" ", path.call(print, "memtype"));
			parts.push(")");
			return group(parts);
		}
		case "DataSegment": {
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
		case "OffsetAbbreviation": {
			return group(["(", path.call(print, "instr"), ")"]);
		}
		case "MemoryInstruction": {
			return [node.op];
		}
		default:
			// @ts-expect-error -- all known types are handled
			throw new Error(`Unknown node type: ${node.type}`);
	}
};
