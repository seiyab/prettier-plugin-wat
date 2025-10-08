/**
 * Instrumented parser components with performance profiling
 * This module provides profiled versions of key parser functions
 */

import { profile, globalProfiler } from "./profiler";
import * as originalP from "./p";
import * as originalWatLexical from "./wat-lexical-format";

// Export original functionality with profiling instrumentation
export * from "./p";
export * from "./wat-lexical-format";

// Instrumented versions of key parser functions
export function instrumentedSpaces(input: originalP.ParserInput): originalP.ParserOutput<originalP.None> {
	return profile("spaces", () => originalWatLexical.spaces(input));
}

export const instrumentedComment = {
	parse: (input: originalP.ParserInput) => profile("comment", () => originalWatLexical.comment.parse(input))
};

export const instrumentedGap = {
	parse: (input: originalP.ParserInput) => profile("gap", () => originalWatLexical.gap.parse(input))
};

// Create profiled parser function
export function profiledParser<T extends originalP.Node>(
	p: originalP.ParserFunc<T> | originalP.Parser<T>,
	name?: string
): originalP.Parser<T> {
	const parserName = name || "anonymous_parser";
	
	if (typeof p !== "function") {
		return {
			parse: (input: originalP.ParserInput) => profile(`${parserName}.parse`, () => p.parse(input))
		};
	}
	
	const fn = p;
	return {
		parse: (input: originalP.ParserInput) => {
			return profile(`${parserName}.parse`, () => {
				const out = fn(input);
				if (out instanceof originalP.ParseError) return out;
				if (out instanceof Error) return new originalP.ParseError(out, input);
				const { node, nextInput } = out;
				return {
					node: {
						...node,
						loc: { start: { offset: input.index }, end: { offset: nextInput.index } },
					},
					nextInput: nextInput,
				};
			});
		}
	};
}

// Instrumented do_ function
export function profiledDo<T extends originalP.Node>(
	process: (tools: any) => T | Error,
	opts?: any,
	name?: string
): originalP.Parser<T> {
	const doName = name || "do_parser";
	
	return {
		parse: (input: originalP.ParserInput) => {
			return profile(`${doName}.parse`, () => {
				return originalP.do_(process, opts).parse(input);
			});
		}
	};
}

// Profile common parser components
export function getProfiledParserStats() {
	return globalProfiler.getResults();
}

export function clearProfiledParserStats() {
	globalProfiler.clear();
}

export function getProfiledParserReport() {
	return globalProfiler.getReport();
}