import { describe, test, expect } from "vitest";
import { identifier } from "./wat-leaf";
import { ParserInput } from "./p";

describe("identifier", () => {
	test("$abc ", () => {
		const out = identifier(input("$abc "));
		expect(out.node).toEqual({ type: "Identifier", value: "$abc" });
	});
});

function input(s: string): ParserInput {
	return { source: s, index: 0 };
}
