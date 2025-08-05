import { parser, Parser, ParserInput, ParserOutput, oneOf } from "./p";

export type ValueNodes = Identifier | UInteger | Integer | StringLiteral;

export type UInteger = { type: "UInteger"; text: string };
export const uInteger: Parser<UInteger> = parser(
	(input): ParserOutput<UInteger> => {
		const { source, index } = input;
		let i = index;
		while (i < source.length && source[i] >= "0" && source[i] <= "9") {
			i++;
		}
		if (i === index)
			return new Error(`expected digit, but found ${source[index]}`);
		const text = source.substring(index, i);
		return {
			node: { type: "UInteger", text },
			nextInput: { source, index: i },
		};
	},
);

export type Integer = { type: "Integer"; text: string };
export const integer: Parser<Integer> = parser(
	(input): ParserOutput<Integer> => {
		const { source, index } = input;
		let i = index;
		if (source[i] === "+" || source[i] === "-") {
			i++;
		}
		while (i < source.length && source[i] >= "0" && source[i] <= "9") {
			i++;
		}
		if (i === index)
			return new Error(`expected digit, but found ${source[index]}`);
		const text = source.substring(index, i);
		return { node: { type: "Integer", text }, nextInput: { source, index: i } };
	},
);

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

export type Index = UInteger | Identifier;
export const index: Parser<Index> = oneOf<Index>([uInteger, identifier]);

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
