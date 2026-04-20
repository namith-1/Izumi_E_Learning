module.exports = {
  testEnvironment: "node",
  verbose: true,
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  reporters: [
    "default",
    [
      "jest-html-reporter",
      {
        pageTitle: "Izumi Test Report",
        outputPath: "tests/test-report.html",
        includeFailureMsg: true,
      },
    ],
  ],
};
