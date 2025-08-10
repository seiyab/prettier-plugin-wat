import { do_, literal, oneOf, opt, AST, Parser } from "./p";
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
	const out = $(
		oneOf([literal("i32"), literal("i64"), literal("f32"), literal("f64")]),
	);
	return { type: "ValueType", value: out.value as ValueType["value"] };
});

type FunctionType = Param | Result; // TODO: functype

export type Param = { type: "Param"; id?: AST<Identifier>; v: AST<ValueType> };
export const param: Parser<Param> = do_(($) => {
	void $(literal("("));
	void $(literal("param"));
	const id = $(opt(identifier));
	const v = $(valtype);
	void $(literal(")"));
	return { type: "Param", id: id.type === "None" ? undefined : id, v };
});

export type Result = { type: "Result"; v: AST<ValueType> };
export const result: Parser<Result> = do_(($) => {
	void $(literal("("));
	void $(literal("result"));
	const v = $(valtype);
	void $(literal(")"));
	return { type: "Result", v };
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
