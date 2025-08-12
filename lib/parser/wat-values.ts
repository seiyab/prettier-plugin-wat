import { parser, Parser, ParserInput, ParserOutput, oneOf } from "./p";

export type ValueNodes = Identifier | UInteger | Integer | StringLiteral;

export type UInteger = { type: "UInteger"; text: string };
export const uInteger: Parser<UInteger> = parser(
	(input): ParserOutput<UInteger> => {
		const { source, index } = input;
		let i = index;
		if (source.substring(i, i + 2) === "0x") {
			const hexStartIndex = i + 2;
			i += 2;
			while (
				i < source.length &&
				((source[i] >= "0" && source[i] <= "9") ||
					(source[i] >= "a" && source[i] <= "f") ||
					(source[i] >= "A" && source[i] <= "F"))
			) {
				i++;
			}
			if (i === hexStartIndex) return new Error(`expected hex digit`);
		} else {
			const digitStartIndex = i;
			while (i < source.length && source[i] >= "0" && source[i] <= "9") {
				i++;
			}
			if (i === digitStartIndex) return new Error(`expected digit`);
		}
		if (i === index) return new Error("not a uinteger");
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

		const contentStartIndex = i;
		if (source.substring(i, i + 2) === "0x") {
			i += 2;
			const hexStartIndex = i;
			while (
				i < source.length &&
				((source[i] >= "0" && source[i] <= "9") ||
					(source[i] >= "a" && source[i] <= "f") ||
					(source[i] >= "A" && source[i] <= "F"))
			) {
				i++;
			}
			if (i === hexStartIndex) return new Error(`expected hex digit`);
		} else {
			const digitStartIndex = i;
			while (i < source.length && source[i] >= "0" && source[i] <= "9") {
				i++;
			}
			if (i === digitStartIndex) return new Error(`expected digit`);
		}

		if (i === contentStartIndex) return new Error("not an integer");

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
		let value = "";
		while (i < source.length && source[i] !== '"') {
			if (source[i] === "\\") {
				i++;
				if (i >= source.length) return new Error("Unterminated string literal");
				const hex = source.substring(i, i + 2);
				if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
					// It's not a hex escape, so just treat it as a regular escape.
					value += `\\${source[i]}`;
					i++;
				} else {
					value += `\\${hex}`;
					i += 2;
				}
			} else {
				value += source[i];
				i++;
			}
		}
		if (source[i] !== '"') return new Error("Unterminated string literal");
		return {
			node: { type: "StringLiteral", value },
			nextInput: { source, index: i + 1 },
		};
	},
);
