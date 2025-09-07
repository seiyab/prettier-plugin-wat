import { AstPath, Doc, doc } from "prettier";
import { Print } from "./types";
import { WatNode } from "./parser/wat";
import { Module } from "./parser/wat-modules";

const { group, indent, hardline, softline } = doc.builders;

export function printModule(
	node: Module,
	path: AstPath<WatNode>,
	print: Print,
	options?: { originalText?: string },
) {
	const parts: Doc[] = ["(module"];
	if (node.id) {
		parts.push(" ", path.call(print, "id"));
	}
	if (node.modulefields && node.modulefields.length > 0) {
		// Build the module field parts with proper blank line handling
		const moduleFieldParts: Doc[] = [hardline];

		const printedFields = path.map(print, "modulefields");

		for (let i = 0; i < node.modulefields.length; i++) {
			const currentField = node.modulefields[i];
			const isFirst = i === 0;

			if (!isFirst) {
				const prevField = node.modulefields[i - 1];

				// Check if there should be blank lines between fields
				// by examining the source between the end of previous field and start of current field
				const prevEndOffset = prevField.loc.end.offset;
				const currentStartOffset = currentField.loc.start.offset;

				// Try to get original source from options
				const originalSource: string = options?.originalText || "";

				if (originalSource) {
					// Extract the text between the two fields
					const betweenText: string = originalSource.substring(
						prevEndOffset,
						currentStartOffset,
					);

					// Count newlines - if there are 2 or more consecutive newlines, preserve blank line
					const newlineMatches: RegExpMatchArray | null =
						betweenText.match(/\n/g);
					const hasBlankLine: boolean =
						newlineMatches !== null && newlineMatches.length >= 2;

					if (hasBlankLine) {
						moduleFieldParts.push(hardline, hardline);
					} else {
						moduleFieldParts.push(hardline);
					}
				} else {
					moduleFieldParts.push(hardline);
				}
			}

			moduleFieldParts.push(printedFields[i]);
		}

		parts.push(indent(moduleFieldParts));
	}
	parts.push(softline, ")");
	return group(parts);
}
