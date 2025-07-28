import { test, expect } from "vitest";
import * as prettier from "prettier";
// import plugin from "../dist/index";

test("minimal", async () => {
	const result = await prettier.format("(module)", {
		parser: "wat",
		plugins: ["./dist/index.mjs"],
		filename: "test.wat",
	});
	expect(result).toBe("(module)\n");
});
