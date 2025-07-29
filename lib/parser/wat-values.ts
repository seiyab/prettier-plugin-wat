import { parser, Parser, ParserInput, ParserOutput } from "./p";

export type ValueNodes = Identifier | Index;

export type Index = { type: "Index"; value: number };
export const u32: Parser<Index> = parser((input): ParserOutput<Index> => {
	const { source, index } = input;
	let i = index;
	while (i < source.length && source[i] >= "0" && source[i] <= "9") {
		i++;
	}
	if (i === index) return new Error();
	const value = parseInt(source.substring(index, i), 10);
	return { node: { type: "Index", value }, nextInput: { source, index: i } };
});

export type Identifier = { type: "Identifier"; value: string };
export function identifier(input: ParserInput): ParserOutput<Identifier> {
	const first = input.source[input.index];
	if (first !== "$") return new Error(`Expected '$' but got '${first}'`);
	let i = input.index + 1;
	for (; i < input.source.length; i++) {
		if (!idchars.has(input.source[i])) break;
	}
	if (i === input.index + 1)
		return new Error(`'${input.source[i]}' cannot be used in identifier`);
	return {
		node: { type: "Identifier", value: input.source.substring(input.index, i) },
		nextInput: { source: input.source, index: i },
	};
}
const idchars = new Set(
	[
		"0123456789".split(""),
		"abcdefghijklmnopqrstuvwxyz".split(""),
		"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
		// TODO: add valid non-alphanumeric characters
	].flat(),
);
