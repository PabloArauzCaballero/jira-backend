const pino = require("pino");

const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
    name: "cpa-plataforma",
    level: process.env.LOG_LEVEL || "info",
    ...(isProduction
        ? {}
        : {
              transport: {
                  target: "pino/file",
                  options: {
                      destination: "./logs/app.log",
                      mkdir: true,
                  },
              },
          }),
});

module.exports = logger;