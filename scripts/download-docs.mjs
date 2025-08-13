#!/usr/bin/env node
// @ts-check
/* global fetch */
import { writeFile, mkdir } from "node:fs/promises";
import { basename, join } from "node:path";

const downloadDirectory = join(".", "references", "downloads");

const watSpecs = [
	"https://raw.githubusercontent.com/WebAssembly/spec/refs/heads/main/document/core/text/conventions.rst",
	"https://raw.githubusercontent.com/WebAssembly/spec/refs/heads/main/document/core/text/instructions.rst",
	"https://raw.githubusercontent.com/WebAssembly/spec/refs/heads/main/document/core/text/lexical.rst",
	"https://raw.githubusercontent.com/WebAssembly/spec/refs/heads/main/document/core/text/modules.rst",
	"https://raw.githubusercontent.com/WebAssembly/spec/refs/heads/main/document/core/text/types.rst",
	"https://raw.githubusercontent.com/WebAssembly/spec/refs/heads/main/document/core/text/values.rst",
];

await mkdir(downloadDirectory, { recursive: true });

await Promise.all(
	watSpecs.map(async (url) => {
		const response = await fetch(url);
		const text = await response.text();
		const filePath = join(downloadDirectory, basename(url));
		await writeFile(filePath, text);
	}),
);
