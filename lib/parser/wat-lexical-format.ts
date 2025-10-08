import {
	do_,
	literal,
	None,
	oneOf,
	opt,
	ParserInput,
	ParserOutput,
	AST,
	parser,
	nop,
} from "./p";

export function spaces(input: ParserInput): ParserOutput<None> {
	return {
		node: { type: "None" },
		nextInput: { ...input, index: next(input) },
	};
}
const spacechars: ReadonlySet<string> = new Set([" ", "\t", "\n", "\r"]);

function next(input: ParserInput): number {
	let i = input.index;
	for (; i < input.source.length; i++) {
		if (spacechars.has(input.source[i])) continue;
		break;
	}
	return i;
}

export type Comment = {
	type: "Comment";
	kind: "block" | "line";
	content: string;
	comments?: undefined;
};
export const comment = oneOf([lineComment, blockComment]);
function lineComment(input: ParserInput): ParserOutput<Comment> {
	const prefix = literal(";;").parse(input);
	if (prefix instanceof Error) return prefix;
	let i = prefix.nextInput.index;
	while (i < input.source.length && !linebreak(input.source[i])) {
		i += 1;
	}
	const content = input.source.substring(prefix.nextInput.index, i);
	return {
		node: { type: "Comment", kind: "line", content },
		nextInput: { ...input, index: i },
	};
}
function blockComment(input: ParserInput): ParserOutput<Comment> {
	const prefix = literal("(;").parse(input);
	if (prefix instanceof Error) return prefix;

	const startIndex = prefix.nextInput.index;
	const endIndex = input.source.indexOf(";)", startIndex);

	if (endIndex === -1) {
		return new Error("unclosed block comment");
	}

	const content = input.source.substring(startIndex, endIndex);
	const nextIndex = endIndex + 2;

	return {
		node: { type: "Comment", kind: "block", content },
		nextInput: { ...input, index: nextIndex },
	};
}

export const gap = parser((input) => {
	const comments: AST<Comment>[] = [];
	let currentInput: ParserInput = { ...input };
	currentInput.index = next(currentInput);
	for (;;) {
		const c = comment.parse(currentInput);
		if (c instanceof Error) break;
		comments.push(c.node);
		currentInput = c.nextInput;
		currentInput.index = next(currentInput);
	}
	return { node: { type: "Gap" as const, comments }, nextInput: currentInput };
});

function linebreak(c: string): boolean {
	return c === "\n" || c === "\r";
}

type Word<W extends string> = { type: "Word"; value: W };
export const word = <W extends string>(words: ReadonlySet<W>) =>
	parser<Word<W>>((input) => {
		let i = input.index;
		for (; i < input.source.length; i++) {
			const c = input.source[i];
			if ("a" <= c && c <= "z") continue;
			if ("0" <= c && c <= "9") continue;
			if (c === "_") continue;
			break;
		}
		if (i === input.index) {
			return new Error("expected word");
		}
		const value = input.source.substring(input.index, i);
		if (!words.has(value as W)) {
			return new Error(`unexpected word: ${value}`);
		}
		return {
			node: { type: "Word", value: value as W },
			nextInput: { ...input, index: i },
		};
	});
