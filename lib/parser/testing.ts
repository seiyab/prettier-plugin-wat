import { ParserInput } from "./p";

export function check<T>(v: T | Error): T {
	if (v instanceof Error) throw v;
	return v;
}

export function input(s: string): ParserInput {
	return { source: s, index: 0 };
}
