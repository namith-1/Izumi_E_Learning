module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/api/jest.setup.js'],
  testMatch: ['**/tests/api/**/*.test.js'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
};
