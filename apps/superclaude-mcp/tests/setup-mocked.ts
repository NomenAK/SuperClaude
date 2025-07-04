import { vi, afterEach } from "vitest";

// Mock logger to reduce noise in tests
vi.mock("../src/logger.js", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Clean up after each test - only clear mocks, don't touch real filesystem
afterEach(async () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});
