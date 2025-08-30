import { describe, test, expect } from "vitest";
import { parse, WatNode } from "./wat";
import { AST } from "./p";
import { isNode } from "../ast";

function modifyAST(t: AST<WatNode>, source: string): unknown {
	const result: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(t)) {
		if (k === "type") {
			result[k] = v;
			continue;
		}
		if (k === "loc") {
			// eslint-disable-next-line
			result["raw"] = source.substring(v.start.offset, v.end.offset);
		}

		if (Array.isArray(v)) {
			const vs: unknown[] = [];
			for (const e of v) {
				if (!isNode(e)) {
					vs.push(e);
					continue;
				}
				const n = modifyAST(e, source);
				vs.push(n);
			}
			result[k] = vs;
		}

		if (!isNode(v)) continue;
		result[k] = modifyAST(v, source);
	}
	return result;
}

describe("local.get", () => {
	test("local.get 0", () => {
		const source = `
(module
    ;; Logging function imported from the environment; will print a single
    ;; i32.
    (import "env" "log" (func $log (param i32)))

    ;; Declare linear memory and export it to host. The offset returned by
    ;; $itoa is relative to this memory.
    (memory (export "memory") 1)
)`;
		const out = parse(source);
		expect(modifyAST(out, source)).toMatchInlineSnapshot(`
			{
			  "body": [
			    {
			      "comments": [
			        {
			          "raw": ";; Logging function imported from the environment; will print a single",
			          "type": "Comment",
			        },
			        {
			          "raw": ";; i32.",
			          "type": "Comment",
			        },
			        {
			          "raw": ";; Declare linear memory and export it to host. The offset returned by",
			          "type": "Comment",
			        },
			        {
			          "raw": ";; $itoa is relative to this memory.",
			          "type": "Comment",
			        },
			      ],
			      "modulefields": [
			        {
			          "comments": [],
			          "desc": {
			            "comments": [],
			            "id": {
			              "raw": "$log",
			              "type": "Identifier",
			            },
			            "raw": "(func $log (param i32))",
			            "target": {
			              "comments": [],
			              "params": [
			                {
			                  "comments": [],
			                  "raw": "(param i32)",
			                  "type": "Param",
			                  "valtype": [
			                    {
			                      "comments": [],
			                      "raw": "i32",
			                      "type": "NumberType",
			                    },
			                  ],
			                },
			              ],
			              "raw": "(param i32)",
			              "results": [],
			              "type": "TypeUse",
			            },
			            "type": "ImportDesc",
			          },
			          "module": {
			            "raw": ""env"",
			            "type": "StringLiteral",
			          },
			          "name": {
			            "raw": ""log"",
			            "type": "StringLiteral",
			          },
			          "raw": "(import "env" "log" (func $log (param i32)))",
			          "type": "Import",
			        },
			        {
			          "comments": [],
			          "export": {
			            "comments": [],
			            "name": {
			              "raw": ""memory"",
			              "type": "StringLiteral",
			            },
			            "raw": "(export "memory")",
			            "type": "InlineExport",
			          },
			          "memtype": {
			            "comments": [],
			            "limits": {
			              "comments": [],
			              "min": {
			                "raw": "1",
			                "type": "UInteger",
			              },
			              "raw": "1",
			              "type": "Limits",
			            },
			            "raw": "1",
			            "type": "MemType",
			          },
			          "raw": "(memory (export "memory") 1)",
			          "type": "Memory",
			        },
			      ],
			      "raw": "(module
			    ;; Logging function imported from the environment; will print a single
			    ;; i32.
			    (import "env" "log" (func $log (param i32)))

			    ;; Declare linear memory and export it to host. The offset returned by
			    ;; $itoa is relative to this memory.
			    (memory (export "memory") 1)
			)",
			      "type": "Module",
			    },
			  ],
			  "comments": [],
			  "raw": "
			(module
			    ;; Logging function imported from the environment; will print a single
			    ;; i32.
			    (import "env" "log" (func $log (param i32)))

			    ;; Declare linear memory and export it to host. The offset returned by
			    ;; $itoa is relative to this memory.
			    (memory (export "memory") 1)
			)",
			  "type": "Program",
			}
		`);
	});
});
