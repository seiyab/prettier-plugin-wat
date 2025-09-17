import { describe, test, expect } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as prettier from "prettier";

const files = [
	"add/add.wat",
	"add-not-folded/add-not-folded.wat",
	"endian-flip/endianflip.wat",
	"if-expr/ifexpr.wat",
	"import-between-modules/mod1.wat",
	"import-between-modules/mod2.wat",
	"itoa/itoa.wat",
	"locals/locals.wat",
	"loops/loops.wat",
	"memory-basics/memory-basics.wat",
	"prime-test/isprime.wat",
	"recursion/recursion.wat",
	"select/select.wat",
	"stack/stack.wat",
	"table-indirect-call/table.wat",
	"vector-add/vecadd.wat",
	"vector-count-value/vcount.wat",
	"vector-min/vmin.wat",
	"wasi-env-print/envprint.wat",
	"wasi-fdwrite/write.wat",
	"wasi-read-file/readfile.wat",
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
