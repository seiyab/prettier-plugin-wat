import { test, expect } from "vitest";
import * as prettier from "prettier";

test("export", async () => {
	const input = `(module
									(export "f" (func $f))
									(export "g" (global $g))
									(export "m" (memory $m))
									(export "t" (table $t))
								)`;

	const expected = `(module
  (export "f" (func $f))
  (export "g" (global $g))
  (export "m" (memory $m))
  (export "t" (table $t))
)
`;

	const result = await prettier.format(input, {
		parser: "wat",
		plugins: ["./dist/index.mjs"],
	});

	expect(result).toBe(expected);
});
