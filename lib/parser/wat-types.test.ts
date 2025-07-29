import { describe, test, expect } from "vitest";
import { valtype } from "./wat-types";
import { check, input } from "./testing";

const o = (u: object): unknown => expect.objectContaining(u);

describe("valtype", () => {
	test("i32", () => {
		const out = check(valtype.parse(input("i32")));
		expect(out.node).toEqual(o({ type: "ValueType", value: "i32" }));
	});
	test("i64", () => {
		const out = check(valtype.parse(input("i64")));
		expect(out.node).toEqual(o({ type: "ValueType", value: "i64" }));
	});
	test("f32", () => {
		const out = check(valtype.parse(input("f32")));
		expect(out.node).toEqual(o({ type: "ValueType", value: "f32" }));
	});
	test("f64", () => {
		const out = check(valtype.parse(input("f64")));
		expect(out.node).toEqual(o({ type: "ValueType", value: "f64" }));
	});
});
