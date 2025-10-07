import { Doc, doc, AstPath } from "prettier";
import { Print } from "./types";
import { WatNode } from "./parser/wat";
import { AssertInvalid, AssertReturn } from "./parser/wat-spec-test";

const { group, indent, join, line, softline } = doc.builders;

export function printAssertReturn(
	node: AssertReturn,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = ["(assert_return"];
	const body: Doc[] = [];
	const invoke: Doc[] = [
		"(invoke ",
		print("invoke"),
		node.params.length == 0 ?
			""
		:	indent([line, group(join(line, path.map(print, "params")))]),
		softline,
		")",
	];

	body.push(group(invoke));

	const results: Doc =
		node.results.length == 0 ?
			""
		:	[
				line,
				group([
					"(result",
					indent([line, group(join(line, path.map(print, "results")))]),
					softline,
					")",
				]),
			];
	body.push(results);

	parts.push(indent([line, body]));

	parts.push(softline, ")");
	return group(parts);
}

export function printAssertInvalid(
	node: AssertInvalid,
	path: AstPath<WatNode>,
	print: Print,
): Doc {
	const parts: Doc[] = [
		"(assert_invalid",
		indent([line, print("module"), line, print("reason")]),
		softline,
		")",
	];
	return group(parts);
}
