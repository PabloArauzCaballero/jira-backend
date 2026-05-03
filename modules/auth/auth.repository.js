const userModel = require("../users/usuarios.model");
const mainLogger = require("../../logs/logger");

const logger = mainLogger.child({ module: "AuthRepository" });

async function getUserByEmail(email) {
  try {
    const user = await userModel.findOne({
      where: { email },
    });

    return user;
  } catch (error) {
    logger.error(
      {
        event: "auth_get_user_by_email_error",
        email,
        error: {
          message: error.message,
          stack: error.stack,
        },
      },
      "Error en AuthRepository.getUserByEmail"
    );

    throw error;
  }
}

module.exports = {
  getUserByEmail,
};