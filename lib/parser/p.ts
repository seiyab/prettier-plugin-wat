/**
 * This file provides domain-inspecific parser implementation &  utilities
 */

import { Comment, gap } from "./wat-lexical-format";

export type ParserInput = { source: string; index: number };
export type ParserOutput<T extends Node> =
	| { node: T; nextInput: ParserInput }
	| Error;
export type ParserFunc<T extends Node> = (i: ParserInput) => ParserOutput<T>;

export type Parser<T extends Node> = { parse: ParserFunc<AST<T>> };

type Location = { start: { offset: number }; end: { offset: number } };
type Located = { loc: Location };

export type AST<T extends Node> = T &
	Located & { comments?: (Comment & Located)[] };
export type Node = { type: string; comments?: (Comment & Located)[] };

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

export function parser<T extends Node>(
	p: ParserFunc<T> | Parser<T>,
): Parser<T> {
	if (typeof p !== "function") return p;
	const fn = p;
	return { parse };

	function parse(input: ParserInput): ParserOutput<AST<T>> {
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
	<S extends Node>(p: Parser<S> | ParserFunc<S>): AST<S>;
	peek: (p: Parser<Node> | ParserFunc<Node>) => boolean;
};

type DoOptions = { separator: Parser<Node> | ParserFunc<Node> };

export function do_<T extends Node>(
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
		const comments: AST<Comment>[] = [];

		$.peek = (p: Parser<Node> | ParserFunc<Node>): boolean => {
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

		function $<S extends Node>(p: Parser<S> | ParserFunc<S>): AST<S> {
			let localInput = currentInput;
			let localComments: AST<Comment>[] = [];
			if (separator != null && input.index !== currentInput.index) {
				const g = separator.parse(localInput);
				if (!(g instanceof Error)) {
					localInput = g.nextInput;
					localComments = g.node.comments ?? [];
				}
			}
			const out = parser(p).parse(localInput);
			if (out instanceof ParseError) throw new Interrupt(out);
			if (out instanceof Error)
				throw new Interrupt(new ParseError(out, currentInput));
			currentInput = out.nextInput;
			comments.push(...localComments);
			return out.node;
		}
	}
}

export function nop(input: ParserInput): ParserOutput<None> {
	return { node: { type: "None" }, nextInput: input };
}

type Literal<S extends string = string> = { type: "Literal"; value: S };
export function literal<S extends string>(s: S): Parser<Literal<S>> {
	return parser(parse);

	function parse({ source, index }: ParserInput): ParserOutput<Literal<S>> {
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

export function opt<T extends Node>(p: Parser<T> | ParserFunc<T>) {
	return parser(parse);
	function parse(input: ParserInput): ParserOutput<T | None> {
		const out = parser(p).parse(input);
		if (!(out instanceof Error)) return out;
		return { node: { type: "None" }, nextInput: input };
	}
}

export function oneOf<T extends Node>(
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

export type Many<T extends Node> = { type: "Many"; nodes: AST<T>[] };
export function many<T extends Node>(
	elem: Parser<T> | ParserFunc<T>,
): Parser<Many<T>> {
	return do_(($) => {
		const nodes: AST<T>[] = [];
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

export function dropNone<T extends Node>(n: AST<T | None>): AST<T> | undefined {
	if (n.type !== "None") return n as AST<T>;
	return undefined;
}
