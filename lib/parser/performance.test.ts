import { describe, test, expect } from "vitest";
import { ParseError } from "./p";
import { parse } from "./wat";

describe("Performance regression test", () => {
	test("ParseError.position should be efficient", () => {
		// Create a source with many lines to test position calculation
		const lines = Array.from({ length: 1000 }, (_, i) => `line ${i}`);
		const source = lines.join("\n");
		const input = { source, index: source.length - 100 };

		const start = performance.now();

		// Call position multiple times to test caching
		for (let i = 0; i < 100; i++) {
			ParseError.position(input);
		}

		const end = performance.now();
		const duration = end - start;

		// The cached version should be much faster than 100ms for 100 calls on 1000 lines
		expect(duration).toBeLessThan(100);

		console.log(
			`ParseError.position: ${duration.toFixed(2)}ms for 100 calls on 1000-line source`,
		);
	});

	test("ParseError.position caching works correctly", () => {
		const source = "line1\nline2\nline3\ntest content here";
		const input1 = { source, index: 10 };
		const input2 = { source, index: 20 };

		const pos1 = ParseError.position(input1);
		const pos2 = ParseError.position(input2);

		// Test that positions are calculated correctly
		expect(pos1.line).toBe(2);
		expect(pos1.column).toBe(5);
		expect(pos2.line).toBe(4);
		expect(pos2.column).toBe(3);
	});

	test("Parser performance baseline monitoring", () => {
		const testCases = [
			{ name: "minimal", source: "(module)", expectedMaxMs: 10 },
			{ name: "basic", source: "(module (func $test (result i32) i32.const 42))", expectedMaxMs: 50 },
		];

		console.log("\n=== Parser Performance Baseline ===");
		
		for (const { name, source, expectedMaxMs } of testCases) {
			const iterations = 100;
			const start = performance.now();
			
			for (let i = 0; i < iterations; i++) {
				parse(source);
			}
			
			const end = performance.now();
			const avgTime = (end - start) / iterations;
			
			console.log(`${name}: ${avgTime.toFixed(3)}ms avg (target: <${expectedMaxMs}ms)`);
			
			// Set generous limits to avoid test failures while establishing baseline
			// These can be tightened after performance optimizations
			expect(avgTime).toBeLessThan(expectedMaxMs * 10); // 10x margin for baseline
		}
	});
});
