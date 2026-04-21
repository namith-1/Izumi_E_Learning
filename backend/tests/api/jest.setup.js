// backend/tests/api/jest.setup.js
jest.setTimeout(30000);

// GLOBAL MOCK: Meilisearch
// This bypasses the ESM "export" SyntaxError by preventing Jest from parsing the real package.
jest.mock("meilisearch", () => {
  return {
    Meilisearch: jest.fn().mockImplementation(() => ({
      index: jest.fn().mockReturnValue({
        addDocuments: jest.fn().mockResolvedValue({ taskUid: 1 }),
        search: jest.fn().mockResolvedValue({ hits: [], totalHits: 0 }),
        updateSettings: jest.fn().mockResolvedValue({ taskUid: 2 }),
      }),
    })),
  };
});
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
