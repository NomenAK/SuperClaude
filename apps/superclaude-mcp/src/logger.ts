import { pino, Logger } from "pino";

// Flag to track if logger has been configured
let isConfigured = false;

// Create a default logger that will be reconfigured based on transport
let logger: Logger = createLogger("http"); // Default to http mode for non-main contexts

function createLogger(transport: string): Logger {
  const isStdioMode = transport === "stdio";
  const logLevel = isStdioMode ? "silent" : process.env.LOG_LEVEL || "info";

  return pino({
    level: logLevel,
    transport:
      !isStdioMode && process.env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          }
        : undefined,
  });
}

// Function to configure logger based on transport type
export function configureLogger(transport: string) {
  logger = createLogger(transport);
  isConfigured = true;
  return logger;
}

// Auto-configure based on command line args if not yet configured
// This handles cases where logger is imported before main.ts runs
if (!isConfigured && process.argv.includes("--transport")) {
  const transportIndex = process.argv.indexOf("--transport");
  if (transportIndex !== -1 && transportIndex + 1 < process.argv.length) {
    const transport = process.argv[transportIndex + 1];
    configureLogger(transport);
  }
} else if (!isConfigured && process.argv.some(arg => arg.includes("-t"))) {
  // Handle -t flag
  const tFlagIndex = process.argv.findIndex(arg => arg === "-t" || arg.startsWith("-t"));
  if (tFlagIndex !== -1) {
    if (process.argv[tFlagIndex] === "-t" && tFlagIndex + 1 < process.argv.length) {
      configureLogger(process.argv[tFlagIndex + 1]);
    } else if (process.argv[tFlagIndex].startsWith("-t")) {
      // Handle -tstdio format
      configureLogger(process.argv[tFlagIndex].substring(2));
    }
  }
}

export default logger;
