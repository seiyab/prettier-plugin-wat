import { describe, test, expect } from "vitest";
import { parse } from "./wat";
import { ParseError } from "./p";
import { Profiler, globalProfiler } from "./profiler";

// Generate large test sources to stress test the parser
function generateLargeWatSource(complexity: 'small' | 'medium' | 'large' | 'huge'): string {
	const sizes = {
		small: { functions: 10, instructions: 50 },
		medium: { functions: 50, instructions: 200 },
		large: { functions: 200, instructions: 1000 },
		huge: { functions: 1000, instructions: 5000 }
	};
	
	const { functions, instructions } = sizes[complexity];
	
	let source = "(module\n";
	
	// Add type definitions
	for (let i = 0; i < Math.min(functions / 2, 20); i++) {
		source += `  (type $type${i} (func (param i32 i32) (result i32)))\n`;
	}
	
	// Add function definitions
	for (let i = 0; i < functions; i++) {
		source += `  (func $func${i} (param $a i32) (param $b i32) (result i32)\n`;
		
		// Add local variables
		source += `    (local $temp i32)\n`;
		source += `    (local $result i32)\n`;
		
		// Add instructions
		for (let j = 0; j < instructions / functions; j++) {
			const instructionType = j % 6;
			switch (instructionType) {
				case 0:
					source += `    local.get $a\n`;
					break;
				case 1:
					source += `    local.get $b\n`;
					break;
				case 2:
					source += `    i32.add\n`;
					break;
				case 3:
					source += `    local.set $temp\n`;
					break;
				case 4:
					source += `    local.get $temp\n`;
					break;
				case 5:
					source += `    ;; comment line ${j}\n`;
					break;
			}
		}
		
		source += `    local.get $a\n`;
		source += `    local.get $b\n`;
		source += `    i32.add\n`;
		source += `  )\n`;
	}
	
	// Add exports
	for (let i = 0; i < Math.min(functions, 10); i++) {
		source += `  (export "func${i}" (func $func${i}))\n`;
	}
	
	source += ")\n";
	return source;
}

function generateComplexWatSource(): string {
	return `(module
  ;; Complex module with nested structures and many components
  (type $t0 (func (param i32 i64 f32 f64) (result i32)))
  (type $t1 (func (param i32) (result i32)))
  
  (import "env" "memory" (memory 1))
  (import "env" "table" (table 10 funcref))
  
  (global $g0 (mut i32) (i32.const 0))
  (global $g1 i64 (i64.const 1000))
  
  (data (i32.const 0) "Hello, WebAssembly!")
  (data (i32.const 100) "Complex data segment with more content")
  
  (elem (i32.const 0) $func0 $func1 $func2)
  
  (func $func0 (param $p0 i32) (param $p1 i64) (param $p2 f32) (param $p3 f64) (result i32)
    (local $l0 i32) (local $l1 i64) (local $l2 f32) (local $l3 f64)
    
    ;; Nested block structure
    (block $outer
      (loop $main_loop
        (if (i32.eqz (local.get $p0))
          (then (br $outer))
        )
        
        (block $inner
          (if (i32.gt_s (local.get $p0) (i32.const 100))
            (then
              (local.set $l0 (i32.mul (local.get $p0) (i32.const 2)))
              (if (i32.gt_s (local.get $l0) (i32.const 200))
                (then (br $inner))
              )
            )
            (else
              (local.set $l0 (i32.add (local.get $p0) (i32.const 1)))
            )
          )
        )
        
        (local.set $p0 (i32.sub (local.get $p0) (i32.const 1)))
        (br $main_loop)
      )
    )
    
    local.get $l0
  )
  
  (func $func1 (param $val i32) (result i32)
    (local $temp i32)
    
    ;; Complex expression with many nested operations
    (local.set $temp
      (i32.add
        (i32.mul
          (i32.sub (local.get $val) (i32.const 10))
          (i32.const 3)
        )
        (i32.div_s
          (i32.rem_s (local.get $val) (i32.const 7))
          (i32.const 2)
        )
      )
    )
    
    (select
      (local.get $temp)
      (i32.const 0)
      (i32.gt_s (local.get $temp) (i32.const 0))
    )
  )
  
  (func $func2 (param $index i32) (result i32)
    ;; Memory operations
    (i32.store (local.get $index) (i32.const 42))
    (i32.load (local.get $index))
  )
  
  (export "main" (func $func0))
  (export "helper" (func $func1))
  (export "memory_ops" (func $func2))
)`;
}

describe("Comprehensive Parser Performance Analysis", () => {
	test("Profile ParseError.position performance with varying source sizes", () => {
		const profiler = new Profiler();
		const testSizes = [100, 500, 1000, 5000, 10000];
		
		console.log("\n=== ParseError.position Performance Analysis ===");
		
		for (const size of testSizes) {
			const lines = Array.from({ length: size }, (_, i) => `line ${i}`);
			const source = lines.join("\n");
			const input = { source, index: Math.floor(source.length / 2) };
			
			const iterations = 1000;
			
			const result = profiler.measure(`position_${size}_lines`, () => {
				for (let i = 0; i < iterations; i++) {
					ParseError.position(input);
				}
			});
			
			const metrics = profiler.getResults().find(m => m.name === `position_${size}_lines`);
			if (metrics) {
				const avgTime = metrics.duration / iterations;
				console.log(`${size} lines: ${metrics.duration.toFixed(2)}ms total, ${avgTime.toFixed(4)}ms avg per call`);
				
				// Performance regression check - should scale reasonably
				expect(avgTime).toBeLessThan(0.1); // 0.1ms per call should be reasonable even for large files
			}
		}
		
		profiler.clear();
	});
	
	test("Profile full parsing pipeline with different source complexities", () => {
		const profiler = new Profiler();
		const complexities: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
		
		console.log("\n=== Full Parse Pipeline Performance Analysis ===");
		
		for (const complexity of complexities) {
			const source = generateLargeWatSource(complexity);
			
			const result = profiler.measure(`parse_${complexity}`, () => {
				const ast = parse(source);
				return ast;
			});
			
			const metrics = profiler.getResults().find(m => m.name === `parse_${complexity}`);
			if (metrics) {
				console.log(`${complexity}: ${metrics.duration.toFixed(2)}ms (source: ${source.length} chars)`);
				
				// Record performance data - expect these to be slow for now (identifying bottlenecks)
				if (complexity === 'small') {
					expect(metrics.duration).toBeLessThan(5000); // Small should be under 5s
				} else if (complexity === 'medium') {
					expect(metrics.duration).toBeLessThan(10000); // Medium should be under 10s
				} else if (complexity === 'large') {
					expect(metrics.duration).toBeLessThan(30000); // Large should complete within 30s
				}
			}
		}
		
		profiler.clear();
	});
	
	test("Profile complex nested structure parsing", () => {
		const profiler = new Profiler();
		const complexSource = generateComplexWatSource();
		
		console.log("\n=== Complex Structure Parsing Performance ===");
		console.log(`Source length: ${complexSource.length} characters`);
		
		const iterations = 100;
		let totalParseTime = 0;
		
		for (let i = 0; i < iterations; i++) {
			const result = profiler.measure(`complex_parse_${i}`, () => {
				return parse(complexSource);
			});
		}
		
		const results = profiler.getResults();
		const totalTime = results.reduce((sum, metric) => sum + metric.duration, 0);
		const avgTime = totalTime / iterations;
		
		console.log(`Average parse time: ${avgTime.toFixed(2)}ms over ${iterations} iterations`);
		console.log(`Total time: ${totalTime.toFixed(2)}ms`);
		
		// Complex source is currently slow - documenting current performance
		expect(avgTime).toBeLessThan(500); // Current performance baseline
		
		profiler.clear();
	});
	
	test("Identify parsing bottlenecks through detailed profiling", () => {
		// This test will be enhanced with instrumented parser functions
		const source = generateComplexWatSource();
		
		console.log("\n=== Detailed Bottleneck Analysis ===");
		
		const start = performance.now();
		const ast = parse(source);
		const end = performance.now();
		
		console.log(`Total parsing time: ${(end - start).toFixed(2)}ms`);
		console.log(`AST node count: ${JSON.stringify(ast).length} characters in JSON`);
		
		// Test should complete successfully
		expect(ast).toBeDefined();
		expect(ast.type).toBe("Program");
	});
	
	test("Memory usage analysis", { timeout: 30000 }, () => {
		if (typeof process === 'undefined' || !process.memoryUsage) {
			console.log("Memory usage analysis skipped (not available in this environment)");
			return;
		}
		
		const initialMemory = process.memoryUsage();
		
		// Parse increasingly complex sources and measure memory growth
		const complexities: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
		const memoryGrowth: Array<{ complexity: string; heapUsed: number }> = [];
		
		console.log("\n=== Memory Usage Analysis ===");
		console.log(`Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
		
		for (const complexity of complexities) {
			const source = generateLargeWatSource(complexity);
			const ast = parse(source);
			
			// Force garbage collection if available
			if (global.gc) {
				global.gc();
			}
			
			const currentMemory = process.memoryUsage();
			const heapGrowth = currentMemory.heapUsed - initialMemory.heapUsed;
			
			memoryGrowth.push({ complexity, heapUsed: heapGrowth });
			console.log(`${complexity}: heap growth ${(heapGrowth / 1024 / 1024).toFixed(2)}MB (source: ${source.length} chars)`);
		}
		
		// Memory growth should be reasonable - not growing exponentially
		expect(memoryGrowth[0].heapUsed).toBeLessThan(50 * 1024 * 1024); // < 50MB for small
		expect(memoryGrowth[1].heapUsed).toBeLessThan(200 * 1024 * 1024); // < 200MB for medium
	});
});

describe("Parser Component Performance Benchmarks", () => {
	test("Benchmark individual parser components", () => {
		// This will be expanded once we instrument the parser components
		const profiler = new Profiler();
		
		console.log("\n=== Component Benchmarks ===");
		
		// For now, just test overall parsing performance as a baseline
		const mediumSource = generateLargeWatSource('medium');
		
		const parseTime = profiler.measure('full_parse_benchmark', () => {
			return parse(mediumSource);
		});
		
		const metrics = profiler.getResults()[0];
		console.log(`Full parse benchmark: ${metrics.duration.toFixed(2)}ms`);
		
		expect(metrics.duration).toBeLessThan(5000); // Current performance baseline
	});
});