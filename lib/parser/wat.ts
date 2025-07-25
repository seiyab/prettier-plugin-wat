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
} from "./p";

export type WatNode = Unknown | Program | Module;

export function parse(source: string): Node<WatNode> {
	return parser(program).parse({ source, index: 0 }).node;
}

type Program = { type: "Program"; body: (Node<Module> | Node<Unknown>)[] };
function program(input: ParserInput): ParserOutput<Program> {
	const { source } = input;
	let { index } = input;
	const body: Node<Module | Unknown>[] = [];
	while (index < source.length) {
		const out = parser(module).parse({ source, index });
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

type Module = { type: "Module" };
function module(input: ParserInput): ParserOutput<Module | Fail> {
	return literal("(module)")
		.map((n) => ({ ...n, type: "Module" as const }))
		.parse(input);
}
