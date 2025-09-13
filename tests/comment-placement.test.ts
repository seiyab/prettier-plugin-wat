import { describe, test, expect } from "vitest";
import * as prettier from "prettier";

describe("comment placement fix", () => {
	test("comments after end should not be inside control structure", async () => {
		const input = `(module
    (func $test
        (local.get $n) (i32.const 2)
        if
            i32.const 0
            return
        end
        
        ;; this comment should be after end
        (i32.eq (local.get $n) (i32.const 2))
    )
)`;

		const result = await prettier.format(input, {
			parser: "wat",
			plugins: ["./dist/index.mjs"],
		});

		// The comment should be AFTER the end, not inside the if block
		const expected = `(module
  (func $test
    (local.get $n)
    (i32.const 2)
    if
      i32.const 0
      return
    end
    ;; this comment should be after end
    (i32.eq (local.get $n) (i32.const 2))
  )
)
`;
		
		console.log("=== INPUT ===");
		console.log(input);
		console.log("\n=== ACTUAL OUTPUT ===");
		console.log(result);
		console.log("\n=== EXPECTED OUTPUT ===");
		console.log(expected);

		expect(result).toBe(expected);
	});
});