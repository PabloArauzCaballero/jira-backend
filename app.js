const express = require("express");
const path = require("path");
const pinoHttp = require("pino-http");
const cors = require("cors");
const helmet = require("helmet");
const comprenssion = require("compression");
const logger = require("./logs/logger")
const app = express();
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const modules = require("./modules");
const {requireAuth} = require("./middlewares/jwtMiddleware")

app.disable("x-powered-by");

// PINO ======================================================================
app.use(
    pinoHttp({
        logger,
        genReqId: (req) => req.headers["x-request-id"] || Date.now().toString(),
    })
);

// HELMET ==================================================
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { 
            policy: "cross-origin"
        }
    })
);

// COMPRENSSION ==================================================
app.use(
    comprenssion({
        level: 6, 
        threshold: 1024,
        filter: (req, res) =>{
            if(req.headers["x-no-comprenssion"]){
                return false;
            }

            return comprenssion.filter(req, res);
        }
    })
);

// CORS ======================================================================
const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if(!origin){
                return callback(null, true);
            }

            if(allowedOrigins.includes(origin)){
                return callback(null, true);
            }

            return callback(new Error("Invalid source call for backend"));
        },
        allowedHeaders: [ "content-type", "authorization", "X-Request-Id"],
        methods: ["POST", "GET", "PATCH", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        optionsSuccessStatus: 204,
    }),
);

// RATE LIMITER ================================================================
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        skip: (req) => req.path.startsWith("/api/auth"),
        message: {
            success: false,
            message: "Too many requests, please try again later.",
        }
    })
);

// COOKIES ===================================================================
app.use(cookieParser());

// BODY PARSERS ===============================================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// HEALTH CHECK ==============================================================
app.get("/health", (_req, res) => {
    return res.status(200).json({
        ok: true,
        message: "Servidor funcionando correctamente",
    });
});

// REQUEST HIT LOG ============================================================
app.use((req, _res, next) => {
    req.log.info(
        { 
            method: req.method, 
            url: req.originalUrl 
        }, 
        "REQUEST HIT"
    );

    next();
});


// MONTAR MODULOS ============================================================
for(const moduleObj of modules){
    const {router, basePath, isPublic} = moduleObj;

    if(!router || !basePath){
        logger.warn(
        {
            event: "module_mount_skipped",
            basePath,
            hasRouter: Boolean(router),
        },
        "Módulo omitido por configuración incompleta"
        );

        continue;
    }

    if(isPublic){
        app.use(`/api${basePath}`, router);

        logger.info(
            {
                event: "module_mounted",
                basePath,
                isPublic: true,
            },
            "Módulo público montado"
        );

        continue;
    }

    app.use(`/api${basePath}`, requireAuth, router);    

    logger.info(
        {
            event: "module_mounted",
            basePath,
            isPublic: false,
            middleware: "requireAuth",
        },
        "Módulo privado montado con JWT"
    );
}

module.exports = app;