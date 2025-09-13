import { parse } from './lib/parser/wat.js';

const code = `(module
    (func $test
        (local.get $n) (i32.const 2)
        if
            i32.const 0
            return
        end
        
        ;; this comment should be after end
        (i32.eq (local.get $n) (i32.const 2))
    )
)`;

console.log("=== INPUT ===");
console.log(code);

const ast = parse(code);
console.log("\n=== AST ===");
console.log(JSON.stringify(ast, null, 2));