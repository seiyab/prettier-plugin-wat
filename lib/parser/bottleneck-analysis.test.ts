import { describe, test, expect } from "vitest";
import { parse } from "./wat";
import { Profiler } from "./profiler";
import * as fs from "fs";

// Simple WAT sources for targeted performance analysis
const simpleWatSources = {
	minimal: "(module)",
	
	basic: "(module (func $test (result i32) i32.const 42))",
	
	withComments: `(module
		;; This is a line comment
		(; This is a block comment ;)
		(func $test (result i32)
			i32.const 42 ;; Another comment
		)
	)`,
	
	withSpaces: `(module
		
		(func   $test   (result   i32)
			
			i32.const   42
			
		)
		
	)`,
	
	mediumComplexity: `(module
		(type $sig (func (param i32) (result i32)))
		(func $add (param $a i32) (param $b i32) (result i32)
			local.get $a
			local.get $b
			i32.add
		)
		(func $multiply (param $x i32) (result i32)
			local.get $x
			i32.const 2
			i32.mul
		)
		(export "add" (func $add))
		(export "multiply" (func $multiply))
	)`,
};

describe("Targeted Parser Bottleneck Analysis", () => {
	test("Profile parsing progression from simple to complex", () => {
		const profiler = new Profiler();
		
		console.log("\n=== Parsing Progression Analysis ===");
		
		Object.entries(simpleWatSources).forEach(([name, source]) => {
			const iterations = name === 'minimal' ? 10000 : name === 'basic' ? 1000 : 100;
			
			let totalTime = 0;
			for (let i = 0; i < iterations; i++) {
				const result = profiler.measure(`${name}_parse`, () => {
					return parse(source);
				});
			}
			
			const metrics = profiler.getResults().find(m => m.name === `${name}_parse`);
			if (metrics) {
				const avgTime = metrics.duration / iterations;
				const throughput = 1000 / avgTime; // parses per second
				console.log(`${name.padEnd(15)}: ${avgTime.toFixed(3)}ms avg (${throughput.toFixed(0)} parses/sec) - ${source.length} chars`);
			}
		});
		
		profiler.clear();
	});
	
	test("Analyze character-by-character parsing cost", () => {
		const profiler = new Profiler();
		
		console.log("\n=== Character-by-Character Cost Analysis ===");
		
		// Test sources of different lengths but similar complexity
		const sources = [
			"(module)",
			"(module (func $a (result i32) i32.const 1))",
			"(module (func $longer_name (result i32) i32.const 42))",
			"(module (func $even_longer_function_name (result i32) i32.const 123456))",
		];
		
		sources.forEach(source => {
			const iterations = 1000;
			
			const result = profiler.measure(`length_${source.length}`, () => {
				for (let i = 0; i < iterations; i++) {
					parse(source);
				}
			});
			
			const metrics = profiler.getResults().find(m => m.name === `length_${source.length}`);
			if (metrics) {
				const avgTime = metrics.duration / iterations;
				const charsPerMs = source.length / avgTime;
				console.log(`${source.length} chars: ${avgTime.toFixed(3)}ms avg (${charsPerMs.toFixed(0)} chars/ms)`);
			}
		});
		
		profiler.clear();
	});
	
	test("Profile comment parsing overhead", () => {
		const profiler = new Profiler();
		
		console.log("\n=== Comment Parsing Overhead Analysis ===");
		
		const sourceWithoutComments = "(module (func $test (result i32) i32.const 42))";
		
		const sourceWithLineComments = `(module
			;; Comment 1
			(func $test ;; Comment 2
				(result i32) ;; Comment 3
				i32.const 42 ;; Comment 4
			) ;; Comment 5
		)`;
		
		const sourceWithBlockComments = `(module
			(; Block comment 1 ;)
			(func $test (;comment 2;) (result i32) (;comment 3;)
				i32.const 42
			) (;comment 4;)
		)`;
		
		const sources = [
			{ name: "no_comments", source: sourceWithoutComments },
			{ name: "line_comments", source: sourceWithLineComments },
			{ name: "block_comments", source: sourceWithBlockComments },
		];
		
		sources.forEach(({ name, source }) => {
			const iterations = 500;
			
			const result = profiler.measure(`comments_${name}`, () => {
				for (let i = 0; i < iterations; i++) {
					parse(source);
				}
			});
			
			const metrics = profiler.getResults().find(m => m.name === `comments_${name}`);
			if (metrics) {
				const avgTime = metrics.duration / iterations;
				console.log(`${name.padEnd(15)}: ${avgTime.toFixed(3)}ms avg - ${source.length} chars`);
			}
		});
		
		profiler.clear();
	});
	
	test("Profile space/whitespace parsing overhead", () => {
		const profiler = new Profiler();
		
		console.log("\n=== Whitespace Parsing Overhead Analysis ===");
		
		const compact = "(module(func $test(result i32)i32.const 42))";
		const normal = "(module (func $test (result i32) i32.const 42))";
		const spacious = `(module   
			(func   $test   (result   i32)   
				i32.const   42   
			)   
		)`;
		const extraSpacious = `(module   
		
		
			(func   $test   (result   i32)   
			
			
				i32.const   42   
				
				
			)   
			
			
		)`;
		
		const sources = [
			{ name: "compact", source: compact },
			{ name: "normal", source: normal },
			{ name: "spacious", source: spacious },
			{ name: "extra_spacious", source: extraSpacious },
		];
		
		sources.forEach(({ name, source }) => {
			const iterations = 500;
			
			const result = profiler.measure(`spaces_${name}`, () => {
				for (let i = 0; i < iterations; i++) {
					parse(source);
				}
			});
			
			const metrics = profiler.getResults().find(m => m.name === `spaces_${name}`);
			if (metrics) {
				const avgTime = metrics.duration / iterations;
				const spacesCount = (source.match(/\s/g) || []).length;
				console.log(`${name.padEnd(15)}: ${avgTime.toFixed(3)}ms avg - ${spacesCount} spaces, ${source.length} total chars`);
			}
		});
		
		profiler.clear();
	});
	
	test("Profile nested structure parsing", () => {
		const profiler = new Profiler();
		
		console.log("\n=== Nested Structure Parsing Analysis ===");
		
		// Generate sources with different nesting levels
		function generateNestedSource(depth: number): string {
			let source = "(module ";
			
			// Create nested block structures
			for (let i = 0; i < depth; i++) {
				source += `(block $level${i} `;
			}
			
			source += "i32.const 42 ";
			
			for (let i = 0; i < depth; i++) {
				source += ") ";
			}
			
			source += ")";
			return source;
		}
		
		const depths = [1, 5, 10, 20, 50];
		
		depths.forEach(depth => {
			const source = generateNestedSource(depth);
			const iterations = Math.max(10, 500 / depth); // Fewer iterations for deeper nesting
			
			const result = profiler.measure(`nested_${depth}`, () => {
				for (let i = 0; i < iterations; i++) {
					parse(source);
				}
			});
			
			const metrics = profiler.getResults().find(m => m.name === `nested_${depth}`);
			if (metrics) {
				const avgTime = metrics.duration / iterations;
				console.log(`depth ${depth.toString().padEnd(2)}: ${avgTime.toFixed(3)}ms avg - ${source.length} chars`);
			}
		});
		
		profiler.clear();
	});
	
	test("Generate detailed profiling report", () => {
		const profiler = new Profiler({ detailed: true, measureMemory: true });
		
		console.log("\n=== Detailed Profiling Report ===");
		
		// Parse a medium complexity source multiple times with detailed profiling
		const source = simpleWatSources.mediumComplexity;
		const iterations = 50;
		
		for (let i = 0; i < iterations; i++) {
			profiler.measure(`detailed_parse_${i}`, () => {
				return parse(source);
			});
		}
		
		const report = profiler.getReport();
		console.log(report);
		
		// Basic sanity check
		expect(profiler.getResults().length).toBeGreaterThan(0);
		
		profiler.clear();
	});
});

describe("Performance Regression Detection", () => {
	test("Establish performance baselines", () => {
		console.log("\n=== Performance Baselines ===");
		
		const baselines = {
			minimal: { source: simpleWatSources.minimal, expectedMs: 1.0 },
			basic: { source: simpleWatSources.basic, expectedMs: 5.0 },
			medium: { source: simpleWatSources.mediumComplexity, expectedMs: 50.0 },
		};
		
		Object.entries(baselines).forEach(([name, { source, expectedMs }]) => {
			const start = performance.now();
			for (let i = 0; i < 100; i++) {
				parse(source);
			}
			const end = performance.now();
			
			const avgTime = (end - start) / 100;
			const performanceRatio = avgTime / expectedMs;
			
			console.log(`${name}: ${avgTime.toFixed(3)}ms avg (${performanceRatio.toFixed(2)}x expected)`);
			
			// Document current performance (not enforcing strict limits yet)
			// These values represent the current state and will help track improvements
			expect(avgTime).toBeLessThan(expectedMs * 100); // Very generous limit to establish baseline
		});
	});
});