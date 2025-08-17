import {
	do_,
	literal,
	oneOf,
	opt,
	AST,
	Parser,
	commentCollector,
	many,
} from "./p";
import { identifier, Identifier, uInteger, UInteger } from "./wat-values";

export type TypeNodes =
	| ValueType
	| FunctionType
	| Param
	| Result
	| Limits
	| MemType;

export type ValueType = {
	type: "ValueType";
	value: "i32" | "i64" | "f32" | "f64";
};
export const valtype: Parser<ValueType> = do_(($) => {
	const out = $(oneOf((["i32", "i64", "f32", "f64"] as const).map(literal)));
	return { type: "ValueType", value: out.value };
});

type FunctionType = Param | Result; // TODO: functype

export type Param = {
	type: "Param";
	id?: AST<Identifier>;
	valtype: AST<ValueType>[];
};
export const param: Parser<Param> = do_(($) => {
	void $(literal("("));
	void $(literal("param"));
	void $.exclusive();
	const c = commentCollector();
	const id = $(opt(identifier));
	const v = c.drain($(many(valtype))).nodes;
	void $(literal(")"));
	return {
		type: "Param",
		id: id.type === "None" ? undefined : id,
		valtype: v,
		comments: c.comments(),
	};
});

export type Result = { type: "Result"; valtype: AST<ValueType>[] };
export const result: Parser<Result> = do_(($) => {
	void $(literal("("));
	void $(literal("result"));
	void $.exclusive();
	const c = commentCollector();
	const v = c.drain($(many(valtype))).nodes;
	if (v.length === 0) return Error("expected one or more valtypes");
	void $(literal(")"));
	return { type: "Result", valtype: v, comments: c.comments() };
});

export type Limits = {
	type: "Limits";
	min: AST<UInteger>;
	max?: AST<UInteger>;
};
const limits: Parser<Limits> = do_(($) => {
	const min = $(uInteger);
	const max = $(opt(uInteger));
	return { type: "Limits", min, max: max.type === "None" ? undefined : max };
});

export type MemType = { type: "MemType"; limits: AST<Limits> };
export const memtype: Parser<MemType> = do_(($) => {
	const limits_ = $(limits);
	return { type: "MemType", limits: limits_ };
});
