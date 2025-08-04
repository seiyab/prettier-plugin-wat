import type { SupportLanguage, Parser, Printer } from "prettier";
import { print } from "./lib/printer";
import { Node } from "./lib/parser/p";
import { parse, WatNode } from "./lib/parser/wat";
import { Comment } from "./lib/parser/wat-lexical-format";
import { isNode, hoistComment } from "./lib/ast";

export const languages: SupportLanguage[] = [
	{ name: "WebAssembly Text", parsers: ["wat"], extensions: [".wat", ".wast"] },
];

export const parsers: { [parserName: string]: Parser } = {
	wat: {
		parse: (text: string) => {
			const ast = parse(text);
			return hoistComment(ast);
		},
		astFormat: "wat",
		locStart: (node: Node<WatNode>) => node.loc.start.offset,
		locEnd: (node: Node<WatNode>) => node.loc.end.offset,
	},
};

export const printers: { [astFormat: string]: Printer } = {
	wat: {
		print,
		printComment: (commentPath) => {
			const comment = commentPath.node as Node<Comment>;
			if (comment.kind === "line") {
				return ";;" + comment.content.trimEnd();
			} else {
				return "(;" + comment.content + ";)";
			}
		},
		getVisitorKeys: (node: WatNode) =>
			Object.entries(node).flatMap(([k, v]) =>
				k === "Comment" ? []
				: isNode(v) ? [k]
				: Array.isArray(v) ? [k]
				: [],
			),
		isBlockComment: (node: Comment) => node.kind === "block",
		canAttachComment: (node: WatNode) => node.type !== "Comment",
	},
};

export default { languages, parsers, printers };
