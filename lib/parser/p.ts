/**
 * This file provides domain-inspecific parser implementation &  utilities
 */

import { Comment, gap } from "./wat-lexical-format";

export type ParserInput = { source: string; index: number };
export type ParserOutput<T extends Typed> =
	| { node: T; nextInput: ParserInput }
	| Error;
export type ParserFunc<T extends Typed> = (i: ParserInput) => ParserOutput<T>;

export type Parser<T extends Typed> = { parse: ParserFunc<Node<T>> };

type Location = { start: { offset: number }; end: { offset: number } };

export type Node<T extends Typed> = T & {
	loc: Location;
	comments?: Node<Comment>[];
};
export type Typed = { type: string; comments?: Node<Comment>[] };

export type Unknown = { type: "Unknown"; value: string };
export type None = { type: "None" };

export class ParseError extends Error {
	at: number;

	constructor(error: Error | string, input: ParserInput) {
		const { line, column } = ParseError.position(input);
		const message = error instanceof Error ? error.message : error;

		super(`at line ${line}, column ${column}: ${message}`);
		this.name = "ParseError";
		this.at = input.index;

		if (error instanceof Error) {
			this.stack = error.stack;
		} else {
			Error.captureStackTrace(this, ParseError);
		}
	}

	static position(input: ParserInput): { line: number; column: number } {
		const lines = input.source.split("\n");
		let i = 0;
		let cnt = 0;
		for (const line of lines) {
			const len = line.length + 1;
			if (input.index <= cnt + len) break;
			i += 1;
			cnt += len;
		}
		return { line: i + 1, column: input.index - cnt + 1 };
	}
}

export function parser<T extends Typed>(
	p: ParserFunc<T> | Parser<T>,
): Parser<T> {
	if (typeof p !== "function") return p;
	const fn = p;
	return { parse };

	function parse(input: ParserInput): ParserOutput<Node<T>> {
		const out = fn(input);
		if (out instanceof ParseError) return out;
		if (out instanceof Error) return new ParseError(out, input);
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

type Tools = {
	<S extends Typed>(p: Parser<S> | ParserFunc<S>): Node<S>;
	peek: (p: Parser<Typed> | ParserFunc<Typed>) => boolean;
};

type DoOptions = { separator: Parser<Typed> | ParserFunc<Typed> };

export function do_<T extends Typed>(
	process: ($: Tools) => T,
	opts?: DoOptions,
): Parser<T> {
	class Interrupt extends Error {
		cause: Error;
		constructor(cause: Error) {
			super(cause.message);
			this.cause = cause;
		}
	}

	const separator = parser(opts?.separator ?? gap);

	return parser(p);
	function p(input: ParserInput): ParserOutput<T> {
		let currentInput = input;
		const comments: Node<Comment>[] = [];

		$.peek = (p: Parser<Typed> | ParserFunc<Typed>): boolean => {
			let tempInput = currentInput;
			if (separator != null && input.index !== currentInput.index) {
				const g = separator.parse(tempInput);
				if (!(g instanceof Error)) {
					tempInput = g.nextInput;
				}
			}
			const out = parser(p).parse(tempInput);
			return !(out instanceof Error);
		};

		try {
			const node = process($);
			return {
				node: { ...node, comments: comments.concat(node.comments ?? []) },
				nextInput: currentInput,
			};
		} catch (e: unknown) {
			if (e instanceof Interrupt) return e.cause;
			throw e;
		}

		function $<S extends Typed>(p: Parser<S> | ParserFunc<S>): Node<S> {
			if (separator != null && input.index !== currentInput.index) {
				const g = separator.parse(currentInput);
				if (!(g instanceof Error)) {
					currentInput = g.nextInput;
					comments.push(...(g.node.comments ?? []));
				}
			}
			const out = parser(p).parse(currentInput);
			if (out instanceof ParseError) throw new Interrupt(out);
			if (out instanceof Error)
				throw new Interrupt(new ParseError(out, currentInput));
			currentInput = out.nextInput;
			return out.node;
		}
	}
}

export function nop(input: ParserInput): ParserOutput<None> {
	return { node: { type: "None" }, nextInput: input };
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
		return new Error(
			`expected ${s}, but got ${source.substring(index, index + s.length)}`,
		);
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
		let error: Error | undefined;
		for (const p of parsers) {
			const out = parser(p).parse(input);
			if (out instanceof ParseError) {
				const cur = error instanceof ParseError ? error.at : -1;
				if (cur < out.at) error = out;
				continue;
			}
			if (out instanceof Error) {
				if (error === undefined) error = out;
				continue;
			}
			return out;
		}
		return error ?? new Error();
	}
}

export type Many<T extends Typed> = { type: "Many"; nodes: Node<T>[] };
export function many<T extends Typed>(
	elem: Parser<T> | ParserFunc<T>,
): Parser<Many<T>> {
	return do_(($) => {
		const nodes: Node<T>[] = [];
		for (;;) {
			if (!$.peek(elem)) break;
			nodes.push($(elem));
		}
		return { type: "Many", nodes };
	});
}

export function eof(input: ParserInput): ParserOutput<None> {
	if (input.index === input.source.length)
		return { node: { type: "None" }, nextInput: input };
	return new Error(`unexpected character "${input.source[input.index]}"`);
}
