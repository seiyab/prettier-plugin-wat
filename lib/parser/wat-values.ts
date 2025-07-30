import { parser, Parser, ParserInput, ParserOutput, oneOf } from "./p";

export type ValueNodes = Identifier | U32;

export type U32 = { type: "U32"; value: number };
export const u32: Parser<U32> = parser((input): ParserOutput<U32> => {
	const { source, index } = input;
	let i = index;
	while (i < source.length && source[i] >= "0" && source[i] <= "9") {
		i++;
	}
	if (i === index) return new Error();
	const value = parseInt(source.substring(index, i), 10);
	return { node: { type: "U32", value }, nextInput: { source, index: i } };
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

export type Index = U32 | Identifier;
export const index: Parser<Index> = oneOf<Index>([u32, identifier]);

export type StringLiteral = { type: "StringLiteral"; value: string };
export const stringLiteral: Parser<StringLiteral> = parser(
	(input): ParserOutput<StringLiteral> => {
		const { source, index } = input;
		if (source[index] !== '"') return new Error('Expected "');
		let i = index + 1;
		while (i < source.length && source[i] !== '"') {
			i++;
		}
		if (source[i] !== '"') return new Error("Unterminated string literal");
		const value = source.substring(index + 1, i);
		return {
			node: { type: "StringLiteral", value },
			nextInput: { source, index: i + 1 },
		};
	},
);
