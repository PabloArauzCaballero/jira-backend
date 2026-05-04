const { sequelize } = require("../../core/db/config");
const userModel = require("../users/usuarios.model")(sequelize);
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
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error en AuthRepository.getUserByEmail"
    );

    throw error;
  }
}

async function getUserById(id_usuario) {
  try {
    const user = await userModel.findByPk(id_usuario);

    return user;
  } catch (error) {
    logger.error(
      {
        event: "auth_get_user_by_id_error",
        id_usuario,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error en AuthRepository.getUserById"
    );

    throw error;
  }
}

async function createUser(payload) {
  try {
    const user = await userModel.create(payload);

    return user;
  } catch (error) {
    logger.error(
      {
        event: "auth_create_user_error",
        email: payload?.email,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error en AuthRepository.createUser"
    );

    throw error;
  }
}

module.exports = {
  getUserByEmail,
  getUserById,
  createUser,
};