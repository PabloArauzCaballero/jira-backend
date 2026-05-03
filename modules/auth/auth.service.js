const crypto = require("crypto");
const AuthRepository = require("./auth.repository");
const sha2 = require("../../core/sha2/sha2");
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
      logger.warn(
        {
          event: "auth_signup_user_already_exists",
          email: payload.email,
        },
        "Intento de signup con usuario existente"
      );

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
      logger.error(
        {
          event: "auth_signup_empty_repository_result",
          email: payload.email,
        },
        "AuthRepository.createUser no devolvió usuario"
      );

      return {
        success: false,
        statusCode: 500,
        message: "Error interno al crear usuario.",
      };
    }

    const newUser = toPlainUser(newUserInstance);
    const safeUser = removeSensitiveFields(newUser);

    logger.info(
      {
        event: "auth_signup_success",
        userId: safeUser.id_usuario,
        email: safeUser.email,
      },
      "Usuario creado correctamente"
    );

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

module.exports = {
  login,
  signup,
};