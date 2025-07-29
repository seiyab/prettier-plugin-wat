import { do_, literal, oneOf, Parser } from "./p";

export type TypeNodes = ValueType;

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
