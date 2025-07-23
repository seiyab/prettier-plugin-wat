import { test, expect } from "vitest";
import * as prettier from "prettier";
import plugin from "../index";

test("minimal", async () => {
	const result = await prettier.format("(module)", {
		parser: "wat",
		plugins: [plugin],
	});
	expect(result).toBe("(module)\n");
});
