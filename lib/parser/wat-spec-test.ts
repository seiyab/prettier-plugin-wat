import { AST, commentCollector, do_, literal, many, oneOf, Parser } from "./p";
import { instr, InstructionNode } from "./wat-instructions";
import { Module, module_ } from "./wat-modules";
import { StringLiteral, stringLiteral } from "./wat-values";

export type Assert = AssertReturn | AssertInvalid;
export const assert: Parser<Assert> = do_(($) =>
	$(oneOf<Assert>([assertReturn, assertInvalid])),
);

export type AssertReturn = {
	type: "AssertReturn";
	invoke: AST<StringLiteral>;
	params: AST<InstructionNode>[];
	results: AST<InstructionNode>[];
};
const assertReturn: Parser<AssertReturn> = do_(($) => {
	const c = commentCollector();
	void $(literal("("));
	void $(literal("assert_return"));
	void $.exclusive();

	void $(literal("("));
	void $(literal("invoke"));
	const invoke = $(stringLiteral);
	const params = c.drain($(many(instr))).nodes;
	void $(literal(")"));

	const results = c.drain($(many(instr))).nodes;
	void $(literal(")"));
	return { type: "AssertReturn", invoke, params, results };
});

export type AssertInvalid = {
	type: "AssertInvalid";
	module: AST<Module>;
	reason: StringLiteral;
};
const assertInvalid: Parser<AssertInvalid> = do_(($) => {
	void $(literal("("));
	void $(literal("assert_invalid"));
	$.exclusive();
	const module = $(module_);
	const reason = $(stringLiteral);
	void $(literal(")"));
	return { type: "AssertInvalid", module, reason };
});
