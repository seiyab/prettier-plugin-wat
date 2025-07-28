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
} from "./p";
import { spaces } from "./wat-misc";
import { identifier, Identifier } from "./wat-values";

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

type Module = { type: "Module"; id?: Node<Identifier> };
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
