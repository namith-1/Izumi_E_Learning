const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// List all test files in the tests directory
exports.listTests = (req, res) => {
  const testsDir = path.join(__dirname, "../tests");
  const results = [];

  const walk = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith(".test.js")) {
        results.push({
          name: file,
          path: path.relative(path.join(__dirname, ".."), fullPath).replace(/\\/g, "/"),
          category: path.basename(dir)
        });
      }
    }
  };

  try {
    walk(testsDir);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Could not read tests directory" });
  }
};

// Run a specific test file
exports.runTest = (req, res) => {
  const { testPath } = req.body;
  if (!testPath) return res.status(400).json({ error: "testPath is required" });

  // Safety: Ensure testPath is within the tests directory and ends with .test.js
  if (!testPath.startsWith("tests/") || !testPath.endsWith(".test.js")) {
    return res.status(400).json({ error: "Invalid test path" });
  }

  // Use node directly to run jest to bypass execution policy issues on some systems
  const jestPath = path.join(__dirname, "../node_modules/jest/bin/jest.js");
  const command = `node "${jestPath}" "${testPath}" --no-cache --forceExit --detectOpenHandles`;

  exec(command, { cwd: path.join(__dirname, "..") }, (error, stdout, stderr) => {
    // Jest info/errors often go to stderr
    res.json({
      success: !error,
      stdout,
      stderr,
      command
    });
  });
};
