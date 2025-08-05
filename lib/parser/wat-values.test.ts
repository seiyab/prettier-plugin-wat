import { describe, test, expect } from "vitest";
import { identifier, uInteger } from "./wat-values";
import { check, input } from "./testing";

describe("identifier", () => {
	test("$abc ", () => {
		const out = check(identifier(input("$abc ")));
		expect(out.node).toEqual({ type: "Identifier", value: "$abc" });
	});
});

describe("uInteger", () => {
	test("123", () => {
		const out = check(uInteger.parse(input("123")));
		expect(out.node).toEqual(
			expect.objectContaining({ type: "UInteger", text: "123" }),
		);
	});
});
