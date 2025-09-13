import type { SupportLanguage, Parser, Printer } from "prettier";
import { print } from "./lib/printer";
import { AST } from "./lib/parser/p";
import { parse, WatNode } from "./lib/parser/wat";
import { Comment } from "./lib/parser/wat-lexical-format";
import { isNode, hoistComment, locStart, locEnd } from "./lib/ast";

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
		locStart,
		locEnd,
	},
};

export const printers: { [astFormat: string]: Printer } = {
	wat: {
		print,
		printComment: (commentPath) => {
			const comment = commentPath.node as AST<Comment>;
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
		canAttachComment: (node: WatNode) => {
			// Don't attach comments to Comment nodes
			if (node.type === "Comment") return false;
			
			// For control structures, we need to be more careful about comment attachment
			// but we'll handle the logic elsewhere since canAttachComment doesn't get the comment
			return true;
		},
		handleComments: {
			ownLine: (comment, text, options, ast) => {
				// Handle comments that appear on their own line
				// Check if this comment appears after an 'end' keyword
				const commentStart = comment.loc?.start?.offset;
				if (typeof commentStart !== 'number') {
					return false; // Let Prettier handle it
				}
				
				// Look backwards from the comment position to see if there's an 'end' keyword
				const beforeComment = text.substring(0, commentStart);
				const endMatch = beforeComment.match(/\bend\s*\n\s*$/);
				
				if (endMatch) {
					// This comment appears right after an 'end' keyword
					// Don't let Prettier attach it to control structures
					return false; // Let Prettier handle it as a leading comment for the next node
				}
				
				return false; // Let Prettier handle all other cases
			},
			endOfLine: () => false, // Let Prettier handle end-of-line comments
			remaining: () => false, // Let Prettier handle remaining comments
		},
	},
};

export default { languages, parsers, printers };
