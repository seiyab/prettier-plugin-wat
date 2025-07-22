import { SupportLanguage, Parser, Printer } from "prettier";
import { parse } from "@webassemblyjs/wast-parser";
import { print } from "./lib/printer.js";

export const languages: SupportLanguage[] = [
  {
    name: "WebAssembly Text",
    parsers: ["wast"],
    extensions: [".wat", ".wast"],
  },
];

export const parsers: { [parserName: string]: Parser } = {
  wast: {
    parse: (text) => {
      const ast = parse(text);
      return ast;
    },
    astFormat: "wast",
    locStart: (node) => node.loc.start.offset,
    locEnd: (node) => node.loc.end.offset,
  },
};

export const printers: { [astFormat: string]: Printer } = {
  wast: {
    print,
  },
};

export default { languages, parsers, printers };
