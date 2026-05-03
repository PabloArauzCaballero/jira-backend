const { Sequelize } = require("sequelize");
require("dotenv").config();

const logger = require("../../logs/logger");

const {
    PGHOST,
    PGDATABASE,
    PGUSER,
    PGPASSWORD,
    PGPORT,
    PGSSLMODE,
    PGCHANNELBINDING,
    DB_LOGGING,
} = process.env;

const sequelize = new Sequelize(PGDATABASE, PGUSER, PGPASSWORD, {
    host: PGHOST,
    port: Number(PGPORT) || 5432,
    dialect: "postgres",

    logging:
        DB_LOGGING === "true"
            ? (message) => {
                  logger.debug(
                      {
                          event: "sequelize_query",
                          query: message,
                      },
                      "SQL Query"
                  );
              }
            : false,

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },

    dialectOptions: {
        ssl:
            PGSSLMODE === "require"
                ? {
                      require: true,
                  }
                : false,

        enableChannelBinding: PGCHANNELBINDING === "require",
    },
});

async function connectDatabase() {
    try {
        await sequelize.authenticate();

        logger.info(
            {
                event: "database_connection_success",
                database: PGDATABASE,
                host: PGHOST,
                port: PGPORT || 5432,
                ssl: PGSSLMODE,
                channelBinding: PGCHANNELBINDING,
            },
            "Conexión a Neon PostgreSQL establecida correctamente"
        );
    } catch (error) {
        logger.fatal(
            {
                event: "database_connection_error",
                database: PGDATABASE,
                host: PGHOST,
                port: PGPORT || 5432,
                ssl: PGSSLMODE,
                channelBinding: PGCHANNELBINDING,
                message: error.message,
                stack: error.stack,
            },
            "Error conectando a Neon PostgreSQL"
        );

        throw error;
    }
}

async function closeDatabase() {
    await sequelize.close();

    logger.info(
        {
            event: "database_connection_closed",
        },
        "Conexión a la base de datos cerrada"
    );
}

module.exports = {
    sequelize,
    connectDatabase,
    closeDatabase,
};