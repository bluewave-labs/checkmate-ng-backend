import winston from "winston";
const { combine, timestamp, errors, colorize, printf, json } = winston.format;

const buildLogMsg = (info: winston.Logform.TransformableInfo) => {
  if (!info) return "Logging error: no info provided";
  const timestamp = info.timestamp;
  const level = info.level;
  const message = info.message;
  const service = info.service;
  return `[${timestamp}]${
    service ? ` [${service}]` : ""
  } ${level}: ${message} ${info.stack}`;
};

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",

  transports: [
    new winston.transports.Console({
      format: combine(
        timestamp(),
        colorize({ all: true }),
        errors({ stack: true }),
        printf((info) => {
          return buildLogMsg(info);
        })
      ),
    }),
    new winston.transports.File({
      filename: "logs/server.log",
      level: "warn",
      format: combine(timestamp(), json()),
    }),
  ],
});

export const getChildLogger = (serviceName: string): winston.Logger => {
  return logger.child({ service: serviceName });
};

export default logger;
