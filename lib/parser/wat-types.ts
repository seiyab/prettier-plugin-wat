import {
	do_,
	literal,
	oneOf,
	opt,
	AST,
	Parser,
	commentCollector,
	many,
	dropNone,
} from "./p";
import { word } from "./wat-lexical-format";
import { identifier, Identifier, uInteger, UInteger } from "./wat-values";

export type TypeNodes =
	| ValueType
	| ReferenceType
	| FunctionType
	| Param
	| Result
	| Limits
	| MemType
	| TableType;

type NumberType = { type: "NumberType"; value: "i32" | "i64" | "f32" | "f64" };
export const numtype: Parser<NumberType> = do_(($) => {
	const out = $(oneOf((["i32", "i64", "f32", "f64"] as const).map(literal)));
	return { type: "NumberType", value: out.value };
});

export type VectorType = { type: "VectorType"; value: "v128" };
export const vectype: Parser<VectorType> = do_(($) => {
	const out = $(literal("v128"));
	return { type: "VectorType", value: out.value };
});

export type ReferenceType = {
	type: "ReferenceType";
	value: "funcref" | "externref";
};
export const reftype: Parser<ReferenceType> = do_(($) => {
	const out = $(word(new Set(["funcref", "externref"] as const)));
	return { type: "ReferenceType", value: out.value };
});

export type ValueType = NumberType | VectorType | ReferenceType;
export const valtype: Parser<ValueType> = oneOf<ValueType>([
	numtype,
	vectype,
	reftype,
]);

export type FunctionType = {
	type: "FunctionType";
	params: AST<Param>[];
	results: AST<Result>[];
};
export const functype: Parser<FunctionType> = do_(($) => {
	const c = commentCollector();
	void $(literal("("));
	void $(literal("func"));
	const params = c.drain($(many(param))).nodes;
	const results = c.drain($(many(result))).nodes;
	void $(literal(")"));
	return { type: "FunctionType", params, results, comments: c.comments() };
});

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
	return { type: "Limits", min, max: dropNone(max) };
});

export type MemType = { type: "MemType"; limits: AST<Limits> };
export const memtype: Parser<MemType> = do_(($) => {
	const limits_ = $(limits);
	return { type: "MemType", limits: limits_ };
});

export type TableType = {
	type: "TableType";
	limits: AST<Limits>;
	reftype: AST<ReferenceType>;
};
export const tabletype: Parser<TableType> = do_(($) => {
	const limits_ = $(limits);
	const reftype_ = $(reftype);
	return { type: "TableType", limits: limits_, reftype: reftype_ };
});
