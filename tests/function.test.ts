import { test, expect } from "vitest";
import * as prettier from "prettier";

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
		parser: "wat",
		plugins: ["./dist/index.mjs"],
	});

	expect(result).toBe(expected);
});
