import { describe, test, expect } from "vitest";
import { isError, literal, ParserInput, synchronized } from "./p";

describe("synchronized", () => {
	const p = synchronized({
		open: literal("(").parse,
		body: literal("body").parse,
		close: literal(")").parse,
	});

	test("successfull", () => {
		const out = p.parse(input("(body)"));
		expect(out.node.type).toBe("Synchronized");
		// @ts-expect-error -- assertion above must confirm the type
		const node: { type: "Synchronized" } & typeof out.node = out.node;
		expect(node.open).toEqual(
			expect.objectContaining({ type: "Literal", value: "(" }),
		);
		expect(node.body).toEqual(
			expect.objectContaining({ type: "Literal", value: "body" }),
		);
		expect(node.close).toEqual(
			expect.objectContaining({ type: "Literal", value: ")" }),
		);
	});

	test("fail on open", () => {
		const out = p.parse(input("[body)"));
		expect(isError(out)).toBe(true);
	});

	test("fail to recover", () => {
		const out = p.parse(input("(boy"));
		expect(isError(out)).toBe(true);
	});

	test("fail on body and recover", () => {
		const out = p.parse(input("(boy)"));
		expect(out.node.type).toBe("Recovered");
		// @ts-expect-error -- assertion above must confirm the type
		const node: { type: "Recovered" } & typeof out.node = out.node;
		expect(node.body).toBeUndefined();
		expect(node.rest).toEqual(
			expect.objectContaining({ type: "Unknown", value: "boy" }),
		);
	});

	test("fail on close and recover", () => {
		const out = p.parse(input("(body!)"));
		expect(out.node.type).toBe("Recovered");
		// @ts-expect-error -- assertion above must confirm the type
		const node: { type: "Recovered" } & typeof out.node = out.node;
		expect(node.body).toEqual(
			expect.objectContaining({ type: "Literal", value: "body" }),
		);
		expect(node.rest).toEqual(
			expect.objectContaining({ type: "Unknown", value: "!" }),
		);
		expect(node.close).toEqual(
			expect.objectContaining({ type: "Literal", value: ")" }),
		);
	});
});

function input(s: string): ParserInput {
	return { source: s, index: 0 };
}
