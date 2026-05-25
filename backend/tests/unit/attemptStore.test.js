const attemptStore = require("../../services/attemptStore");
const AuthAttempt = require("../../models/AuthAttempt");
const authLogger = require("../../middleware/authLogger");

// Mock the models and middleware
jest.mock("../../models/AuthAttempt");
jest.mock("../../middleware/authLogger", () => ({
  write: jest.fn(),
}));

describe("attemptStore Service", () => {
  const testKey = "test-user@example.com";
  const testIp = "127.0.0.1";

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the memory map if possible, but attemptStore uses a private map.
    // However, for unit testing we can clear it by calling clearAttempts.
    return attemptStore.clearAttempts(testKey);
  });

  test("should start with 0 attempts and not blocked", async () => {
    const status = await attemptStore.isBlocked(testKey);
    expect(status.blocked).toBe(false);
  });

  test("should record a failed attempt", async () => {
    const rec = await attemptStore.recordFailedAttempt(testKey, testIp);
    expect(rec.count).toBe(1);
    expect(authLogger.write).toHaveBeenCalledWith(expect.stringContaining("count=1"));
    expect(AuthAttempt.create).toHaveBeenCalled();
  });

  test("should block after MAX_ATTEMPTS", async () => {
    // MAX_ATTEMPTS is 5 by default
    for (let i = 0; i < attemptStore.MAX_ATTEMPTS; i++) {
        await attemptStore.recordFailedAttempt(testKey, testIp);
    }

    const status = await attemptStore.isBlocked(testKey);
    expect(status.blocked).toBe(true);
    expect(status.rec.count).toBe(attemptStore.MAX_ATTEMPTS);
    expect(status.rec.blockedUntil).not.toBeNull();
  });

  test("should clear attempts", async () => {
    await attemptStore.recordFailedAttempt(testKey, testIp);
    await attemptStore.clearAttempts(testKey);
    
    const status = await attemptStore.isBlocked(testKey);
    expect(status.blocked).toBe(false);
    expect(authLogger.write).toHaveBeenCalledWith(expect.stringContaining("cleared"));
  });
});
