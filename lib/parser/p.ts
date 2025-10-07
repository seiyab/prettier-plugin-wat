/**
 * This file provides domain-inspecific parser implementation &  utilities
 */

import { iife } from "../iife";
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

type ParseErrorOptions = Partial<{ exclusive: boolean }>;

const getLineBreaks = iife(() => {
	// Cache for line break positions to avoid repeated string splitting
	const lineBreakCache = new Map<string, number[]>();
	return getLineBreaks;
	function getLineBreaks(source: string): number[] {
		let lineBreaks = lineBreakCache.get(source);
		if (lineBreaks === undefined) {
			lineBreaks = [];
			for (let i = 0; i < source.length; i++) {
				if (source[i] === "\n") {
					lineBreaks.push(i);
				}
			}
			lineBreakCache.set(source, lineBreaks);
		}
		return lineBreaks;
	}
});

export class ParseError extends Error {
	private error: string;
	private input: ParserInput;
	at: number;
	exclusive: boolean;

	constructor(
		error: Error | string,
		input: ParserInput,
		opts?: ParseErrorOptions,
	) {
		super();
		this.error = error instanceof Error ? error.message : error;
		this.input = input;
		this.name = "ParseError";
		this.at = input.index;
		this.exclusive = opts?.exclusive ?? false;

		if (error instanceof Error) {
			this.stack = error.stack;
		} else {
			Error.captureStackTrace(this, ParseError);
		}
	}

	get message() {
		return this.toString();
	}

	toString() {
		const { line, column } = ParseError.position(this.input);
		const m = `at line ${line}, column ${column}: ${this.error}`;
		return `${this.name}: ${m}`;
	}

	static position(input: ParserInput): { line: number; column: number } {
		const lineBreaks = getLineBreaks(input.source);

		// Binary search to find the line
		let left = 0;
		let right = lineBreaks.length;
		while (left < right) {
			const mid = Math.floor((left + right) / 2);
			if (lineBreaks[mid] < input.index) {
				left = mid + 1;
			} else {
				right = mid;
			}
		}

		const lineStart = left === 0 ? 0 : lineBreaks[left - 1] + 1;
		return { line: left + 1, column: input.index - lineStart + 1 };
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
	exclusive: () => void;
};

type DoOptions = { separator: Parser<Node> | ParserFunc<Node> };

export function do_<T extends Node>(
	process: ($: Tools) => T | Error,
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
		let isExclusive = false;
		const comments: AST<Comment>[] = [];

		// Direct assignment is faster than Object.assign
		$$.peek = peek;
		$$.exclusive = exclusive;
		const $ = $$ as Tools;

		try {
			const node = process($);
			if (node instanceof Error) {
				if (node instanceof ParseError) return node;
				return new ParseError(node, currentInput);
			}
			return {
				node: { ...node, comments: comments.concat(node.comments ?? []) },
				nextInput: currentInput,
			};
		} catch (e: unknown) {
			if (e instanceof Interrupt) return e.cause;
			throw e;
		}

		// Create tools object directly instead of using Object.assign
		function $$<S extends Node>(p: Parser<S> | ParserFunc<S>): AST<S> {
			let localInput = currentInput;
			let localComments: AST<Comment>[] = [];
			if (separator != null && input.index !== currentInput.index) {
				const g = separator.parse(localInput);
				if (!(g instanceof Error)) {
					localInput = g.nextInput;
					localComments = g.node.comments ?? [];
				}
			}
			// Avoid calling parser() if p is already a Parser
			const out =
				typeof p === "function" ?
					parser(p).parse(localInput)
				:	p.parse(localInput);
			if (out instanceof ParseError) {
				if (isExclusive) out.exclusive = true;
				throw new Interrupt(out);
			}
			if (out instanceof Error)
				throw new Interrupt(
					new ParseError(out, localInput, { exclusive: isExclusive }),
				);
			currentInput = out.nextInput;
			comments.push(...localComments);
			return out.node;
		}

		function peek(p: Parser<Node> | ParserFunc<Node>): boolean {
			let tempInput = currentInput;
			if (separator != null && input.index !== currentInput.index) {
				const g = separator.parse(tempInput);
				if (!(g instanceof Error)) {
					tempInput = g.nextInput;
				}
			}
			// Avoid calling parser() if p is already a Parser
			const out =
				typeof p === "function" ?
					parser(p).parse(tempInput)
				:	p.parse(tempInput);
			return !(out instanceof Error);
		}

		function exclusive(): void {
			isExclusive = true;
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
		if (out instanceof ParseError && out.exclusive) return out;
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
				if (out.exclusive) return out;
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
			const item = dropNone($(opt(elem)));
			if (item == null) break;
			nodes.push(item);
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

type CommentCollector = {
	drain: <N extends Node>(t: AST<N>) => AST<N>;
	comments: () => AST<Comment>[];
};
export const commentCollector = (): CommentCollector => {
	const cs: AST<Comment>[] = [];
	return { drain, comments };

	function drain<N extends Node>(t: AST<N>): AST<N> {
		cs.push(...(t.comments ?? []));
		return { ...t, comments: [] };
	}
	function comments(): AST<Comment>[] {
		return cs;
	}
};
