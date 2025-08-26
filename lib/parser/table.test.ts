import { describe, test, expect } from "vitest";
import { parse } from "./wat";

describe("table parsing", () => {
	test("should fail to parse table currently", () => {
		const source = `(module (table 1 funcref))`;
		expect(() => parse(source)).toThrow();
	});
});