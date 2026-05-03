const http = require("http");
require("dotenv").config();

const app = require("./app");
const logger = require("./logs/logger");
const { connectDatabase, closeDatabase } = require("./core/db/config");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const server = http.createServer(app);

async function bootstrap() {
    try {
        await connectDatabase();

        server.listen(PORT, HOST, () => {
            logger.info(
                {
                    event: "server_started",
                    host: HOST,
                    port: PORT,
                    env: process.env.NODE_ENV || "development",
                },
                `Servidor escuchando en http://${HOST}:${PORT}`
            );
        });
    } catch (error) {
        logger.fatal(
            {
                event: "bootstrap_error",
                message: error.message,
                stack: error.stack,
            },
            "No se pudo iniciar la aplicación"
        );

        process.exit(1);
    }
}

server.on("error", (error) => {
    logger.fatal(
        {
            event: "server_error",
            code: error.code,
            message: error.message,
            stack: error.stack,
        },
        "Error en el servidor"
    );

    process.exit(1);
});

async function gracefulShutdown(signal) {
    logger.info(
        {
            event: "server_shutdown_started",
            signal,
        },
        "Cerrando servidor..."
    );

    server.close(async (error) => {
        if (error) {
            logger.fatal(
                {
                    event: "server_shutdown_error",
                    message: error.message,
                    stack: error.stack,
                },
                "Error cerrando el servidor"
            );

            process.exit(1);
        }

        try {
            await closeDatabase();

            logger.info(
                {
                    event: "server_shutdown_completed",
                },
                "Servidor cerrado correctamente"
            );

            process.exit(0);
        } catch (dbError) {
            logger.fatal(
                {
                    event: "database_shutdown_error",
                    message: dbError.message,
                    stack: dbError.stack,
                },
                "Error cerrando la conexión a la base de datos"
            );

            process.exit(1);
        }
    });
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

process.on("unhandledRejection", (reason) => {
    logger.fatal(
        {
            event: "unhandled_rejection",
            reason,
        },
        "Promesa rechazada no controlada"
    );

    process.exit(1);
});

process.on("uncaughtException", (error) => {
    logger.fatal(
        {
            event: "uncaught_exception",
            message: error.message,
            stack: error.stack,
        },
        "Excepción no controlada"
    );

    process.exit(1);
});

bootstrap();