const crypto = require("crypto");
const AuthRepository = require("./auth.repository");
const sha2 = require("../../core/sha2/sha2");
const { verifyRefreshToken } = require("../../core/jwt/jwt");
const mainLogger = require("../../logs/logger");

const logger = mainLogger.child({ module: "AuthService" });

function toPlainUser(user) {
  if (!user) return null;

  if (typeof user.get === "function") {
    return user.get({ plain: true });
  }

  return { ...user };
}

function removeSensitiveFields(user) {
  if (!user) return null;

  const safeUser = { ...user };

  delete safeUser.password;
  delete safeUser.password_hash;
  delete safeUser.passwordHash;

  return safeUser;
}

function safeCompare(valueA, valueB) {
  const a = Buffer.from(String(valueA || ""));
  const b = Buffer.from(String(valueB || ""));

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

async function login({ email, password }) {
  try {
    const userInstance = await AuthRepository.getUserByEmail(email);

    if (!userInstance) {
      return {
        success: false,
        statusCode: 401,
        message: "Credenciales inválidas.",
      };
    }

    const user = toPlainUser(userInstance);

    const encodedPassword = sha2.sha2Encode(password);
    const storedPassword = user.password_hash || user.password;

    if (!storedPassword || !safeCompare(encodedPassword, storedPassword)) {
      return {
        success: false,
        statusCode: 401,
        message: "Credenciales inválidas.",
      };
    }

    const safeUser = removeSensitiveFields(user);

    return {
      success: true,
      statusCode: 200,
      message: "Login exitoso.",
      data: safeUser,
    };
  } catch (error) {
    logger.error(
      {
        event: "auth_login_error",
        email,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error en AuthService.login"
    );

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al iniciar sesión.",
    };
  }
}

async function signup(payload) {
  try {
    const userInstance = await AuthRepository.getUserByEmail(payload.email);

    if (userInstance) {
      return {
        success: false,
        statusCode: 409,
        message: "El usuario ya existe.",
      };
    }

    const encodedPassword = sha2.sha2Encode(payload.password_hash);

    const normPayload = {
      ...payload,
      password_hash: encodedPassword,
    };

    const newUserInstance = await AuthRepository.createUser(normPayload);

    if (!newUserInstance) {
      return {
        success: false,
        statusCode: 500,
        message: "Error interno al crear usuario.",
      };
    }

    const safeUser = removeSensitiveFields(toPlainUser(newUserInstance));

    return {
      success: true,
      statusCode: 201,
      message: "Usuario creado con éxito.",
      data: safeUser,
    };
  } catch (error) {
    logger.error(
      {
        event: "auth_signup_error",
        email: payload?.email,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error en AuthService.signup"
    );

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al crear usuario.",
    };
  }
}

async function me(id_usuario) {
  try {
    const userInstance = await AuthRepository.getUserById(id_usuario);

    if (!userInstance) {
      return {
        success: false,
        statusCode: 404,
        message: "Usuario no encontrado.",
      };
    }

    const safeUser = removeSensitiveFields(toPlainUser(userInstance));

    return {
      success: true,
      statusCode: 200,
      message: "Usuario autenticado obtenido correctamente.",
      data: safeUser,
    };
  } catch (error) {
    logger.error(
      {
        event: "auth_me_error",
        id_usuario,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error en AuthService.me"
    );

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al obtener la sesión.",
    };
  }
}

async function refreshSession(refreshToken) {
  try {
    if (!refreshToken) {
      return {
        success: false,
        statusCode: 401,
        message: "Refresh token no proporcionado.",
      };
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (decoded.tokenUse !== "refresh") {
      return {
        success: false,
        statusCode: 401,
        message: "Token de refresh inválido.",
      };
    }

    const id_usuario = decoded.sub || decoded.id_usuario;

    const userInstance = await AuthRepository.getUserById(id_usuario);

    if (!userInstance) {
      return {
        success: false,
        statusCode: 404,
        message: "Usuario no encontrado.",
      };
    }

    const safeUser = removeSensitiveFields(toPlainUser(userInstance));

    return {
      success: true,
      statusCode: 200,
      message: "Sesión refrescada correctamente.",
      data: safeUser,
    };
  } catch (error) {
    logger.warn(
      {
        event: "auth_refresh_session_error",
        error: {
          name: error.name,
          message: error.message,
        },
      },
      "Refresh session fallido"
    );

    return {
      success: false,
      statusCode: 401,
      message: "Refresh token inválido o expirado.",
    };
  }
}

module.exports = {
  login,
  signup,
  me,
  refreshSession,
};