import { describe, test, expect } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as prettier from "prettier";

const files = [
	"core/nop.wast",
	//
];

const root = path.join(import.meta.dirname, "..");
const samples = path.join(root, "references", "spec", "test");
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

		const snapshotPath = path.join(snapshotdir, `${f}.snapshot`);
		await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
		await expect(result).toMatchFileSnapshot(snapshotPath);
	});
});
