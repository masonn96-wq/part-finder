// node test/keys.test.js
var K = require("../keys.js"), fail = 0;
function eq(n, g, w) { var ok = g === w; if (!ok) fail++; console.log((ok ? "ok  " : "FAIL") + "  " + n + (ok ? "" : "   got " + g)); }
eq("test board keeps the test key", K.appKeyFor("696ef92c12f1e2d0cae2128f"), "8b843778d4d799d1f5fe1d7a0db89b0b");
eq("any other board gets the main key", K.appKeyFor("5db74b076f3ad37ee263b3d2"), "704e82fa29aaf32f15335d5d929c6b9b");
eq("unknown board gets the main key", K.appKeyFor(""), "704e82fa29aaf32f15335d5d929c6b9b");
console.log(fail ? fail + " FAILED" : "all passed"); process.exit(fail ? 1 : 0);
