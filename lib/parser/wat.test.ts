import { describe, test, expect } from "vitest";
import { ParserInput } from "./p";
import { module_ } from "./wat";

const o = (u: object): unknown => expect.objectContaining(u);

describe("module", () => {
	test("(module)", () => {
		const out = module_.parse(input("(module)"));
		expect(out.node).toEqual(o({ type: "Module", id: undefined }));
	});

	test("(module $myModule)", () => {
		const out = module_.parse(input("(module $myModule)"));
		expect(out.node).toEqual(
			o({ type: "Module", id: o({ type: "Identifier", value: "$myModule" }) }),
		);
	});
});

function input(s: string): ParserInput {
	return { source: s, index: 0 };
}
