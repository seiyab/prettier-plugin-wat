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

test("if", () => {
	const source = `
(module
    ;; is_prime(n) takes a (positive) number and returns 1 if this number is
    ;; prime, 0 if it's composite.
    (func $is_prime (export "is_prime") (param $n i32) (result i32)
        (local $i i32)
        
        ;; n < 2 are not prime
        (i32.lt_u (local.get $n) (i32.const 2))
        if
            i32.const 0
            return
        end

        ;; n == 2 is prime
        (i32.eq (local.get $n) (i32.const 2))
		)
)`;
	const out = parse(source);
	expect(modifyAST(out, source)).toMatchInlineSnapshot(`
		{
		  "body": [
		    {
		      "comments": [
		        {
		          "raw": ";; is_prime(n) takes a (positive) number and returns 1 if this number is",
		          "type": "Comment",
		        },
		        {
		          "raw": ";; prime, 0 if it's composite.",
		          "type": "Comment",
		        },
		      ],
		      "modulefields": [
		        {
		          "comments": [
		            {
		              "raw": ";; n < 2 are not prime",
		              "type": "Comment",
		            },
		            {
		              "raw": ";; n == 2 is prime",
		              "type": "Comment",
		            },
		          ],
		          "export_": {
		            "comments": [],
		            "name": {
		              "raw": ""is_prime"",
		              "type": "StringLiteral",
		            },
		            "raw": "(export "is_prime")",
		            "type": "InlineExport",
		          },
		          "id": {
		            "raw": "$is_prime",
		            "type": "Identifier",
		          },
		          "instructions": [
		            {
		              "comments": [],
		              "operands": [
		                {
		                  "comments": [],
		                  "operands": [],
		                  "operator": {
		                    "comments": [],
		                    "index": {
		                      "raw": "$n",
		                      "type": "Identifier",
		                    },
		                    "raw": "local.get $n",
		                    "type": "VariableInstruction",
		                  },
		                  "raw": "(local.get $n)",
		                  "type": "FoldedPlainInstruction",
		                },
		                {
		                  "comments": [],
		                  "operands": [],
		                  "operator": {
		                    "comments": [],
		                    "raw": "i32.const 2",
		                    "type": "NumericConstInstruction",
		                    "val": {
		                      "raw": "2",
		                      "type": "Integer",
		                    },
		                  },
		                  "raw": "(i32.const 2)",
		                  "type": "FoldedPlainInstruction",
		                },
		              ],
		              "operator": {
		                "comments": [],
		                "raw": "i32.lt_u",
		                "type": "NumericSimpleInstruction",
		              },
		              "raw": "(i32.lt_u (local.get $n) (i32.const 2))",
		              "type": "FoldedPlainInstruction",
		            },
		            {
		              "blocktype": {
		                "comments": [],
		                "params": [],
		                "raw": "",
		                "results": [],
		                "type": "TypeUse",
		              },
		              "comments": [],
		              "raw": "if
		            i32.const 0
		            return
		        end",
		              "then": [
		                {
		                  "comments": [],
		                  "raw": "i32.const 0",
		                  "type": "NumericConstInstruction",
		                  "val": {
		                    "raw": "0",
		                    "type": "Integer",
		                  },
		                },
		                {
		                  "args": [],
		                  "comments": [],
		                  "raw": "return",
		                  "type": "PlainControlInstruction",
		                },
		              ],
		              "type": "IfInstruction",
		            },
		            {
		              "comments": [],
		              "operands": [
		                {
		                  "comments": [],
		                  "operands": [],
		                  "operator": {
		                    "comments": [],
		                    "index": {
		                      "raw": "$n",
		                      "type": "Identifier",
		                    },
		                    "raw": "local.get $n",
		                    "type": "VariableInstruction",
		                  },
		                  "raw": "(local.get $n)",
		                  "type": "FoldedPlainInstruction",
		                },
		                {
		                  "comments": [],
		                  "operands": [],
		                  "operator": {
		                    "comments": [],
		                    "raw": "i32.const 2",
		                    "type": "NumericConstInstruction",
		                    "val": {
		                      "raw": "2",
		                      "type": "Integer",
		                    },
		                  },
		                  "raw": "(i32.const 2)",
		                  "type": "FoldedPlainInstruction",
		                },
		              ],
		              "operator": {
		                "comments": [],
		                "raw": "i32.eq",
		                "type": "NumericSimpleInstruction",
		              },
		              "raw": "(i32.eq (local.get $n) (i32.const 2))",
		              "type": "FoldedPlainInstruction",
		            },
		          ],
		          "locals": [
		            {
		              "comments": [],
		              "id": {
		                "raw": "$i",
		                "type": "Identifier",
		              },
		              "raw": "(local $i i32)",
		              "type": "Local",
		              "valtypes": [
		                {
		                  "comments": [],
		                  "raw": "i32",
		                  "type": "NumberType",
		                },
		              ],
		            },
		          ],
		          "raw": "(func $is_prime (export "is_prime") (param $n i32) (result i32)
		        (local $i i32)
		        
		        ;; n < 2 are not prime
		        (i32.lt_u (local.get $n) (i32.const 2))
		        if
		            i32.const 0
		            return
		        end

		        ;; n == 2 is prime
		        (i32.eq (local.get $n) (i32.const 2))
				)",
		          "type": "Function",
		          "typeuse": {
		            "comments": [],
		            "params": [
		              {
		                "comments": [],
		                "id": {
		                  "raw": "$n",
		                  "type": "Identifier",
		                },
		                "raw": "(param $n i32)",
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
		            "raw": "(param $n i32) (result i32)
		        ",
		            "results": [
		              {
		                "comments": [],
		                "raw": "(result i32)",
		                "type": "Result",
		                "valtype": [
		                  {
		                    "comments": [],
		                    "raw": "i32",
		                    "type": "NumberType",
		                  },
		                ],
		              },
		            ],
		            "type": "TypeUse",
		          },
		        },
		      ],
		      "raw": "(module
		    ;; is_prime(n) takes a (positive) number and returns 1 if this number is
		    ;; prime, 0 if it's composite.
		    (func $is_prime (export "is_prime") (param $n i32) (result i32)
		        (local $i i32)
		        
		        ;; n < 2 are not prime
		        (i32.lt_u (local.get $n) (i32.const 2))
		        if
		            i32.const 0
		            return
		        end

		        ;; n == 2 is prime
		        (i32.eq (local.get $n) (i32.const 2))
				)
		)",
		      "type": "Module",
		    },
		  ],
		  "comments": [],
		  "raw": "
		(module
		    ;; is_prime(n) takes a (positive) number and returns 1 if this number is
		    ;; prime, 0 if it's composite.
		    (func $is_prime (export "is_prime") (param $n i32) (result i32)
		        (local $i i32)
		        
		        ;; n < 2 are not prime
		        (i32.lt_u (local.get $n) (i32.const 2))
		        if
		            i32.const 0
		            return
		        end

		        ;; n == 2 is prime
		        (i32.eq (local.get $n) (i32.const 2))
				)
		)",
		  "type": "Program",
		}
	`);
});
