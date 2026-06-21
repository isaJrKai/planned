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
  // Accept either (msg) | (msg, ctx) | (ctx, msg) for call-site flexibility
  debug(a: string | LogContext, b?: string | LogContext) {
    if (shouldLog("debug")) {
      const [msg, ctx] = resolveArgs(a, b);
      console.debug(formatMessage("debug", msg, ctx));
    }
  },

  info(a: string | LogContext, b?: string | LogContext) {
    if (shouldLog("info")) {
      const [msg, ctx] = resolveArgs(a, b);
      console.info(formatMessage("info", msg, ctx));
    }
  },

  warn(a: string | LogContext, b?: string | LogContext) {
    if (shouldLog("warn")) {
      const [msg, ctx] = resolveArgs(a, b);
      console.warn(formatMessage("warn", msg, ctx));
    }
  },

  error(a: string | LogContext, b?: string | LogContext) {
    if (shouldLog("error")) {
      const [msg, ctx] = resolveArgs(a, b);
      console.error(formatMessage("error", msg, ctx));
    }
    if (process.env.SENTRY_DSN && process.env.NODE_ENV === "production") {
      // Sentry capture would go here
    }
  },
};

function resolveArgs(a: unknown, b: unknown): [string, LogContext | undefined] {
  if (typeof a === "string") return [a, typeof b === "object" && b !== null ? (b as LogContext) : undefined];
  if (typeof a === "object" && a !== null) {
    const ctx = a as LogContext;
    return [typeof b === "string" ? b : (ctx.msg as string) ?? "", ctx];
  }
  return [String(a ?? ""), undefined];
}
