const {sequelize} = require("../../core/db/config")
const userModel = require("../users/usuarios.model")(sequelize);
const mainLogger = require("../../logs/logger");

const logger = mainLogger.child({ module: "UsuariosRepository" });

async function updateUser(id_usuario, payload) {
  try {
    const user = await userModel.findByPk(id_usuario);

    if (!user) {
      return null;
    }

    await user.update(payload);

    return user;
  } catch (error) {
    logger.error(
      {
        event: "repository_update_user_error",
        id_usuario,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error en UsuariosRepository.updateUser"
    );

    throw error;
  }
}

async function deleteUser(id_usuario) {
  try {
    const user = await userModel.findByPk(id_usuario);

    if (!user) {
      return null;
    }

    await user.destroy();

    return user;
  } catch (error) {
    logger.error(
      {
        event: "repository_delete_user_error",
        id_usuario,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error en UsuariosRepository.deleteUser"
    );

    throw error;
  }
}

module.exports = {
  updateUser,
  deleteUser,
};