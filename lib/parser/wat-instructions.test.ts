import { describe, test, expect } from "vitest";
import { ParserInput } from "./p";
import { variableInstruction } from "./wat-instructions";

const o = (u: object): unknown => expect.objectContaining(u);

describe("local.get", () => {
	test("local.get 0", () => {
		const out = variableInstruction.parse(input("local.get 0"));
		expect(out.node).toEqual(
			o({
				type: "VariableInstruction",
				op: "local.get",
				index: o({ type: "Index", value: 0 }),
			}),
		);
	});
});

function input(s: string): ParserInput {
	return { source: s, index: 0 };
}
