import { describe, test, expect } from "vitest";
import { module_, function_ } from "./wat-modules";
import { check, input } from "./testing";

const o = (u: object): unknown => expect.objectContaining(u);

describe("module", () => {
	test("(module)", () => {
		const out = check(module_.parse(input("(module)")));
		expect(out.node).toEqual(o({ type: "Module", id: undefined }));
	});

	test("(module $myModule)", () => {
		const out = check(module_.parse(input("(module $myModule)")));
		expect(out.node).toEqual(
			o({ type: "Module", id: o({ type: "Identifier", value: "$myModule" }) }),
		);
	});
});

describe("function", () => {
	test("example in MDN", () => {
		const out = check(
			function_.parse(
				input(
					`(func (param i32) (param f32) (local f64)
			local.get 0
			local.get 1
			local.get 2)`,
				),
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
				results: [],
				locals: [
					o({ type: "Local", v: o({ type: "ValueType", value: "f64" }) }),
				],
				instructions: [
					o({
						type: "VariableInstruction",
						op: "local.get",
						index: o({ type: "U32", value: 0 }),
					}),
					o({
						type: "VariableInstruction",
						op: "local.get",
						index: o({ type: "U32", value: 1 }),
					}),
					o({
						type: "VariableInstruction",
						op: "local.get",
						index: o({ type: "U32", value: 2 }),
					}),
				],
			}),
		);
	});

	test("$add", () => {
		const out = check(
			function_.parse(
				input(
					`(func $add (param $lhs i32) (param $rhs i32) (result i32)
						local.get $lhs
						local.get $rhs
						i32.add)`,
				),
			),
		);
		expect(out.node).toEqual(
			o({
				type: "Function",
				id: o({ type: "Identifier", value: "$add" }),
				params: [
					o({
						type: "Param",
						id: o({ type: "Identifier", value: "$lhs" }),
						v: o({ type: "ValueType", value: "i32" }),
					}),
					o({
						type: "Param",
						id: o({ type: "Identifier", value: "$rhs" }),
						v: o({ type: "ValueType", value: "i32" }),
					}),
				],
				results: [
					o({ type: "Result", v: o({ type: "ValueType", value: "i32" }) }),
				],
				locals: [],
				instructions: [
					o({
						type: "VariableInstruction",
						op: "local.get",
						index: o({ type: "Identifier", value: "$lhs" }),
					}),
					o({
						type: "VariableInstruction",
						op: "local.get",
						index: o({ type: "Identifier", value: "$rhs" }),
					}),
					o({ type: "NumericInstruction", op: "i32.add" }),
				],
			}),
		);
	});
});
