export type ParserInput = { source: string; index: number };
export type ParserOutput<T extends Typed> = { node: T; nextInput: ParserInput };
export type ParserFunc<T extends Typed> = (i: ParserInput) => ParserOutput<T>;

export type Parser<T extends Typed> = {
	parse: ParserFunc<Node<T>>;
	map: <U extends Typed>(f: (v: T) => U) => Parser<U>;
};

type Location = { start: { offset: number }; end: { offset: number } };

export type Node<T extends Typed> = T & { loc: Location };
type Typed = { type: string };

export type Fail = { type: "error"; reason?: string };

export function parser<T extends Typed>(fn: ParserFunc<T>): Parser<T> {
	return { parse, map };

	function parse(input: ParserInput): ParserOutput<Node<T>> {
		const { node, nextInput } = fn(input);
		return {
			node: {
				...node,
				loc: {
					start: { offset: input.index },
					end: { offset: nextInput.index },
				},
			},
			nextInput,
		};
	}

	function map<U extends Typed>(f: (v: T) => U): Parser<U> {
		return parser(newFn);
		function newFn(input: ParserInput): ParserOutput<U> {
			const out = fn(input);
			return { ...out, node: f(out.node) };
		}
	}
}

export function literal<Type extends string>(
	t: Type,
	s: string,
): Parser<{ type: Type; value: string } | Fail> {
	return parser(parse);

	function parse({
		source,
		index,
	}: ParserInput): ParserOutput<{ type: Type; value: string } | Fail> {
		if (source.startsWith(s, index))
			return {
				node: { type: t, value: s },
				nextInput: { source, index: index + s.length },
			};
		return { node: { type: "error" }, nextInput: { source, index } };
	}
}
