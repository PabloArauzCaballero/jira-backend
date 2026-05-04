const router = require("express").Router();
const AuthController = require("./auth.controller");
const { requireAuth } = require("../../middlewares/jwtMiddleware");

router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/signup", AuthController.signup);

router.get("/me", requireAuth, AuthController.me);
router.post("/refreshSession", AuthController.refreshSession);
router.post("/refresh-session", AuthController.refreshSession);

module.exports = router;