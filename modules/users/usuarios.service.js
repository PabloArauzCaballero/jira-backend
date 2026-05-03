const UsuariosRepository = require("./usuarios.repository");
const mainLogger = require("../../logs/logger");

const logger = mainLogger.child({ module: "UsuariosService" });

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

async function updateUser(id_usuario, payload) {
  try {
    const result = await UsuariosRepository.updateUser(id_usuario, payload);

    if (!result) {
      return {
        success: false,
        statusCode: 404,
        message: "Usuario no encontrado.",
      };
    }

    const safeUser = removeSensitiveFields(toPlainUser(result));

    return {
      success: true,
      statusCode: 200,
      message: "Usuario modificado exitosamente.",
      data: safeUser,
    };
  } catch (error) {
    logger.error(
      {
        event: "update_user_error",
        id_usuario,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error en UsuariosService.updateUser"
    );

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al actualizar usuario.",
    };
  }
}

async function deleteUser(id_usuario) {
  try {
    const result = await UsuariosRepository.deleteUser(id_usuario);

    if (!result) {
      return {
        success: false,
        statusCode: 404,
        message: "Usuario no encontrado.",
      };
    }

    const safeUser = removeSensitiveFields(toPlainUser(result));

    return {
      success: true,
      statusCode: 200,
      message: "Usuario eliminado exitosamente.",
      data: safeUser,
    };
  } catch (error) {
    logger.error(
      {
        event: "delete_user_error",
        id_usuario,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error en UsuariosService.deleteUser"
    );

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al eliminar usuario.",
    };
  }
}

module.exports = {
  updateUser,
  deleteUser,
};