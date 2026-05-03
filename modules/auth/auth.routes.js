const router = require("express").Router();
const  AuthController = require("./auth.controller");

router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/signup", AuthController.signup);

module.exports = router;
