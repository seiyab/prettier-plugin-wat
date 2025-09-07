import { describe, test, expect } from "vitest";
import {
	foldedInstrucion,
	numericInstruction,
	variableInstruction,
} from "./wat-instructions";
import { check, input } from "./testing";

const o = (u: object): unknown => expect.objectContaining(u);

describe("local.get", () => {
	test("local.get 0", () => {
		const out = check(variableInstruction.parse(input("local.get 0")));
		expect(out.node).toEqual(
			o({
				type: "VariableInstruction",
				op: "local.get",
				index: o({ type: "UInteger", text: "0" }),
			}),
		);
	});
});

describe("numeric instruction", () => {
	test("i32.add", () => {
		const out = check(numericInstruction.parse(input("i32.add")));
		expect(out.node).toEqual(
			o({ type: "NumericSimpleInstruction", op: "i32.add" }),
		);
	});
});

describe("folded plain instruction", () => {
	test("(i32.add (local.get $a) (local.get $b))", () => {
		const out = check(
			foldedInstrucion.parse(input("(i32.add (local.get $a) (local.get $b))")),
		);
		expect(out.node).toEqual(
			o({
				type: "FoldedPlainInstruction",
				operator: o({ type: "NumericSimpleInstruction", op: "i32.add" }),
				operands: [
					o({
						type: "FoldedPlainInstruction",
						operator: o({ type: "VariableInstruction" }),
					}),
					o({
						type: "FoldedPlainInstruction",
						operator: o({ type: "VariableInstruction" }),
					}),
				],
			}),
		);
	});

	test("(local.set $result (i32x4.extract_lane 0 (local.get $v)))", () => {
		check(
			foldedInstrucion.parse(
				input("(local.set $result (i32x4.extract_lane 0 (local.get $v)))"),
			),
		);
	});

	test("(local.set $totalcount (i32x4.neg (local.get $totalcount)))", () => {
		check(
			foldedInstrucion.parse(
				input("(local.set $totalcount (i32x4.neg (local.get $totalcount)))"),
			),
		);
	});

	test("(i32x4.neg (local.get $totalcount))", () => {
		check(foldedInstrucion.parse(input("(i32x4.neg (local.get $totalcount))")));
	});
});

describe("folded block instruction", () => {
	test("(block (i32.add (local.get $a) (local.get $b)))", () => {
		const out = check(
			foldedInstrucion.parse(
				input("(block (i32.add (local.get $a) (local.get $b)))"),
			),
		);
		expect(out.node).toEqual(
			o({
				type: "FoldedBlockInstruction",
				instructions: [
					o({
						type: "FoldedPlainInstruction",
						operator: o({ type: "NumericSimpleInstruction", op: "i32.add" }),
						operands: [
							o({
								type: "FoldedPlainInstruction",
								operator: o({ type: "VariableInstruction" }),
							}),
							o({
								type: "FoldedPlainInstruction",
								operator: o({ type: "VariableInstruction" }),
							}),
						],
					}),
				],
			}),
		);
	});
});

describe("folded loop instruction", () => {
	test("(loop (i32.add (local.get $a) (local.get $b)))", () => {
		const out = check(
			foldedInstrucion.parse(
				input("(loop (i32.add (local.get $a) (local.get $b)))"),
			),
		);
		expect(out.node).toEqual(
			o({
				type: "FoldedLoopInstruction",
				instructions: [
					o({
						type: "FoldedPlainInstruction",
						operator: o({ type: "NumericSimpleInstruction", op: "i32.add" }),
						operands: [
							o({
								type: "FoldedPlainInstruction",
								operator: o({ type: "VariableInstruction" }),
							}),
							o({
								type: "FoldedPlainInstruction",
								operator: o({ type: "VariableInstruction" }),
							}),
						],
					}),
				],
			}),
		);
	});
});
