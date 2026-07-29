console.time("cold-load");
const mod = require("./src/index.js");
console.timeEnd("cold-load");
console.log("exports:", Object.keys(mod).join(", "));
process.exit(0);
