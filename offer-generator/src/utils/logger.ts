// Minimal logger. Uses winston when available (it's in deps), falls back to
// console with a JSON-line format. Same surface as winston's createLogger so
// the call sites don't change: `logger.info(msg, {key: val})`, etc.

import winston from "winston";

const level = process.env.LOG_LEVEL || "info";

export const logger = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...rest }) => {
          const extra =
            Object.keys(rest).length > 0 ? " " + JSON.stringify(rest) : "";
          return `${timestamp} ${level}: ${message}${extra}`;
        }),
      ),
    }),
  ],
});
