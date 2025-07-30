import { describe, test, expect } from "vitest";
import { identifier, u32 } from "./wat-values";
import { check, input } from "./testing";

describe("identifier", () => {
	test("$abc ", () => {
		const out = check(identifier(input("$abc ")));
		expect(out.node).toEqual({ type: "Identifier", value: "$abc" });
	});
});

describe("u32", () => {
	test("123", () => {
		const out = check(u32.parse(input("123")));
		expect(out.node).toEqual(
			expect.objectContaining({ type: "U32", value: 123 }),
		);
	});
});
