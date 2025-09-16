import { doc, Doc } from "prettier";
import { WatNode } from "./parser/wat";
import { isNextLineEmpty } from "./ast";

const { hardline } = doc.builders;

type MapFn = (elem: { node: WatNode; isLast: boolean }) => Doc;

export function printWithBlankLines(print: () => Doc, options: unknown): MapFn {
	return ({ node, isLast }) => {
		if (isLast) return print();
		if (isNextLineEmpty(node, options as { originalText: string }))
			return [print(), hardline];
		return print();
	};
}
