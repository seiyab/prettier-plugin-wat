import { describe, test, expect } from "vitest";
import { do_, literal, ParserInput } from "./p";

describe("do", () => {
	const p = do_(($) => {
		const a = $(literal("abc"));
		const d = $(literal("def"));
		const g = $(literal("ghi"));
		return { type: "Test" as const, values: [a, d, g] };
	});

	test("successfull", () => {
		const out = p.parse(input("abcdefghi"));
		expect(out.node.type).toBe("Test");
		// @ts-expect-error -- assertion above must confirm the type
		const node: { type: "Test" } & typeof out.node = out.node;
		expect(node.values).toEqual([
			expect.objectContaining({ type: "Literal", value: "abc" }),
			expect.objectContaining({ type: "Literal", value: "def" }),
			expect.objectContaining({ type: "Literal", value: "ghi" }),
		]);
	});
});

function input(s: string): ParserInput {
	return { source: s, index: 0 };
}
