/**
 * This file provides domain-inspecific parser implementation &  utilities
 */

export type ParserInput = { source: string; index: number };
export type ParserOutput<T extends Typed> = { node: T; nextInput: ParserInput };
export type ParserFunc<T extends Typed> = (i: ParserInput) => ParserOutput<T>;

export type Parser<T extends Typed> = {
	parse: ParserFunc<Node<T>>;
	map: <U extends Typed>(f: (v: T) => U) => Parser<U>;
	opt: () => Parser<Exclude<T, Fail> | None>;
};

type Location = { start: { offset: number }; end: { offset: number } };

export type Node<T extends Typed> = T & { loc: Location };
type Typed = { type: string };

export type Fail = { type: "Error"; reason?: string };
export type Unknown = { type: "Unknown"; value: string };
export type None = { type: "None" };

export function parser<T extends Typed>(
	p: ParserFunc<T> | Parser<T>,
): Parser<T> {
	if (typeof p !== "function") return p;
	const fn = p;
	return { parse, map, opt };

	function parse(input: ParserInput): ParserOutput<Node<T>> {
		const { node, nextInput } = fn(input);
		return {
			node: {
				...node,
				loc: location({ start: input.index, end: nextInput.index }),
			},
			nextInput: node.type === "Error" ? input : nextInput,
		};
	}

	function map<U extends Typed>(f: (v: T) => U): Parser<U> {
		return parser(newFn);
		function newFn(input: ParserInput): ParserOutput<U> {
			const out = fn(input);
			return { ...out, node: f(out.node) };
		}
	}

	function opt(): Parser<Exclude<T, Fail> | None> {
		return parser(optFn);
		function optFn(input: ParserInput): ParserOutput<Exclude<T, Fail> | None> {
			const out = parser(fn).parse(input);
			if (isSuccess(out)) return out;
			return { node: { type: "None" }, nextInput: input };
		}
	}
}

export function do_<T extends Typed>(
	process: ($: <S extends Typed>(p: Parser<S> | ParserFunc<S>) => Node<S>) => T,
): Parser<T | Fail> {
	class Interrupt extends Error {}

	return parser(p);
	function p(input: ParserInput): ParserOutput<T | Fail> {
		let currentInput = input;

		try {
			const node = process($);
			return { node, nextInput: currentInput };
		} catch (e: unknown) {
			if (e instanceof Interrupt) {
				return { node: { type: "Error" }, nextInput: input };
			}
			throw e;
		}

		function $<S extends Typed>(
			p: Parser<S> | ParserFunc<S>,
		): Node<Exclude<S, Fail>> {
			const out = parser(p).parse(currentInput);
			currentInput = out.nextInput;
			if (isSuccess(out)) return out.node;
			throw new Interrupt();
		}
	}
}

type Synchronized<
	Open extends Typed,
	Body extends Typed,
	Close extends Typed,
> = {
	type: "Synchronized";
	open: Node<Open>;
	body: Node<Body>;
	close: Node<Close>;
};
type Recovered<Open extends Typed, Body extends Typed, Close extends Typed> = {
	type: "Recovered";
	open: Node<Open>;
	body?: Node<Body>;
	close: Node<Close>;
	rest: Node<Unknown>;
};
/**
 * synchronized
 * - parses open, body and close sequentially
 * - when open fails to parse, synchronized results Fail
 * - when it fails to parse after open, it searches close and recover on find
 */
export function synchronized<
	Open extends Typed,
	Body extends Typed,
	Close extends Typed,
>({
	open,
	body,
	close,
}: {
	open: ParserFunc<Open | Fail> | Parser<Open | Fail>;
	body: ParserFunc<Body | Fail> | Parser<Body | Fail>;
	close: ParserFunc<Close | Fail> | Parser<Close | Fail>;
}): Parser<
	Synchronized<Open, Body, Close> | Recovered<Open, Body, Close> | Fail
> {
	return parser(parse);

	function parse(
		input: ParserInput,
	): ParserOutput<
		Synchronized<Open, Body, Close> | Recovered<Open, Body, Close> | Fail
	> {
		let current = input;
		const oo = parser(open).parse(current);
		if (isError(oo)) return oo;
		// @ts-expect-error -- fixme
		const openNode: Node<Open> = oo.node;
		current = oo.nextInput;

		const bo = parser(body).parse(current);
		if (isError(bo)) {
			const r = parser(recover({ open: openNode })).parse(current);
			if (!isSuccess(r)) return bo;
			return r;
		}

		// @ts-expect-error -- fixme
		const bodyNode: Node<Body> = bo.node;
		current = bo.nextInput;

		const co = parser(close).parse(current);
		if (isError(co)) {
			const r = parser(recover({ open: openNode, body: bodyNode })).parse(
				current,
			);
			if (!isSuccess(r)) return co;
			return r;
		}

		return {
			node: {
				type: "Synchronized",
				open: openNode,
				body: bodyNode,
				// @ts-expect-error -- fixme
				close: co.node,
			},
			nextInput: co.nextInput,
		};
	}

	type Progress = { open: Node<Open>; body?: Node<Body> };
	function recover(
		progress: Progress,
	): (i: ParserInput) => ParserOutput<Recovered<Open, Body, Close> | Fail> {
		const cp = parser(close);
		return (input) => {
			for (let i = input.index; i < input.source.length; i++) {
				const currentInput = { source: input.source, index: i };
				const co = cp.parse(currentInput);
				if (!isSuccess(co)) continue;
				return {
					node: {
						type: "Recovered",
						open: progress.open,
						body: progress.body,
						rest: unknown(input.source, { start: input.index, end: i }),
						close: co.node,
					},
					nextInput: { ...input, index: input.source.length },
				};
			}
			return {
				node: { type: "Error" },
				nextInput: { ...input, index: input.index },
			};
		};
	}
}

type Literal = { type: "Literal"; value: string };
export function literal(s: string): Parser<Literal | Fail> {
	return parser(parse);

	function parse({ source, index }: ParserInput): ParserOutput<Literal | Fail> {
		if (source.startsWith(s, index))
			return {
				node: { type: "Literal", value: s },
				nextInput: { source, index: index + s.length },
			};
		return { node: { type: "Error" }, nextInput: { source, index } };
	}
}

function unknown(
	source: string,
	loc: { start: number; end: number },
): Node<Unknown> {
	return {
		type: "Unknown",
		value: source.substring(loc.start, loc.end),
		loc: location(loc),
	};
}

function location(loc: { start: number; end: number }): Location {
	return { start: { offset: loc.start }, end: { offset: loc.end } };
}

export function isError<T extends Typed>(
	out: ParserOutput<Node<T | Fail>>,
): out is ParserOutput<Node<Fail>> {
	return out.node.type === "Error";
}

export function isSuccess<T extends Typed>(
	out: ParserOutput<Node<T>>,
): out is ParserOutput<Node<Exclude<T, Fail>>> {
	return out.node.type !== "Error";
}
