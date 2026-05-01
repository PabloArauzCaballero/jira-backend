const pino = require("pino");

const logger = pino({
    name: "cpa-plataforma",
    level: process.env.LOG_LEVEL || "info",
    transport: {
        target: "pino/file",
        options:{
            destination: "./logs/app.log",
            mkdir: true,
        },
    },
});

module.exports = logger;