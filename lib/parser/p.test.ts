import { describe, test, expect } from "vitest";
import { literal, many, oneOf } from "./p";
import { check, input } from "./testing";

describe("oneOf", () => {
	test("found first", () => {
		const p = oneOf(["a", "b"].map(literal));
		const out = check(p.parse(input("a")));
		expect(out.node).toEqual({
			type: "Literal",
			value: "a",
			loc: { start: { offset: 0 }, end: { offset: 1 } },
		});
	});
	test("found second", () => {
		const p = oneOf(["a", "b"].map(literal));
		const out = check(p.parse(input("b")));
		expect(out.node).toEqual({
			type: "Literal",
			value: "b",
			loc: { start: { offset: 0 }, end: { offset: 1 } },
		});
	});
	test("not found", () => {
		const p = oneOf(["a", "b"].map(literal));
		const out = p.parse(input("c"));
		expect(out).toBeInstanceOf(Error);
	});
});

describe("many", () => {
	test("found three", () => {
		const p = many(literal("a"));
		const out = check(p.parse(input("aaa")));
		expect(out.node.nodes.length).toBe(3);
	});
	test("found zero", () => {
		const p = many(literal("a"));
		const out = check(p.parse(input("bbb")));
		expect(out.node.nodes.length).toBe(0);
	});
});
