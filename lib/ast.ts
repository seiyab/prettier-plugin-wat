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
				
				// Smart comment hoisting: don't hoist comments from certain nodes
				// if they might belong to subsequent siblings
				if (shouldHoistCommentsFrom(e, p)) {
					comments.push(...(n.comments ?? []));
					vs.push({ ...n, comments: undefined });
				} else {
					vs.push(n); // Keep comments with the node
				}
			}
			// @ts-expect-error -- hard to infer type
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			cloned[k] = vs;
		}

		if (!isNode(v)) continue;
		if (v.type === "Comment") continue;
		const n = hoistComment(v);
		
		// Smart comment hoisting for single nodes too
		if (shouldHoistCommentsFrom(v, p)) {
			comments.push(...(n.comments ?? []));
			// @ts-expect-error -- hard to infer type
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			cloned[k] = { ...n, comments: undefined };
		} else {
			// @ts-expect-error -- hard to infer type
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			cloned[k] = n; // Keep comments with the node
		}
	}
	cloned["comments"] = comments;
	return cloned;
}

function shouldHoistCommentsFrom(childNode: WatNode, parentNode: WatNode): boolean {
	// For now, implement a simple heuristic:
	// Don't hoist comments from control structures if they might belong after the structure
	
	// Always hoist comments for most node types
	if (childNode.type !== "IfInstruction" && 
		childNode.type !== "BlockInstruction" && 
		childNode.type !== "LoopInstruction") {
		return true;
	}
	
	// For control structures, be more conservative about hoisting
	// This is a placeholder - we'd need more sophisticated logic here
	return true; // For now, keep the original behavior
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
