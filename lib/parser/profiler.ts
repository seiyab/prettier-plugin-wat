/**
 * Performance profiler for the WAT parser
 * Provides detailed measurements and bottleneck detection
 */

export interface PerformanceMetrics {
	name: string;
	duration: number;
	memoryUsed?: number;
	calls: number;
	children?: PerformanceMetrics[];
}

export interface ProfilerOptions {
	measureMemory?: boolean;
	trackCalls?: boolean;
	detailed?: boolean;
}

export class Profiler {
	private timings = new Map<string, { start: number; calls: number }>();
	private results = new Map<string, PerformanceMetrics>();
	private options: ProfilerOptions;
	private stack: string[] = [];

	constructor(options: ProfilerOptions = {}) {
		this.options = {
			measureMemory: true,
			trackCalls: true,
			detailed: true,
			...options,
		};
	}

	start(name: string): void {
		this.stack.push(name);
		const existing = this.timings.get(name);
		this.timings.set(name, {
			start: performance.now(),
			calls: existing ? existing.calls + 1 : 1,
		});
	}

	end(name: string): void {
		const timing = this.timings.get(name);
		if (!timing) {
			console.warn(`Profiler: No start time found for "${name}"`);
			return;
		}

		const duration = performance.now() - timing.start;
		const existing = this.results.get(name);
		
		// Remove from stack
		const stackIndex = this.stack.lastIndexOf(name);
		if (stackIndex >= 0) {
			this.stack.splice(stackIndex, 1);
		}

		const metrics: PerformanceMetrics = {
			name,
			duration: existing ? existing.duration + duration : duration,
			calls: timing.calls,
		};

		if (this.options.measureMemory && typeof process !== 'undefined' && process.memoryUsage) {
			metrics.memoryUsed = process.memoryUsage().heapUsed;
		}

		this.results.set(name, metrics);
	}

	measure<T>(name: string, fn: () => T): T {
		this.start(name);
		try {
			return fn();
		} finally {
			this.end(name);
		}
	}

	async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
		this.start(name);
		try {
			return await fn();
		} finally {
			this.end(name);
		}
	}

	getResults(): PerformanceMetrics[] {
		return Array.from(this.results.values()).sort((a, b) => b.duration - a.duration);
	}

	getReport(): string {
		const results = this.getResults();
		const totalTime = results.reduce((sum, metric) => sum + metric.duration, 0);
		
		let report = "=== Parser Performance Report ===\n\n";
		report += `Total execution time: ${totalTime.toFixed(2)}ms\n\n`;
		
		report += "Top functions by duration:\n";
		report += "Function Name".padEnd(30) + "Duration (ms)".padEnd(15) + "Calls".padEnd(10) + "Avg (ms)".padEnd(12) + "% of Total\n";
		report += "-".repeat(77) + "\n";
		
		for (const metric of results.slice(0, 20)) {
			const avg = metric.duration / metric.calls;
			const percentage = ((metric.duration / totalTime) * 100).toFixed(1);
			report += `${metric.name.padEnd(30)}${metric.duration.toFixed(2).padEnd(15)}${metric.calls.toString().padEnd(10)}${avg.toFixed(2).padEnd(12)}${percentage}%\n`;
		}

		if (this.options.measureMemory) {
			report += "\nMemory usage (where available):\n";
			const memoryMetrics = results.filter(m => m.memoryUsed !== undefined);
			for (const metric of memoryMetrics) {
				const memoryMB = (metric.memoryUsed! / 1024 / 1024).toFixed(2);
				report += `${metric.name}: ${memoryMB}MB\n`;
			}
		}

		return report;
	}

	clear(): void {
		this.timings.clear();
		this.results.clear();
		this.stack = [];
	}
}

// Global profiler instance
export const globalProfiler = new Profiler();

// Utility function to profile a function
export function profile<T>(name: string, fn: () => T): T {
	return globalProfiler.measure(name, fn);
}

// Utility function to profile an async function
export async function profileAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
	return globalProfiler.measureAsync(name, fn);
}