import type { SupportLanguage, Parser, Printer } from "prettier";
import { print } from "./lib/printer";
import { AST } from "./lib/parser/p";
import { parse, WatNode } from "./lib/parser/wat";
import { Comment } from "./lib/parser/wat-lexical-format";
import { isNode, hoistComment, locStart, locEnd } from "./lib/ast";

function handleCommentAfterControlStructure(comment: any, text: string, options: any, ast: any): boolean {
	// This is a placeholder implementation
	// For now, let Prettier handle all comments normally
	// TODO: Implement logic to detect comments that appear after 'end' keywords
	// and should be attached to the next sibling instead of the control structure
	return false;
}

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
		canAttachComment: (node: WatNode) => node.type !== "Comment",
		handleComments: {
			ownLine: (comment, text, options, ast) => {
				// Handle comments that appear on their own line after control structures
				return handleCommentAfterControlStructure(comment, text, options, ast);
			},
			endOfLine: (comment, text, options, ast) => {
				// Let Prettier handle end of line comments by default  
				return false;
			},
			remaining: (comment, text, options, ast) => {
				// Handle any remaining comments that might be misplaced
				return handleCommentAfterControlStructure(comment, text, options, ast);
			}
		},
	},
};

export default { languages, parsers, printers };
