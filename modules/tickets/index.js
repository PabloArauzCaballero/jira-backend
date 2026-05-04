const ticketsRouter = require("./tickets.router");

module.exports = {
    router: ticketsRouter,
    basePath: "/tickets",
    isPublic: false,
};
