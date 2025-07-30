import { literal, Node, Parser, do_, many, opt, eof } from "./p";
import { identifier, Identifier } from "./wat-values";
import { param, Param, result, Result, valtype, ValueType } from "./wat-types";
import { Instruction, variableInstruction } from "./wat-instructions";

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

export type Module = { type: "Module"; id?: Node<Identifier> };
export const module_: Parser<Module> = do_(($) => {
	void $(literal("("));
	void $(literal("module"));
	const id = $(opt(identifier));
	// TODO: modulefields
	void $(literal(")"));
	return { type: "Module", id: id.type !== "None" ? id : undefined };
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
	const locals = $(many(do_(($) => $(local)))).nodes;
	const results = $(many(do_(($) => $(result)))).nodes;
	const instructions = $(many(do_(($) => $(variableInstruction)))).nodes;
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
