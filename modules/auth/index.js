const authRouter = require("./auth.routes");

module.exports = { 
    router: authRouter,
    basePath: "/auth",
    isPublic: true,
};