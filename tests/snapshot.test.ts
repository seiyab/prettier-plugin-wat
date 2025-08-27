import { describe, test, expect } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as prettier from "prettier";

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
	"table-indirect-call/table.wat",
];

const root = path.join(import.meta.dirname, "..");
const samples = path.join(root, "references", "wasm-wat-samples");
const snapshotdir = path.join(import.meta.dirname, "snapshots");

describe("snapshot (samples)", () => {
	test.each(files)("%s", async (f) => {
		const content = await fs.readFile(path.join(samples, f), {
			encoding: "utf8",
		});

		const result = await prettier.format(content, {
			parser: "wat",
			plugins: ["./dist/index.mjs"],
		});
		await expect(result).toMatchFileSnapshot(
			path.join(snapshotdir, `${f}.snapshot`),
		);
	});
});
