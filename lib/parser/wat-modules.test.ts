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

	test("export", () => {
		const out = check(module_.parse(input(`(module (export "f" (func $f)))`)));
		expect(out.node).toEqual(
			o({
				type: "Module",
				modulefields: [
					o({
						type: "Export",
						name: o({ type: "StringLiteral", value: "f" }),
						externidx: o({
							type: "ExternIdx",
							kind: "func",
							index: o({ type: "Identifier", value: "$f" }),
						}),
					}),
				],
			}),
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
				typeuse: o({
					params: [
						o({
							type: "Param",
							valtype: [o({ type: "NumberType", value: "i32" })],
						}),
						o({
							type: "Param",
							valtype: [o({ type: "NumberType", value: "f32" })],
						}),
					],
					results: [],
				}),
				locals: [
					o({
						type: "Local",
						valtypes: [o({ type: "NumberType", value: "f64" })],
					}),
				],
				instructions: [
					o({
						type: "VariableInstruction",
						op: "local.get",
						index: o({ type: "UInteger", text: "0" }),
					}),
					o({
						type: "VariableInstruction",
						op: "local.get",
						index: o({ type: "UInteger", text: "1" }),
					}),
					o({
						type: "VariableInstruction",
						op: "local.get",
						index: o({ type: "UInteger", text: "2" }),
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
				id: o({ value: "$add" }),
				typeuse: o({
					params: [
						o({ id: o({ value: "$lhs" }) }),
						o({ id: o({ value: "$rhs" }) }),
					],
					results: [o({ valtype: [o({ value: "i32" })] })],
				}),
				locals: [],
				instructions: [
					o({ op: "local.get", index: o({ value: "$lhs" }) }),
					o({ op: "local.get", index: o({ value: "$rhs" }) }),
					o({ op: "i32.add", type: "NumericSimpleInstruction" }),
				],
			}),
		);
	});

	test("comments", () => {
		const out = check(
			function_.parse(
				input(
					`(func $add (; comment 1 ;) (param $lhs i32) (param $rhs i32) (result i32)
						local.get $lhs
						local.get $rhs ;; comment 2
						i32.add)`,
				),
			),
		);
		expect(out.node).toEqual(
			o({
				type: "Function",
				id: o({ value: "$add" }),
				typeuse: o({
					params: [
						o({ id: o({ value: "$lhs" }) }),
						o({ id: o({ value: "$rhs" }) }),
					],
					results: [o({ valtype: [o({ value: "i32" })] })],
				}),
				locals: [],
				instructions: [
					o({ op: "local.get", index: o({ value: "$lhs" }) }),
					o({ op: "local.get", index: o({ value: "$rhs" }) }),
					o({ op: "i32.add", type: "NumericSimpleInstruction" }),
				],
				comments: [
					o({ type: "Comment", kind: "block", content: " comment 1 " }),
					o({ type: "Comment", kind: "line", content: " comment 2" }),
				],
			}),
		);
	});
});
