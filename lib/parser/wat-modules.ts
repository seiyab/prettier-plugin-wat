import { literal, Node, Parser, do_, many, opt, eof } from "./p";
import {
	identifier,
	Identifier,
	index,
	Index,
	stringLiteral,
	StringLiteral,
} from "./wat-values";
import { param, Param, result, Result, valtype, ValueType } from "./wat-types";
import { Instruction, instruction } from "./wat-instructions";

export type ModuleNodes = Program | Module | Function;

export type Program = { type: "Program"; body: Node<Module>[] };
export const program: Parser<Program> = do_(($) => {
	const body: Node<Module>[] = [];
	for (;;) {
		const m = $(opt(module_));
		if (m.type === "None") break;
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
export type ExportDesc = FuncExport;
export type FuncExport = { type: "FuncExport"; index: Node<Index> };
export const export_: Parser<Export> = do_(($) => {
	void $(literal("("));
	void $(literal("export"));
	const name = $(stringLiteral);
	const exportdesc = $(
		do_<FuncExport>(($) => {
			void $(literal("("));
			void $(literal("func"));
			const idx = $(index);
			void $(literal(")"));
			return { type: "FuncExport", index: idx };
		}),
	);
	void $(literal(")"));
	return { type: "Export", name, exportdesc };
});

export type Module = {
	type: "Module";
	id?: Node<Identifier>;
	exports: Node<Export>[];
};
export const module_: Parser<Module> = do_(($) => {
	void $(literal("("));
	void $(literal("module"));
	const id = $(opt(identifier));
	const exports = $(many(do_(($) => $(export_)))).nodes;
	// TODO: other modulefields
	void $(literal(")"));
	return { type: "Module", id: id.type !== "None" ? id : undefined, exports };
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
	params: Node<Param>[];
	locals: Node<Local>[];
	results: Node<Result>[];
	instructions: Node<Instruction>[];
};
export const function_: Parser<Function> = do_(($) => {
	void $(literal("("));
	void $(literal("func"));
	const id = $(opt(identifier));
	const params = $(many(do_(($) => $(param)))).nodes;
	const results = $(many(do_(($) => $(result)))).nodes;
	const locals = $(many(do_(($) => $(local)))).nodes;
	const instructions = $(many(do_(($) => $(instruction)))).nodes;
	void $(literal(")"));
	return {
		type: "Function",
		id: id.type === "None" ? undefined : id,
		params,
		locals,
		results,
		instructions,
	};
});
