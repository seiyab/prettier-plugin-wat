import { describe, test } from "vitest";
import { parse } from "./wat";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const files = [
	"core/nop.wast",
	//
];

const root = path.join(import.meta.dirname, "..", "..");
const samples = path.join(root, "references", "spec", "test");

describe("parse spec test fixtures", () => {
	test.each(files)("%s", async (f) => {
		const content = await fs.readFile(path.join(samples, f), {
			encoding: "utf8",
		});
		parse(content.toString());
	});
}, 10_000);
