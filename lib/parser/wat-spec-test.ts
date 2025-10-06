import { AST, commentCollector, do_, literal, many, oneOf, Parser } from "./p";
import { instr, InstructionNode } from "./wat-instructions";
import { Module, module_ } from "./wat-modules";
import { stringLiteral } from "./wat-values";

export type Assert = AssertReturn | AssertInvalid;
export const assert: Parser<Assert> = do_(($) =>
	$(oneOf<Assert>([assertReturn, assertInvalid])),
);

type AssertReturn = {
	type: "AssertReturn";
	invoke: string;
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
	const invoke = $(stringLiteral).value;
	const params = c.drain($(many(instr))).nodes;
	void $(literal(")"));

	const results = c.drain($(many(instr))).nodes;
	void $(literal(")"));
	return { type: "AssertReturn", invoke, params, results };
});

type AssertInvalid = {
	type: "AssertInvalid";
	module: AST<Module>;
	reason: string;
};
const assertInvalid: Parser<AssertInvalid> = do_(($) => {
	void $(literal("("));
	void $(literal("assert_invalid"));
	$.exclusive();
	const module = $(module_);
	const reason = $(stringLiteral).value;
	void $(literal(")"));
	return { type: "AssertInvalid", module, reason };
});
