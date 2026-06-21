// backend/tests/api/jest.setup.js
jest.setTimeout(30000);

// GLOBAL MOCK: ioredis (Redis)
// Stabilizes tests in environments without a live Redis server
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue("OK"),
  }));
});
