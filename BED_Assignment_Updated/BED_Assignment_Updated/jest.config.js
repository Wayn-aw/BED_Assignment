/*
Owner: Team
Jest configuration for the HawkerHub back-end unit tests.
*/

module.exports = {
  testEnvironment: "node",

  // Only look in tests/ so Jest never tries to execute app.js or seed.js
  testMatch: ["**/tests/**/*.test.js"],

  // Coverage is measured on the two layers we actually unit test.
  // Routes are thin wiring and are better covered by integration tests.
  collectCoverageFrom: ["controllers/**/*.js", "models/**/*.js", "middlewares/**/*.js"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],

  clearMocks: true,        // reset mock calls between tests automatically
  verbose: true,           // prints each test name - useful evidence for the demo video
  testTimeout: 10000,
};
