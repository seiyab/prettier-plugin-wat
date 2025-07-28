import { describe, test, expect } from "vitest";
import { ParserInput } from "./p";
import { module_, function_ } from "./wat-modules";

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

describe("function", () => {
	test("example in MDN", () => {
		const out = function_.parse(
			input(
				`(func (param i32) (param f32) (local f64)
			local.get 0
			local.get 1
			local.get 2)`,
			),
		);
		expect(out.node).toEqual(
			o({
				type: "Function",
				id: undefined,
				params: [
					o({ type: "Param", v: o({ type: "ValueType", value: "i32" }) }),
					o({ type: "Param", v: o({ type: "ValueType", value: "f32" }) }),
				],
				locals: [
					o({ type: "Local", v: o({ type: "ValueType", value: "f64" }) }),
				],
				instructions: [
					o({
						type: "VariableInstruction",
						op: "local.get",
						index: o({ type: "Index", value: 0 }),
					}),
					o({
						type: "VariableInstruction",
						op: "local.get",
						index: o({ type: "Index", value: 1 }),
					}),
					o({
						type: "VariableInstruction",
						op: "local.get",
						index: o({ type: "Index", value: 2 }),
					}),
				],
			}),
		);
	});
});

function input(s: string): ParserInput {
	return { source: s, index: 0 };
}
