import { None, ParserInput, ParserOutput } from "./p";

export function spaces(input: ParserInput): ParserOutput<None> {
	let i = input.index;
	for (; i < input.source.length; i++) {
		if (spacechars.has(input.source[i])) continue;
		break;
	}
	return { node: { type: "None" }, nextInput: { ...input, index: i } };
}
const spacechars: ReadonlySet<string> = new Set([" ", "\n"]);
