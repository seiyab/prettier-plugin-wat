import { Doc, doc, Printer } from "prettier";
import { WatNode } from "./parser/wat";
import { printFunction } from "./print-function";
import { printFoldedIfInstruction } from "./print-folded-if-instruction";
import { printTypeUse } from "./print-typeuse";
import { printFoldedBlockInstruction } from "./print-folded-block-instruction";
import { printFoldedLoopInstruction } from "./print-folded-loop-instruction";
import { printBlockInstruction } from "./print-block-instruction";
import { printLoopInstruction } from "./print-loop-instruction";
import { printIfInstruction } from "./print-if-instruction";
import { printModule } from "./print-module";
import { printFunctionType } from "./print-function-type";
import { printParam } from "./print-param";
import { printFoldedPlainInstruction } from "./print-folded-plain-instruction";
import { printImport } from "./print-import";
import { printImportDesc } from "./print-import-desc";
import { printMemarg } from "./print-memarg";
import { printVectorConstInstruction } from "./print-vector-const-instruction";
import { printMemory } from "./print-memory";
import { printTable } from "./print-table";
import { printDataSegment } from "./print-data-segment";
import { printLocal } from "./print-local";
import { printGlobal } from "./print-global";
import { printElementSegment } from "./print-element-segment";
import { Print } from "./types";
import { printType } from "./print-type";

const { group, indent, hardline, join, line } = doc.builders;

export const print: Printer<WatNode>["print"] = (
	path,
	options,
	print: Print,
) => {
	const node = path.node;

	switch (node.type) {
		case "Program":
			return [join(hardline, path.map(print, "body")), hardline];
		case "Module":
			return printModule(node, path, options, print);
		case "Function":
			return printFunction(node, path, print);
		case "FunctionType":
			return printFunctionType(node, path, print);
		case "Type":
			return printType(node, path, print);
		case "TypeUse":
			return printTypeUse(node, path, print);
		case "Identifier":
			return node.value;
		case "Param":
			return printParam(node, path, print);
		case "Result":
			return group([
				"(result",
				indent([line, join(line, path.map(print, "valtype"))]),
				")",
			]);
		case "NumberType":
			return node.value;
		case "VectorType":
			return node.value;
		case "ReferenceType":
			return node.value;
		case "InlineExport":
			return group(["(export ", path.call(print, "name"), ")"]);
		case "StringLiteral":
			return `"${node.value}"`;
		case "Integer":
			return node.text;
		case "FoldedPlainInstruction":
			return printFoldedPlainInstruction(node, path, print);
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
		case "FoldedLoopInstruction":
			return printFoldedLoopInstruction(node, path, print);
		case "FoldedBlockInstruction":
			return printFoldedBlockInstruction(node, path, print);
		case "IfInstruction":
			return printIfInstruction(node, path, print);
		case "BlockInstruction":
			return printBlockInstruction(node, path, print);
		case "LoopInstruction":
			return printLoopInstruction(node, path, print);
		case "PlainControlInstruction": {
			const parts: Doc[] = [node.op];
			if (node.args.length > 0) {
				parts.push(" ", join(" ", path.map(print, "args")));
			}
			return group(parts);
		}
		case "ParametricInstruction": {
			const parts: Doc[] = [node.op];
			if (node.args) {
				parts.push(" ", join(" ", path.map(print, "args")));
			}
			return group(parts);
		}
		case "Import":
			return printImport(node, path, print);
		case "ImportDesc":
			return printImportDesc(node, path, print);
		case "MemType":
			return path.call(print, "limits");
		case "TableType": {
			const parts: Doc[] = [
				path.call(print, "limits"),
				" ",
				path.call(print, "reftype"),
			];
			return group(parts);
		}
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
		case "Memarg":
			return printMemarg(node, path, print);
		case "VectorConstInstruction":
			return printVectorConstInstruction(node, path, print);
		case "VectorSimpleInstruction":
			return node.op;
		case "VectorLaneInstruction": {
			const parts: Doc[] = [node.op, " ", path.call(print, "laneidx")];
			return group(parts);
		}
		case "Memory":
			return printMemory(node, path, print);
		case "Table":
			return printTable(node, path, print);
		case "DataSegment":
			return printDataSegment(node, path, print);
		case "OffsetAbbreviation": {
			return group(["(", path.call(print, "instr"), ")"]);
		}
		case "MemoryInstruction": {
			return [node.op];
		}
		case "Local":
			return printLocal(node, path, print);
		case "Global":
			return printGlobal(node, path, print);
		case "ElementSegment":
			return printElementSegment(node, path, print);
		case "ElementList": {
			const parts: Doc[] = [path.call(print, "reftype")];
			parts.push(indent([line, join(line, path.map(print, "elemexprs"))]));
			return group(parts);
		}
		case "ElementListAbbreviation": {
			return join(line, path.map(print, "funcidxs"));
		}
		case "ElementExpr": {
			return group(["(item ", path.call(print, "expr"), ")"]);
		}
		case "TableUse": {
			return group(["(table ", path.call(print, "index"), ")"]);
		}
		case "Expression": {
			return join(line, path.map(print, "instrs"));
		}
		default:
			throw new Error(`Unknown node type: ${node.type}`);
	}
};
