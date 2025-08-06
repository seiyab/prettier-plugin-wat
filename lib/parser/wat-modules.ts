import {
	literal,
	AST,
	Parser,
	do_,
	many,
	opt,
	eof,
	oneOf,
	Many,
	Node,
} from "./p";
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
import { Comment, gap } from "./wat-lexical-format";

export type ModuleNodes = Program | Module | Function;
export type ModuleElement = FunctionElement;

export type Program = { type: "Program"; body: AST<Module>[] };
export const program: Parser<Program> = do_(($) => {
	const comments: AST<Comment>[] = [];
	const body: AST<Module>[] = [];
	comments.push(...$(gap).comments);
	for (;;) {
		if (!$.peek(literal("("))) break;
		const m = $(module_);
		body.push(m);
	}
	comments.push(...$(gap).comments);
	void $(eof);
	return { type: "Program", body, comments };
});

export type Export = {
	type: "Export";
	name: AST<StringLiteral>;
	exportdesc: AST<ExportDesc>;
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
	index: AST<Index>;
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
	id?: AST<Identifier>;
	modulefields: AST<ModuleField>[];
};
// TODO: other modulefields
type ModuleField = Export | Function;
export const module_: Parser<Module> = do_(($) => {
	void $(literal("("));
	void $(literal("module"));
	const id = $(opt(identifier));
	const modulefields: AST<ModuleField>[] = [];
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

type Local = { type: "Local"; id?: AST<Identifier>; v: AST<ValueType> };
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
	id?: AST<Identifier>;
	export_?: AST<InlineExport>;
	params: AST<Param>[];
	locals: AST<Local>[];
	results: AST<Result>[];
	instructions: AST<InstructionNode>[];
};
export const function_: Parser<Function> = do_(($) => {
	const comments: AST<Comment>[] = [];
	const m = <T extends Node>(mn: AST<Many<T>>): AST<Many<T>> => {
		comments.push(...(mn.comments ?? []));
		return mn;
	};
	void $(literal("("));
	void $(literal("func"));
	const id = $(opt(identifier));
	const expt = $(opt(inlineExport));
	const params = m($(many(param))).nodes;
	const results = m($(many(result))).nodes;
	const locals = m($(many(local))).nodes;
	const instructions = m($(many(instruction))).nodes;
	void $(literal(")"));
	return {
		type: "Function",
		id: id.type === "None" ? undefined : id,
		export_: expt.type === "None" ? undefined : expt,
		params,
		locals,
		results,
		instructions,
		comments,
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
