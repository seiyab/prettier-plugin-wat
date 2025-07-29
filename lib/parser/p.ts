/**
 * This file provides domain-inspecific parser implementation &  utilities
 */

import { spaces } from "./wat-lexical-format";

export type ParserInput = { source: string; index: number };
export type ParserOutput<T extends Typed> = { node: T; nextInput: ParserInput };
export type ParserFunc<T extends Typed> = (i: ParserInput) => ParserOutput<T>;

export type Parser<T extends Typed> = {
	parse: ParserFunc<Node<T>>;
	map: <U extends Typed>(
		f: (v: Exclude<T, Fail>) => U,
	) => Parser<Fail extends T ? U | Fail : U>;
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

	function map<U extends Typed>(
		f: (v: Exclude<T, Fail>) => U,
	): Parser<Fail extends T ? U | Fail : U> {
		return parser(newFn);
		function newFn(
			input: ParserInput,
		): ParserOutput<Fail extends T ? U | Fail : U> {
			const out = parser(fn).parse(input);
			if (isSuccess(out)) return { ...out, node: f(out.node) };
			// @ts-expect-error -- fixme
			return out;
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
	process: (
		$: <S extends Typed>(
			p: Parser<S> | ParserFunc<S>,
		) => Node<Exclude<S, Fail>>,
	) => T,
): Parser<T | Fail> {
	class Interrupt extends Error {}

	return parser(p);
	function p(input: ParserInput): ParserOutput<T | Fail> {
		const skip = spaces(input);
		let currentInput = skip.nextInput;

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
			const skip = spaces(currentInput);
			currentInput = skip.nextInput;
			if (isSuccess(out)) return out.node;
			throw new Interrupt();
		}
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

export function oneOf<T extends Typed>(
	parsers: (Parser<T> | ParserFunc<T>)[],
): Parser<T | Fail> {
	return parser(parse);
	function parse(input: ParserInput): ParserOutput<T | Fail> {
		for (const p of parsers) {
			const out = parser(p).parse(input);
			if (isSuccess(out)) return out;
		}
		return { node: { type: "Error" }, nextInput: input };
	}
}

function location(loc: { start: number; end: number }): Location {
	return { start: { offset: loc.start }, end: { offset: loc.end } };
}

type Many<T extends Typed> = { type: "Many"; nodes: Node<T>[] };
export function many<T extends Typed>(
	elem: Parser<T> | ParserFunc<T>,
): Parser<Many<Exclude<T, Fail>>> {
	const p = parser(elem);
	return parser(parse);
	function parse(input: ParserInput): ParserOutput<Many<Exclude<T, Fail>>> {
		const nodes: Node<Exclude<T, Fail>>[] = [];
		let currentInput = input;
		for (;;) {
			const out = p.parse(currentInput);
			if (isError(out)) {
				break;
			}
			if (isSuccess(out)) {
				nodes.push(out.node);
				currentInput = out.nextInput;
			}
		}
		return { node: { type: "Many", nodes }, nextInput: currentInput };
	}
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
