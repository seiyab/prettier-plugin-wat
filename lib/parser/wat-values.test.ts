import { describe, test, expect } from "vitest";
import { ParserInput } from "./p";
import { identifier, u32 } from "./wat-values";

describe("identifier", () => {
	test("$abc ", () => {
		const out = identifier(input("$abc "));
		expect(out.node).toEqual({ type: "Identifier", value: "$abc" });
	});
});

describe("u32", () => {
	test("123", () => {
		const out = u32.parse(input("123"));
		expect(out.node).toEqual(
			expect.objectContaining({ type: "Index", value: 123 }),
		);
	});
});

function input(s: string): ParserInput {
	return { source: s, index: 0 };
}
