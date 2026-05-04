const AuthService = require("./auth.service");
const loginSchema = require("./auth.schema");
const {usuariosCreationSchema} =  require("../users/usuarios.schema");
const { generateAccessToken } = require("../../core/jwt/jwt");
const mainLogger = require("../../logs/logger");
const logger = mainLogger.child({ module: "AuthController" });
const {getRequestMeta} = require("../../utils/loggerFunctions")

function getAccessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
  };
}

async function login(req, res) {
  const startedAt = Date.now();

  try {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn(
        {
          event: "auth_login_validation_failed",
          ...getRequestMeta(req),
          durationMs: Date.now() - startedAt,
          validationErrors: validationResult.error.flatten(),
        },
        "Validación fallida en login"
      );

      return res.status(400).json({
        success: false,
        message: "Datos de login inválidos.",
        errors: validationResult.error.flatten(),
      });
    }

    const { email } = validationResult.data;

    logger.info(
      {
        event: "auth_login_attempt",
        ...getRequestMeta(req),
        email,
      },
      "Intento de login"
    );

    const result = await AuthService.login(validationResult.data);

    if (!result.success) {
      logger.warn(
        {
          event: "auth_login_failed",
          ...getRequestMeta(req),
          email,
          statusCode: result.statusCode || 401,
          reason: result.message,
          durationMs: Date.now() - startedAt,
        },
        "Login fallido"
      );

      return res.status(result.statusCode || 401).json({
        success: false,
        message: result.message,
      });
    }

    const accessToken = generateAccessToken(result.data);

    res.cookie("access_token", accessToken, getAccessTokenCookieOptions());

    logger.info(
      {
        event: "auth_login_success",
        ...getRequestMeta(req),
        userId: result.data.id_usuario,
        email: result.data.email,
        durationMs: Date.now() - startedAt,
      },
      "Login exitoso"
    );

    return res.status(200).json({
      success: true,
      message: "Login exitoso.",
      data: {
        user: result.data,
        accessToken,
        tokenType: "Bearer",
      },
    });
  } catch (error) {
    logger.error(
      {
        event: "auth_login_controller_error",
        ...getRequestMeta(req),
        durationMs: Date.now() - startedAt,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error interno en AuthController.login"
    );

    return res.status(500).json({
      success: false,
      message: "Error interno al iniciar sesión.",
    });
  }
}

async function logout(req, res) {
  const startedAt = Date.now();

  try {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    logger.info(
      {
        event: "auth_logout_success",
        ...getRequestMeta(req),
        userId: req.user?.id_usuario,
        email: req.user?.email,
        durationMs: Date.now() - startedAt,
      },
      "Logout exitoso"
    );

    return res.status(200).json({
      success: true,
      message: "Sesión cerrada correctamente.",
    });
  } catch (error) {
    logger.error(
      {
        event: "auth_logout_controller_error",
        ...getRequestMeta(req),
        durationMs: Date.now() - startedAt,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error interno en AuthController.logout"
    );

    return res.status(500).json({
      success: false,
      message: "Error interno al cerrar sesión.",
    });
  }
}

async function signup(req, res) {
  const startedAt = Date.now();

  try {
    const validationResult = usuariosCreationSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn(
        {
          event: "auth_signup_validation_failed",
          ...getRequestMeta(req),
          durationMs: Date.now() - startedAt,
          validationErrors: validationResult.error.flatten(),
        },
        "Validación fallida en signup"
      );

      return res.status(400).json({
        success: false,
        message: "Datos de signup inválidos.",
        errors: validationResult.error.flatten(),
      });
    }

    const { email } = validationResult.data;

    logger.info(
      {
        event: "auth_signup_attempt",
        ...getRequestMeta(req),
        email,
      },
      "Intento de signup"
    );

    const result = await AuthService.signup(validationResult.data);

    if (!result.success) {
      logger.warn(
        {
          event: "auth_signup_failed",
          ...getRequestMeta(req),
          email,
          statusCode: result.statusCode || 400,
          reason: result.message,
          durationMs: Date.now() - startedAt,
        },
        "Signup fallido"
      );

      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    logger.info(
      {
        event: "auth_signup_success",
        ...getRequestMeta(req),
        userId: result.data.id_usuario,
        email: result.data.email,
        durationMs: Date.now() - startedAt,
      },
      "Signup exitoso"
    );

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error(
      {
        event: "auth_signup_controller_error",
        ...getRequestMeta(req),
        durationMs: Date.now() - startedAt,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error interno en AuthController.signup"
    );

    return res.status(500).json({
      success: false,
      message: "Error interno al crear usuario.",
    });
  }
}

module.exports = {
  login,
  logout,
  signup,
};