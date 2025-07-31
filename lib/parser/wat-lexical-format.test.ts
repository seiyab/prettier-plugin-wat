import { describe, it, expect } from "vitest";
import { comment } from "./wat-lexical-format";
import { check, o } from "./testing";

describe("comment", () => {
	it("should parse a block comment", () => {
		const input = { source: "(; this is a block comment ;)", index: 0 };
		const result = check(comment.parse(input));
		expect(result.node).toEqual(
			o({
				type: "Comment",
				kind: "block",
				content: " this is a block comment ",
			}),
		);
	});

	it("should parse a line comment", () => {
		const input = { source: ";; this is a line comment\n", index: 0 };
		const result = check(comment.parse(input));
		expect(result.node).toEqual(
			o({ type: "Comment", kind: "line", content: " this is a line comment" }),
		);
	});

	it("should return error for unclosed block comment", () => {
		const input = { source: "(; unclosed", index: 0 };
		const result = comment.parse(input);
		expect(result).toBeInstanceOf(Error);
	});
});
