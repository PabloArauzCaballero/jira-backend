const usuariosRouter = require("./usuarios.router");

module.exports = { 
    router: usuariosRouter,
    basePath: "/usuarios",
    isPublic: false,
};