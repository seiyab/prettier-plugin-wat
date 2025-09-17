import {
	literal,
	AST,
	Parser,
	do_,
	many,
	opt,
	eof,
	oneOf,
	dropNone,
	commentCollector,
} from "./p";
import {
	identifier,
	Identifier,
	index,
	Index,
	stringLiteral,
	StringLiteral,
} from "./wat-values";
import {
	MemType,
	memtype,
	param,
	Param,
	result,
	Result,
	valtype,
	ValueType,
	TableType,
	tabletype,
	FunctionType,
	functype,
	ReferenceType,
	reftype,
} from "./wat-types";
import {
	Expression,
	InstructionNode,
	expr,
	instruction,
} from "./wat-instructions";
import { Comment, gap, word } from "./wat-lexical-format";

export type ModuleNodes =
	| Program
	| TypeUse
	| Module
	| ModuleField
	| Local
	| ImportDesc
	| OffsetAbbreviation
	| ElementSegment
	| ElementList
	| ElementListAbbreviation
	| ElementExpr
	| TableUse
	| DataSegment;
export type ModuleElement = FunctionElement;

export type Program = { type: "Program"; body: AST<Module>[] };
export const program: Parser<Program> = do_(($) => {
	const comments: AST<Comment>[] = [];
	const body: AST<Module>[] = [];
	comments.push(...$(gap).comments);
	for (;;) {
		if (!$.peek(literal("("))) break;
		const m = $(module_);
		body.push(m);
	}
	comments.push(...$(gap).comments);
	void $(eof);
	return { type: "Program", body, comments };
});

export type Type = {
	type: "Type";
	id?: AST<Identifier>;
	functype: AST<FunctionType>;
};
const type: Parser<Type> = do_(($) => {
	void $(literal("("));
	void $(literal("type"));
	const id = $(opt(identifier));
	const functype_ = $(functype);
	void $(literal(")"));
	return { type: "Type", id: dropNone(id), functype: functype_ };
});

export type TypeUse = {
	type: "TypeUse";
	index?: Index;
	params: AST<Param>[];
	results: AST<Result>[];
};
export const typeuse: Parser<TypeUse> = do_(($) => {
	const c = commentCollector();
	const idx = $(
		opt(
			do_(($) => {
				void $(literal("("));
				void $(literal("type"));
				const i = $(index);
				void $(literal(")"));
				return i;
			}),
		),
	);
	const params = c.drain($(many(param))).nodes;
	const results = c.drain($(many(result))).nodes;

	return {
		type: "TypeUse",
		index: dropNone(idx),
		params,
		results,
		comments: c.comments(),
	};
});

export type Export = {
	type: "Export";
	name: AST<StringLiteral>;
	exportdesc: AST<ExportDesc>;
};
export const export_: Parser<Export> = do_(($) => {
	void $(literal("("));
	void $(literal("export"));
	const name = $(stringLiteral);
	const ed = $(exportdesc);
	void $(literal(")"));
	return { type: "Export", name, exportdesc: ed };
});
export type ExportDesc = {
	type: "ExportDesc";
	kind: "func" | "table" | "memory" | "global";
	index: AST<Index>;
};
const exportKinds = new Set(["func", "table", "memory", "global"] as const);
const exportdesc = do_(($): ExportDesc => {
	void $(literal("("));
	const kind = $(word(exportKinds)).value;
	const idx = $(index);
	void $(literal(")"));
	return { type: "ExportDesc", kind, index: idx };
});

export type ImportDesc = {
	type: "ImportDesc";
	kind: string;
	id?: AST<Identifier>;
	target: unknown;
} & (
	| { kind: "func"; target: TypeUse }
	| { kind: "memory"; target: AST<MemType> }
	| { kind: "table"; target: AST<TableType> }
);

const funcimportdesc: Parser<ImportDesc> = do_(($) => {
	void $(literal("("));
	const kind = $(literal("func")).value;
	$.exclusive();
	const id = $(opt(identifier));
	const typeuse_ = $(typeuse);
	void $(literal(")"));
	return {
		type: "ImportDesc",
		kind,
		id: id.type === "None" ? undefined : id,
		target: typeuse_,
	};
});

const memimportdesc: Parser<ImportDesc> = do_(($) => {
	void $(literal("("));
	const kind = $(literal("memory")).value;
	$.exclusive();
	const id = $(opt(identifier));
	const memtype_ = $(memtype);
	void $(literal(")"));
	return {
		type: "ImportDesc",
		kind,
		id: id.type === "None" ? undefined : id,
		target: memtype_,
	};
});

const tableimportdesc: Parser<ImportDesc> = do_(($) => {
	void $(literal("("));
	const kind = $(literal("table")).value;
	$.exclusive();
	const id = $(opt(identifier));
	const tabletype_ = $(tabletype);
	void $(literal(")"));
	return {
		type: "ImportDesc",
		kind,
		id: id.type === "None" ? undefined : id,
		target: tabletype_,
	};
});

const importdesc: Parser<ImportDesc> = oneOf<ImportDesc>([
	funcimportdesc,
	memimportdesc,
	tableimportdesc,
]);

export type Import = {
	type: "Import";
	module: AST<StringLiteral>;
	name: AST<StringLiteral>;
	desc: AST<ImportDesc>;
};
export const import_: Parser<Import> = do_(($) => {
	void $(literal("("));
	void $(literal("import"));
	$.exclusive();
	const mod = $(stringLiteral);
	const name = $(stringLiteral);
	const desc = $(importdesc);
	void $(literal(")"));
	return { type: "Import", module: mod, name, desc };
});

export type Memory = {
	type: "Memory";
	id?: AST<Identifier>;
	export?: AST<InlineExport>;
	memtype: AST<MemType>;
};

const memory_: Parser<Memory> = do_(($) => {
	void $(literal("("));
	void $(literal("memory"));
	const id = $(opt(identifier));
	const ex = $(opt(inlineExport));
	const mt = $(memtype);
	void $(literal(")"));
	return {
		type: "Memory",
		id: id.type === "None" ? undefined : id,
		export: ex.type === "None" ? undefined : ex,
		memtype: mt,
	};
});

export type Table = {
	type: "Table";
	id?: AST<Identifier>;
	export?: AST<InlineExport>;
	tabletype: AST<TableType>;
};

const table: Parser<Table> = do_(($) => {
	void $(literal("("));
	void $(literal("table"));
	const id = $(opt(identifier));
	const ex = $(opt(inlineExport));
	const tt = $(tabletype);
	void $(literal(")"));
	return {
		type: "Table",
		id: id.type === "None" ? undefined : id,
		export: ex.type === "None" ? undefined : ex,
		tabletype: tt,
	};
});

export type ElementSegment = {
	type: "ElementSegment";
	id?: AST<Identifier>;
	mode: "active" | "passive" | "declarative";
	tableuse?: AST<TableUse>;
	offset?: AST<Expression>;
	elemlist: AST<ElementList | ElementListAbbreviation>;
};
const element: Parser<ElementSegment> = do_(($) => {
	void $(literal("("));
	void $(literal("elem"));
	const id = $(opt(identifier));
	const declare = $(opt(literal("declare")));
	const tableuse_ =
		declare.type === "None" ? dropNone($(opt(tableuse))) : undefined;
	const mode =
		declare.type !== "None" ? "declarative"
		: tableuse_ != null ? "active"
		: $.peek(literal("(")) ? "active"
		: "passive";
	const offset =
		mode === "active" ?
			$(
				do_(($) => {
					void $(literal("("));
					void $(opt(literal("offset")));
					const e = $(expr);
					void $(literal(")"));
					return e;
				}),
			)
		:	undefined;
	const elemlist_ = $(elemlist);
	void $(literal(")"));
	return {
		type: "ElementSegment",
		id: dropNone(id),
		mode:
			declare.type !== "None" ? "declarative"
			: tableuse_ != null ? "active"
			: "passive",
		tableuse: tableuse_,
		offset,
		elemlist: elemlist_,
	};
});

type ElementList = {
	type: "ElementList";
	reftype: AST<ReferenceType>;
	elemexprs: AST<ElementExpr>[];
};
type ElementListAbbreviation = {
	type: "ElementListAbbreviation";
	funcidxs: AST<Index>[];
};
const elemlist: Parser<ElementList | ElementListAbbreviation> = oneOf<
	ElementList | ElementListAbbreviation
>([
	do_(($) => {
		const c = commentCollector();
		const rt = $(reftype);
		const exs = c.drain($(many(elemexpr))).nodes;
		return {
			type: "ElementList",
			reftype: rt,
			elemexprs: exs,
			comments: c.comments(),
		};
	}),

	do_(($) => {
		const c = commentCollector();
		void $(opt(literal("func")));
		const funcidxs = c.drain($(many(index))).nodes;
		return {
			type: "ElementListAbbreviation",
			funcidxs,
			comments: c.comments(),
		};
	}),
]);

type ElementExpr = { type: "ElementExpr"; expr: AST<Expression> };
const elemexpr: Parser<ElementExpr> = do_(($) => {
	void $(literal("("));
	void $(opt(literal("item")));
	const ex = $(expr);
	void $(literal(")"));
	return { type: "ElementExpr", expr: ex };
});

type TableUse = { type: "TableUse"; index: AST<Index> };
const tableuse: Parser<TableUse> = do_(($) => {
	void $(literal("("));
	void $(literal("table"));
	const index_ = $(index);
	void $(literal(")"));
	return { type: "TableUse", index: index_ };
});

export type DataSegment = {
	type: "DataSegment";
	memuse?: AST<Memuse>;
	offset: AST<OffsetAbbreviation>;
	inits: AST<StringLiteral>[];
};

const data: Parser<DataSegment> = do_(($) => {
	void $(literal("("));
	void $(literal("data"));
	const mu = $(opt(memuse));
	const offset = $(offsetAbbreviation);
	const inits = $(many(stringLiteral));
	void $(literal(")"));
	return {
		type: "DataSegment",
		memuse: dropNone(mu),
		offset,
		inits: inits.nodes,
		comments: inits.comments,
	};
});

type Memuse = { type: "memuse"; memidx: AST<Index> };
const memuse: Parser<Memuse> = do_(($) => {
	void $(literal("("));
	void $(literal("memory"));
	const memidx = $(index);
	void $(literal(")"));
	return { type: "memuse", memidx };
});

type OffsetAbbreviation = {
	type: "OffsetAbbreviation";
	instr: AST<InstructionNode>;
};
const offsetAbbreviation: Parser<OffsetAbbreviation> = do_(($) => {
	void $(literal("("));
	const instr = $(instruction);
	void $(literal(")"));
	return { type: "OffsetAbbreviation", instr };
});

export type Global = {
	type: "Global";
	id?: AST<Identifier>;
	globaltype: AST<ValueType>; // TODO: mut
	expr: AST<InstructionNode>[];
};
const global_: Parser<Global> = do_(($) => {
	const c = commentCollector();
	void $(literal("("));
	void $(literal("global"));
	const id = $(opt(identifier));
	const globaltype = $(valtype);
	const expr = c.drain($(many(instruction))).nodes;
	void $(literal(")"));
	return { type: "Global", id: dropNone(id), globaltype, expr };
});

export type Module = {
	type: "Module";
	id?: AST<Identifier>;
	modulefields: AST<ModuleField>[];
};
// TODO: other modulefields
type ModuleField =
	| Type
	| Import
	| Function
	| Table
	| Memory
	| Global
	| Export
	| ElementSegment
	| DataSegment;
export const module_: Parser<Module> = do_(($) => {
	void $(literal("("));
	void $(literal("module"));
	const id = $(opt(identifier));
	const modulefields: AST<ModuleField>[] = [];
	for (;;) {
		if (!$.peek(literal("("))) break;
		modulefields.push(
			$(
				oneOf<ModuleField>([
					type,
					export_,
					function_,
					import_,
					memory_,
					global_,
					table,
					element,
					data,
				]),
			),
		);
	}
	void $(literal(")"));
	return {
		type: "Module",
		id: id.type !== "None" ? id : undefined,
		modulefields,
	};
});

export type Local = {
	type: "Local";
	id?: AST<Identifier>;
	valtypes: AST<ValueType>[];
};
const local: Parser<Local> = do_(($) => {
	const c = commentCollector();
	void $(literal("("));
	void $(literal("local"));
	const id = $(opt(identifier));
	const v = c.drain($(many(valtype))).nodes;
	if (v.length === 0) return new Error("local must have at least one valtype");
	void $(literal(")"));
	return {
		type: "Local",
		id: id.type === "None" ? undefined : id,
		valtypes: v,
		comments: c.comments(),
	};
});

export type Function = {
	type: "Function";
	id?: AST<Identifier>;
	export_?: AST<InlineExport>;
	typeuse: AST<TypeUse>;
	locals: AST<Local>[];
	instructions: AST<InstructionNode>[];
};
export const function_: Parser<Function> = do_(($) => {
	const c = commentCollector();
	void $(literal("("));
	void $(literal("func"));
	void $.exclusive();
	const id = $(opt(identifier));
	const ex = $(opt(inlineExport));
	const tu = $(typeuse);
	const locals = c.drain($(many(local))).nodes;
	const instructions = c.drain($(many(instruction))).nodes;
	void $(literal(")"));
	return {
		type: "Function",
		id: id.type === "None" ? undefined : id,
		export_: ex.type === "None" ? undefined : ex,
		typeuse: tu,
		locals,
		instructions,
		comments: c.comments(),
	};
});
type FunctionElement = InlineExport;
type InlineExport = { type: "InlineExport"; name: StringLiteral };
const inlineExport: Parser<InlineExport> = do_(($) => {
	void $(literal("("));
	void $(literal("export"));
	const name = $(stringLiteral);
	void $(literal(")"));
	return { type: "InlineExport", name };
});
