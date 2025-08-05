import { describe, test, expect } from "vitest";
import { variableInstruction } from "./wat-instructions";
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
