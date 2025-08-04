import { literal, Node, Parser, do_, many, opt, eof, oneOf } from "./p";
import {
	identifier,
	Identifier,
	index,
	Index,
	stringLiteral,
	StringLiteral,
} from "./wat-values";
import { param, Param, result, Result, valtype, ValueType } from "./wat-types";
import { InstructionNode, instruction } from "./wat-instructions";

export type ModuleNodes = Program | Module | Function;
export type ModuleElement = FunctionElement;

export type Program = { type: "Program"; body: Node<Module>[] };
export const program: Parser<Program> = do_(($) => {
	const body: Node<Module>[] = [];
	for (;;) {
		if (!$.peek(literal("("))) break;
		const m = $(module_);
		body.push(m);
	}
	void $(eof);
	return { type: "Program", body };
});

export type Export = {
	type: "Export";
	name: Node<StringLiteral>;
	exportdesc: Node<ExportDesc>;
};
export const export_: Parser<Export> = do_(($) => {
	void $(literal("("));
	void $(literal("export"));
	const name = $(stringLiteral);
	const ed = $(exportdesc);
	void $(literal(")"));
	return { type: "Export", name, exportdesc: ed };
});
export type ExportDesc = {
	type: "ExportDesc";
	kind: "func" | "table" | "memory" | "global";
	index: Node<Index>;
};
const exportdesc = do_(($): ExportDesc => {
	void $(literal("("));
	const kind = $(literal("func")).value as ExportDesc["kind"];
	const idx = $(index);
	void $(literal(")"));
	return { type: "ExportDesc", kind, index: idx };
});

export type Module = {
	type: "Module";
	id?: Node<Identifier>;
	modulefields: Node<ModuleField>[];
};
// TODO: other modulefields
type ModuleField = Export | Function;
export const module_: Parser<Module> = do_(($) => {
	void $(literal("("));
	void $(literal("module"));
	const id = $(opt(identifier));
	const modulefields: Node<ModuleField>[] = [];
	for (;;) {
		if (!$.peek(literal("("))) break;
		modulefields.push($(oneOf<ModuleField>([export_, function_])));
	}
	void $(literal(")"));
	return {
		type: "Module",
		id: id.type !== "None" ? id : undefined,
		modulefields,
	};
});

type Local = { type: "Local"; id?: Node<Identifier>; v: Node<ValueType> };
const local: Parser<Local> = do_(($) => {
	void $(literal("("));
	void $(literal("local"));
	const id = $(opt(identifier));
	const v = $(valtype);
	void $(literal(")"));
	return { type: "Local", id: id.type === "None" ? undefined : id, v };
});

export type Function = {
	type: "Function";
	id?: Node<Identifier>;
	export_?: Node<InlineExport>;
	params: Node<Param>[];
	locals: Node<Local>[];
	results: Node<Result>[];
	instructions: Node<InstructionNode>[];
};
export const function_: Parser<Function> = do_(($) => {
	void $(literal("("));
	void $(literal("func"));
	const id = $(opt(identifier));
	const expt = $(opt(inlineExport));
	const params = $(many(do_(($) => $(param)))).nodes;
	const results = $(many(do_(($) => $(result)))).nodes;
	const locals = $(many(do_(($) => $(local)))).nodes;
	const instructions = $(many(do_(($) => $(instruction)))).nodes;
	void $(literal(")"));
	return {
		type: "Function",
		id: id.type === "None" ? undefined : id,
		export_: expt.type === "None" ? undefined : expt,
		params,
		locals,
		results,
		instructions,
	};
});
type FunctionElement = InlineExport;
type InlineExport = { type: "InlineExport"; name: StringLiteral };
const inlineExport: Parser<InlineExport> = do_(($) => {
	void $(literal("("));
	void $(literal("export"));
	const name = $(stringLiteral);
	void $(literal(")"));
	return { type: "InlineExport", name };
});
