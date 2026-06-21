// ============================================================================
// STRUCTURED LOGGER
// ============================================================================
// Pino-style structured logging. In production, sends to Sentry/Logflare.
// In development, pretty-prints to console.

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? "info";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, msg: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  if (process.env.NODE_ENV === "production") {
    // JSON format for production log aggregation
    return JSON.stringify({
      ts: timestamp,
      level,
      msg,
      ...context,
    });
  }
  // Pretty print for dev
  const ctxStr = context && Object.keys(context).length > 0
    ? " " + JSON.stringify(context)
    : "";
  return `[${timestamp}] ${level.toUpperCase()}: ${msg}${ctxStr}`;
}

export const logger = {
  debug(msg: string, context?: LogContext) {
    if (shouldLog("debug")) console.debug(formatMessage("debug", msg, context));
  },

  info(msg: string, context?: LogContext) {
    if (shouldLog("info")) console.info(formatMessage("info", msg, context));
  },

  warn(msg: string, context?: LogContext) {
    if (shouldLog("warn")) console.warn(formatMessage("warn", msg, context));
  },

  error(msg: string, context?: LogContext) {
    if (shouldLog("error")) console.error(formatMessage("error", msg, context));
    // In production, also send to Sentry
    if (process.env.SENTRY_DSN && process.env.NODE_ENV === "production") {
      // Sentry capture would go here
    }
  },
};
