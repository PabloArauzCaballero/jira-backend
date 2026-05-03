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
  if (!user) return null;

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

async function listUsers(payload) {
  try {
    const result = await UsuariosRepository.listUsers(payload);

    if (!Array.isArray(result)) {
      return {
        success: false,
        statusCode: 500,
        message: "Error interno: el repositorio no devolvió una lista válida.",
      };
    }

    const safeListUsers = result.map((user) =>
      removeSensitiveFields(toPlainUser(user))
    );

    return {
      success: true,
      statusCode: 200,
      message: "Usuarios enlistados exitosamente.",
      data: safeListUsers,
    };
  } catch (error) {
    logger.error(
      {
        event: "list_users_error",
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error en UsuariosService.listUsers"
    );

    return {
      success: false,
      statusCode: 500,
      message: "Error interno al listar usuarios.",
    };
  }
}

module.exports = {
  updateUser,
  deleteUser,
  listUsers,
};