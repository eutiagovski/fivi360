const path = require("path");

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  testTimeout: 15000,
  // Cloud Functions deps live under functions/node_modules
  modulePaths: [path.join(__dirname, "../../functions/node_modules")],
};
