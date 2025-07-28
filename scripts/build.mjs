#!/usr/bin/env node
// @ts-check
import { build } from "esbuild";

/**
 * @import {Format} from "esbuild"
 */

/** @type {[format: Format, outfile: string][]} */
const configs = [
	["cjs", "./dist/index.cjs"],
	["esm", "./dist/index.mjs"],
];

await Promise.all(
	configs.map(([format, outfile]) =>
		build({
			entryPoints: ["./index.ts"],
			bundle: true,
			platform: "node",
			format,
			outfile,
		}),
	),
);
