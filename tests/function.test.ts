import { test, expect } from "vitest";
import * as prettier from "prettier";
import plugin from "../index";

test.skip("function", async () => {
	const input = `(module
  (func (param $lhs i32) (param $rhs i32) (result i32)
    (local.get $lhs)
    (local.get $rhs)
    (i32.add)))`;

	const expected = `(module
  (func (param $lhs i32) (param $rhs i32) (result i32)
    local.get $lhs
    local.get $rhs
    i32.add
  )
)
`;

	const result = await prettier.format(input, {
		parser: "wast",
		plugins: [plugin],
	});

	expect(result).toBe(expected);
});
