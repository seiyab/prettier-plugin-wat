import { Fail, ParserInput, ParserOutput } from "./p";

type Identifier = { type: "Identifier"; value: string };
export function identifier(
	input: ParserInput,
): ParserOutput<Identifier | Fail> {
	const first = input.source[input.index];
	if (first !== "$")
		return {
			node: { type: "Error", reason: `Expected '$' but got '${first}'` },
			nextInput: input,
		};
	let i = input.index + 1;
	for (; i < input.source.length; i++) {
		if (!idchars.has(input.source[i])) break;
	}
	if (i === input.index + 1)
		return {
			node: {
				type: "Error",
				reason: `'${input.source[i]}' cannot be used in identifier`,
			},
			nextInput: input,
		};
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
