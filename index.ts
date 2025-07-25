import { SupportLanguage, Parser, Printer } from "prettier";
import { print } from "./lib/printer";
import { Node } from "./lib/parser/p";
import { parse, WatNode } from "./lib/parser/wat";

export const languages: SupportLanguage[] = [
	{ name: "WebAssembly Text", parsers: ["wat"], extensions: [".wat", ".wast"] },
];

export const parsers: { [parserName: string]: Parser } = {
	wat: {
		parse: (text: string) => {
			const ast = parse(text);
			return ast;
		},
		astFormat: "wat",
		locStart: (node: Node<WatNode>) => node.loc.start.offset,
		locEnd: (node: Node<WatNode>) => node.loc.end.offset,
	},
};

export const printers: { [astFormat: string]: Printer } = { wat: { print } };

export default { languages, parsers, printers };
