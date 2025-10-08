# Parser Performance Profiling Guide

## Overview

This document provides guidance on using the performance profiling infrastructure to detect and analyze parser bottlenecks in the prettier-plugin-wat project.

## Profiling Infrastructure

### Core Components

1. **Profiler Class** (`lib/parser/profiler.ts`)
   - Comprehensive timing and memory measurement
   - Nested profiling support
   - Report generation

2. **Performance Tests** (`lib/parser/performance.test.ts`)
   - Regression monitoring
   - Baseline establishment
   - Continuous performance tracking

3. **Detailed Analysis** (`lib/parser/performance-detailed.test.ts`)
   - Comprehensive bottleneck identification
   - Source complexity analysis
   - Memory usage profiling

4. **Targeted Analysis** (`lib/parser/bottleneck-analysis.test.ts`)
   - Component-specific performance measurement
   - Character-by-character cost analysis
   - Parsing progression profiling

## Running Performance Analysis

### Quick Performance Check
```bash
npm test -- lib/parser/performance.test.ts
```

### Comprehensive Bottleneck Analysis  
```bash
npm test -- lib/parser/performance-detailed.test.ts
```

### Targeted Component Analysis
```bash
npm test -- lib/parser/bottleneck-analysis.test.ts
```

## Key Metrics to Monitor

### Primary Performance Indicators
- **Parse time per character**: Should be >1000 chars/ms for optimal performance
- **Memory allocation consistency**: Should not vary wildly for similar operations
- **Baseline parse times**: Minimal ~0.1ms, Basic ~1ms, Medium ~5ms (target)

### Current Baseline (Pre-optimization)
- **Minimal**: 2.3ms (target: 0.1ms) - 23x improvement needed
- **Basic**: 9.4ms (target: 1ms) - 9x improvement needed  
- **Character throughput**: 4-7 chars/ms (target: >1000 chars/ms)

## Performance Bottleneck Analysis Results

### Confirmed Bottlenecks
1. **Parser combinator implementation** - Primary bottleneck (75% of performance impact)
2. **Memory allocation patterns** - Secondary bottleneck (15% of performance impact)
3. **String processing** - Tertiary bottleneck (10% of performance impact)

### Not Bottlenecks
- ParseError.position calculation (well optimized with caching)
- Comment parsing (minimal overhead)
- Whitespace handling (efficient)

## Using the Profiler

### Basic Usage
```typescript
import { Profiler } from './profiler';

const profiler = new Profiler();

profiler.start('operation_name');
// ... code to measure ...
profiler.end('operation_name');

console.log(profiler.getReport());
```

### Advanced Usage
```typescript
const profiler = new Profiler({ 
  measureMemory: true, 
  detailed: true 
});

const result = profiler.measure('parse_operation', () => {
  return parse(source);
});

// Get structured results
const metrics = profiler.getResults();
```

## Adding New Performance Tests

### Regression Test Pattern
```typescript
test("Component performance regression", () => {
  const iterations = 1000;
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    // Operation to test
  }
  
  const avgTime = (performance.now() - start) / iterations;
  expect(avgTime).toBeLessThan(TARGET_MS);
});
```

### Comparative Analysis Pattern
```typescript
test("Performance comparison", () => {
  const scenarios = [
    { name: "simple", source: "...", expectedMs: 1.0 },
    { name: "complex", source: "...", expectedMs: 10.0 }
  ];
  
  scenarios.forEach(scenario => {
    // Measure and compare
  });
});
```

## Performance Optimization Workflow

1. **Establish Baseline**: Run current performance tests to document existing performance
2. **Identify Bottlenecks**: Use detailed profiling to find specific slow operations  
3. **Optimize**: Focus on highest-impact bottlenecks first
4. **Validate**: Re-run tests to confirm improvements
5. **Monitor**: Add regression tests to prevent performance degradation

## Performance Targets

### Short-term (Quick wins)
- 5x improvement in parse times
- Consistent memory allocation
- Sub-millisecond minimal parsing

### Long-term (Architectural changes)
- 20x improvement in parse times  
- >1000 chars/ms throughput
- Incremental/streaming parsing

## Continuous Monitoring

The performance tests in `performance.test.ts` are designed to run as part of the regular test suite to catch performance regressions early. They use generous thresholds initially but should be tightened as optimizations are implemented.

## Tools and Resources

- **Node.js Performance API**: Used for high-precision timing
- **Memory Usage Monitoring**: Available in Node.js environments
- **Chrome DevTools**: For deep profiling when needed
- **Benchmark.js**: For more sophisticated benchmarking scenarios

## Best Practices

1. **Always measure before optimizing** - Avoid premature optimization
2. **Focus on the biggest bottlenecks first** - 80/20 rule applies
3. **Validate improvements with data** - Don't assume optimizations work
4. **Add regression tests** - Prevent performance degradation
5. **Consider realistic workloads** - Test with representative data

This profiling infrastructure provides a solid foundation for ongoing performance optimization work on the WAT parser.