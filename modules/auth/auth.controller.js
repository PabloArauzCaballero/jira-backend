const AuthService = require("./auth.service");
const loginSchema = require("./auth.schema");
const { usuariosCreationSchema } = require("../users/usuarios.schema");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../core/jwt/jwt");
const mainLogger = require("../../logs/logger");
const logger = mainLogger.child({ module: "AuthController" });
const { getRequestMeta } = require("../../utils/loggerFunctions");

function getAccessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
  };
}

function getRefreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

function clearAuthCookies(res) {
  const baseOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };

  res.clearCookie("access_token", baseOptions);
  res.clearCookie("refresh_token", baseOptions);
}

async function login(req, res) {
  const startedAt = Date.now();

  try {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Datos de login inválidos.",
        errors: validationResult.error.flatten(),
      });
    }

    const result = await AuthService.login(validationResult.data);

    if (!result.success) {
      return res.status(result.statusCode || 401).json({
        success: false,
        message: result.message,
      });
    }

    const accessToken = generateAccessToken(result.data);
    const refreshToken = generateRefreshToken(result.data);

    res.cookie("access_token", accessToken, getAccessTokenCookieOptions());
    res.cookie("refresh_token", refreshToken, getRefreshTokenCookieOptions());

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
    clearAuthCookies(res);

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
      return res.status(400).json({
        success: false,
        message: "Datos de signup inválidos.",
        errors: validationResult.error.flatten(),
      });
    }

    const result = await AuthService.signup(validationResult.data);

    if (!result.success) {
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
      data: {
        user: result.data,
      },
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

async function me(req, res) {
  const startedAt = Date.now();

  try {
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
      return res.status(401).json({
        success: false,
        message: "No autorizado. Usuario no encontrado en el token.",
      });
    }

    const result = await AuthService.me(id_usuario);

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sesión obtenida correctamente.",
      data: {
        user: result.data,
      },
    });
  } catch (error) {
    logger.error(
      {
        event: "auth_me_controller_error",
        ...getRequestMeta(req),
        durationMs: Date.now() - startedAt,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error interno en AuthController.me"
    );

    return res.status(500).json({
      success: false,
      message: "Error interno al obtener la sesión.",
    });
  }
}

async function refreshSession(req, res) {
  const startedAt = Date.now();

  try {
    const refreshToken = req.cookies?.refresh_token;

    const result = await AuthService.refreshSession(refreshToken);

    if (!result.success) {
      clearAuthCookies(res);

      return res.status(result.statusCode || 401).json({
        success: false,
        message: result.message,
      });
    }

    const newAccessToken = generateAccessToken(result.data);
    const newRefreshToken = generateRefreshToken(result.data);

    res.cookie("access_token", newAccessToken, getAccessTokenCookieOptions());
    res.cookie("refresh_token", newRefreshToken, getRefreshTokenCookieOptions());

    logger.info(
      {
        event: "auth_refresh_session_success",
        ...getRequestMeta(req),
        userId: result.data.id_usuario,
        email: result.data.email,
        durationMs: Date.now() - startedAt,
      },
      "Sesión refrescada correctamente"
    );

    return res.status(200).json({
      success: true,
      message: "Sesión refrescada correctamente.",
      data: {
        user: result.data,
        accessToken: newAccessToken,
        tokenType: "Bearer",
      },
    });
  } catch (error) {
    clearAuthCookies(res);

    logger.error(
      {
        event: "auth_refresh_session_controller_error",
        ...getRequestMeta(req),
        durationMs: Date.now() - startedAt,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error interno en AuthController.refreshSession"
    );

    return res.status(500).json({
      success: false,
      message: "Error interno al refrescar la sesión.",
    });
  }
}

module.exports = {
  login,
  logout,
  signup,
  me,
  refreshSession,
};