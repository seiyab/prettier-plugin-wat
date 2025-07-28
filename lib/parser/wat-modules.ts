import {
	Fail,
	literal,
	ParserInput,
	ParserOutput,
	Node,
	parser,
	isError,
	isSuccess,
	Unknown,
	Parser,
	do_,
	many,
} from "./p";
import { spaces } from "./wat-misc";
import { identifier, Identifier } from "./wat-values";
import { valtype, ValueType } from "./wat-types";
import { Instruction, variableInstruction } from "./wat-instructions";

export type ModuleNodes = Program | Module | Function;

export type Program = {
	type: "Program";
	body: (Node<Module> | Node<Unknown>)[];
};
export function program(input: ParserInput): ParserOutput<Program> {
	const { source } = input;
	let { index } = input;
	const body: Node<Module | Unknown>[] = [];
	while (index < source.length) {
		const out = parser(module_).parse({ source, index });
		index = out.nextInput.index;
		if (isError(out)) {
			body.push({
				type: "Unknown",
				value: source.slice(index),
				loc: { start: { offset: input.index }, end: { offset: source.length } },
			});
			index = source.length;
			break;
		} else if (isSuccess(out)) {
			body.push(out.node);
		} else {
			// FIXME -- shouldn't reach here but type narrowing forces redundant `if`
			throw new Error();
		}
	}
	return { node: { type: "Program", body }, nextInput: { source, index } };
}

export type Module = { type: "Module"; id?: Node<Identifier> };
export const module_: Parser<Module | Fail> = do_(($) => {
	void $(literal("("));
	void $(spaces);
	void $(literal("module"));
	void $(spaces);
	const id = $(parser(identifier).opt());
	// TODO: modulefields
	void $(spaces);
	void $(literal(")"));
	return { type: "Module", id: id.type !== "None" ? id : undefined };
});

type Param = { type: "Param"; id?: Node<Identifier>; v: Node<ValueType> };
const param: Parser<Param | Fail> = do_(($) => {
	void $(literal("("));
	void $(spaces);
	void $(literal("param"));
	void $(spaces);
	const id = $(parser(identifier).opt());
	void $(spaces);
	const v = $(valtype);
	void $(spaces);
	void $(literal(")"));
	return { type: "Param", id: id.type === "None" ? undefined : id, v };
});

type Local = { type: "Local"; id?: Node<Identifier>; v: Node<ValueType> };
const local: Parser<Local | Fail> = do_(($) => {
	void $(literal("("));
	void $(spaces);
	void $(literal("local"));
	void $(spaces);
	const id = $(parser(identifier).opt());
	void $(spaces);
	const v = $(valtype);
	void $(spaces);
	void $(literal(")"));
	return { type: "Local", id: id.type === "None" ? undefined : id, v };
});

type Result = { type: "Result"; v: Node<ValueType> };
const result: Parser<Result | Fail> = do_(($) => {
	void $(literal("("));
	void $(spaces);
	void $(literal("result"));
	void $(spaces);
	const v = $(valtype);
	void $(spaces);
	void $(literal(")"));
	return { type: "Result", v };
});

export type Function = {
	type: "Function";
	id?: Node<Identifier>;
	params: Node<Param>[];
	locals: Node<Local>[];
	results: Node<Result>[];
	instructions: Node<Instruction>[];
};
export const function_: Parser<Function | Fail> = do_(($) => {
	void $(literal("("));
	void $(spaces);
	void $(literal("func"));
	void $(spaces);
	const id = $(parser(identifier).opt());
	void $(spaces);
	const params = $(
		many(
			do_(($) => {
				const p = $(param);
				void $(spaces);
				return p;
			}),
		),
	).nodes;
	const locals = $(
		many(
			do_(($) => {
				const p = $(local);
				void $(parser(spaces).opt());
				return p;
			}),
		),
	).nodes;
	const results = $(
		many(
			do_(($) => {
				const p = $(result);
				void $(spaces);
				return p;
			}),
		),
	).nodes;
	void $(spaces);
	const instructions = $(
		many(
			do_(($) => {
				const instr = $(variableInstruction);
				void $(spaces);
				return instr;
			}),
		),
	);
	void $(spaces);
	void $(literal(")"));
	return {
		type: "Function",
		id: id.type === "None" ? undefined : id,
		params,
		locals,
		results,
		instructions: instructions.nodes,
	};
});
