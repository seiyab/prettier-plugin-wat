import {
	do_,
	literal,
	None,
	oneOf,
	opt,
	ParserInput,
	ParserOutput,
	AST,
	nop,
} from "./p";

export function spaces(input: ParserInput): ParserOutput<None> {
	let i = input.index;
	for (; i < input.source.length; i++) {
		if (spacechars.has(input.source[i])) continue;
		break;
	}
	return { node: { type: "None" }, nextInput: { ...input, index: i } };
}
const spacechars: ReadonlySet<string> = new Set([" ", "\t", "\n", "\r"]);

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

export const gap = do_(
	($) => {
		const comments: AST<Comment>[] = [];
		void $(opt(spaces));
		for (;;) {
			const c = $(opt(comment));
			if (c.type === "None") break;
			comments.push(c);
			void $(opt(spaces));
		}
		return { type: "Gap", comments };
	},
	{ separator: nop },
);

function linebreak(c: string): boolean {
	return c === "\n" || c === "\r";
}
