import { describe, test, expect } from "vitest";
import { parse } from "./wat";

describe("table parsing", () => {
	test("should parse simple table", () => {
		const source = `(module (table 1 funcref))`;
		expect(() => parse(source)).not.toThrow();
	});

	test("should parse table with id", () => {
		const source = `(module (table $t 1 funcref))`;
		expect(() => parse(source)).not.toThrow();
	});

	test("should parse table with export", () => {
		const source = `(module (table (export "t") 1 funcref))`;
		expect(() => parse(source)).not.toThrow();
	});

	test("should parse table with limits", () => {
		const source = `(module (table 1 10 funcref))`;
		expect(() => parse(source)).not.toThrow();
	});

	test("should parse table with externref", () => {
		const source = `(module (table 5 externref))`;
		expect(() => parse(source)).not.toThrow();
	});

	test("should parse complex table module", () => {
		const source = `(module
		  ;; Simple table
		  (table 0 funcref)
		  
		  ;; Table with identifier  
		  (table $myTable 1 10 funcref)
		  
		  ;; Table with export
		  (table (export "shared-table") 10 20 funcref)
		  
		  ;; Table with externref
		  (table $refs 5 externref)
		  
		  ;; Table with both id and export
		  (table $exportedTable (export "exported") 3 7 funcref)
		)`;
		expect(() => parse(source)).not.toThrow();
	});

	test("should parse table import", () => {
		const source = `(module (import "env" "table" (table 1 10 funcref)))`;
		expect(() => parse(source)).not.toThrow();
	});

	test("should parse table export", () => {
		const source = `(module (table $t 5 funcref) (export "mytable" (table $t)))`;
		expect(() => parse(source)).not.toThrow();
	});

	test("should parse realistic table module", () => {
		const source = `
		(module
		  ;; Function table with 3 slots
		  (table $functions 3 funcref)
		  
		  ;; Exported table
		  (table (export "shared") 5 10 funcref)
		  
		  ;; Table with externref
		  (table $refs 2 externref)
		)`;
		expect(() => parse(source)).not.toThrow();
	});
});
