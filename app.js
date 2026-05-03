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
const { success } = require("zod");


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
const allowedOrigins = [
    "http://localhost:5173/",
    "https://jira-frontend.a2020115468.workers.dev/", 
];

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
        message: {
            success: false,
            message: "Too many requests, please try again later.",
        }
    })
);

app.use(express.json({limit: "10mb"}));
app.use(express.urlencoded({ extended: true }));


app.get("/health", (_req, res) => {
    return res.status(200).json({
        ok: true,
        message: "Servidor funcionando correctamente",
    });
});

app.use((req, _res, next) => {
    req.log.info({ method: req.method, url: req.originalUrl }, "REQUEST HIT");
    next();
});

module.exports = app;