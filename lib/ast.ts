import { AST } from "./parser/p";
import { WatNode } from "./parser/wat";
import { util } from "prettier";

export function hoistComment(p: WatNode): WatNode {
	const comments = p.comments ?? [];
	const cloned = { ...p };
	for (const [k, v] of Object.entries(cloned)) {
		if (Array.isArray(v)) {
			const vs: unknown[] = [];
			for (const e of v) {
				if (!isNode(e)) {
					vs.push(e);
					continue;
				}
				const n = hoistComment(e);
				comments.push(...(n.comments ?? []));
				vs.push({ ...n, comments: undefined });
			}
			// @ts-expect-error -- hard to infer type
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			cloned[k] = vs;
		}

		if (!isNode(v)) continue;
		if (v.type === "Comment") continue;
		const n = hoistComment(v);
		comments.push(...(n.comments ?? []));
		// @ts-expect-error -- hard to infer type
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		cloned[k] = { ...n, comments: undefined };
	}
	cloned["comments"] = comments;
	return cloned;
}

export function isNode(x: unknown): x is WatNode {
	if (x == null) return false;
	if (typeof x !== "object") return false;
	if (!("type" in x)) return false;
	if (typeof x.type !== "string") return false;
	return true;
}

export const isNextLineEmpty = (
	node: WatNode,
	{ originalText }: { originalText: string },
) => util.isNextLineEmpty(originalText, locEnd(node));

export const locStart = (node: AST<WatNode>) => node.loc.start.offset;
export const locEnd = (node: AST<WatNode>) => node.loc.end.offset;
