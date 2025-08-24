import { describe, test } from "vitest";
import { parse } from "./wat";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const files = [
	"add/add.wat",
	"add-not-folded/add-not-folded.wat",
	"if-expr/ifexpr.wat",
	"endian-flip/endianflip.wat",
	"memory-basics/memory-basics.wat",
	"itoa/itoa.wat",
	"vector-min/vmin.wat",
	"select/select.wat",
	"recursion/recursion.wat",
];

const root = path.join(import.meta.dirname, "..", "..");
const samples = path.join(root, "references", "wasm-wat-samples");

describe("parse sample sources", () => {
	test.each(files)("%s", async (f) => {
		const content = await fs.readFile(path.join(samples, f), {
			encoding: "utf8",
		});
		parse(content.toString());
	});
});

// We can utilize this test to see AST.
// remove skip and select file and run.
test.skip("output AST", async () => {
	const file = "add-not-folded/add-not-folded.wat";
	const content = await fs.readFile(path.join(samples, file), {
		encoding: "utf8",
	});
	const ast = parse(content.toString());
	console.error(JSON.stringify(ast, null, 2));
});
