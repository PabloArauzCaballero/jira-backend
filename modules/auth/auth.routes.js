const Router = require("express").Router();
const { generateAccessToken } = require("../../core/jwt/jwt");
const  AuthController = require("./auth.controller");

router.post("/login", AuthController.login);
router.post("/logout", AuthController.logut);

module.exports = router;
