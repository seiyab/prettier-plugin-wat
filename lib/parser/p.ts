/**
 * This file provides domain-inspecific parser implementation &  utilities
 */

import { spaces } from "./wat-lexical-format";

export type ParserInput = { source: string; index: number };
export type ParserOutput<T extends Typed> =
	| { node: T; nextInput: ParserInput }
	| Error;
export type ParserFunc<T extends Typed> = (i: ParserInput) => ParserOutput<T>;

export type Parser<T extends Typed> = { parse: ParserFunc<Node<T>> };

type Location = { start: { offset: number }; end: { offset: number } };

export type Node<T extends Typed> = T & { loc: Location };
type Typed = { type: string };

export type Unknown = { type: "Unknown"; value: string };
export type None = { type: "None" };

export function parser<T extends Typed>(
	p: ParserFunc<T> | Parser<T>,
): Parser<T> {
	if (typeof p !== "function") return p;
	const fn = p;
	return { parse };

	function parse(input: ParserInput): ParserOutput<Node<T>> {
		const out = fn(input);
		if (out instanceof Error) return out;
		const { node, nextInput } = out;
		return {
			node: {
				...node,
				loc: location({ start: input.index, end: nextInput.index }),
			},
			nextInput: nextInput,
		};
	}
}

function location(loc: { start: number; end: number }): Location {
	return { start: { offset: loc.start }, end: { offset: loc.end } };
}

export function do_<T extends Typed>(
	process: ($: <S extends Typed>(p: Parser<S> | ParserFunc<S>) => Node<S>) => T,
): Parser<T> {
	class Interrupt extends Error {
		cause: Error;
		constructor(cause: Error) {
			super(cause.message);
			this.cause = cause;
		}
	}

	return parser(p);
	function p(input: ParserInput): ParserOutput<T> {
		const skip = spaces(input);
		let currentInput = skip instanceof Error ? input : skip.nextInput;

		try {
			const node = process($);
			return { node, nextInput: currentInput };
		} catch (e: unknown) {
			if (e instanceof Interrupt) return e.cause;
			throw e;
		}

		function $<S extends Typed>(p: Parser<S> | ParserFunc<S>): Node<S> {
			const out = parser(p).parse(currentInput);
			if (out instanceof Error) throw new Interrupt(out);
			currentInput = out.nextInput;
			const skip = spaces(currentInput);
			if (!(skip instanceof Error)) {
				currentInput = skip.nextInput;
			}
			return out.node;
		}
	}
}

type Literal = { type: "Literal"; value: string };
export function literal(s: string): Parser<Literal> {
	return parser(parse);

	function parse({ source, index }: ParserInput): ParserOutput<Literal> {
		if (source.startsWith(s, index))
			return {
				node: { type: "Literal", value: s },
				nextInput: { source, index: index + s.length },
			};
		return new Error();
	}
}

export function opt<T extends Typed>(p: Parser<T> | ParserFunc<T>) {
	return parser(parse);
	function parse(input: ParserInput): ParserOutput<T | None> {
		const out = parser(p).parse(input);
		if (!(out instanceof Error)) return out;
		return { node: { type: "None" }, nextInput: input };
	}
}

export function oneOf<T extends Typed>(
	parsers: (Parser<T> | ParserFunc<T>)[],
): Parser<T> {
	return parser(parse);
	function parse(input: ParserInput): ParserOutput<T> {
		for (const p of parsers) {
			const out = parser(p).parse(input);
			if (out instanceof Error) continue;
			return out;
		}
		return new Error();
	}
}

type Many<T extends Typed> = { type: "Many"; nodes: Node<T>[] };
export function many<T extends Typed>(
	elem: Parser<T> | ParserFunc<T>,
): Parser<Many<T>> {
	const p = parser(elem);
	return parser(parse);
	function parse(input: ParserInput): ParserOutput<Many<T>> {
		const nodes: Node<T>[] = [];
		let currentInput = input;
		for (;;) {
			const out = p.parse(currentInput);
			if (out instanceof Error) {
				break;
			}
			nodes.push(out.node);
			currentInput = out.nextInput;
		}
		return { node: { type: "Many", nodes }, nextInput: currentInput };
	}
}

export function eof(input: ParserInput): ParserOutput<None> {
	if (input.index === input.source.length)
		return { node: { type: "None" }, nextInput: input };
	return new Error(`unexpected character "${input.source[input.index]}"`);
}
