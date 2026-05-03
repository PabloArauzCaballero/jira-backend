const { usuariosUpdateSchema, idUsuarioSchema } = require("./usuarios.schema");
const UsuariosService = require("./usuarios.service");
const mainLogger = require("../../logs/logger");
const logger = mainLogger.child({ module: "UsuariosController" });
const { getRequestMeta } = require("../../utils/loggerFunctions");

async function updateUser(req, res) {
  const startedAt = Date.now();

  try {
    const validationId = idUsuarioSchema.safeParse(req.params);

    if (!validationId.success) {
      logger.warn(
        {
          event: "users_update_id_validation_failed",
          ...getRequestMeta(req),
          durationMs: Date.now() - startedAt,
          validationErrors: validationId.error.flatten(),
        },
        "Validación fallida en id de usuario"
      );

      return res.status(400).json({
        success: false,
        message: "El id del usuario es inválido.",
        errors: validationId.error.flatten(),
      });
    }

    const validationResult = usuariosUpdateSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn(
        {
          event: "users_update_body_validation_failed",
          ...getRequestMeta(req),
          durationMs: Date.now() - startedAt,
          validationErrors: validationResult.error.flatten(),
        },
        "Validación fallida en datos de actualización de usuario"
      );

      return res.status(400).json({
        success: false,
        message: "Datos de usuario inválidos.",
        errors: validationResult.error.flatten(),
      });
    }

    const { id_usuario } = validationId.data;

    logger.info(
      {
        event: "update_user_attempt",
        ...getRequestMeta(req),
        id_usuario,
      },
      "Intento de actualizar usuario"
    );

    const result = await UsuariosService.updateUser(
      id_usuario,
      validationResult.data
    );

    if (!result.success) {
      logger.warn(
        {
          event: "update_user_failed",
          ...getRequestMeta(req),
          id_usuario,
          statusCode: result.statusCode || 400,
          reason: result.message,
          durationMs: Date.now() - startedAt,
        },
        "Update user fallido"
      );

      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    logger.info(
      {
        event: "update_user_success",
        ...getRequestMeta(req),
        userId: result.data?.id_usuario,
        email: result.data?.email,
        durationMs: Date.now() - startedAt,
      },
      "Update user exitoso"
    );

    return res.status(200).json({
      success: true,
      message: "Usuario actualizado correctamente.",
      user: result.data,
    });
  } catch (error) {
    logger.error(
      {
        event: "user_update_controller_error",
        ...getRequestMeta(req),
        durationMs: Date.now() - startedAt,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error interno en UsuariosController.updateUser"
    );

    return res.status(500).json({
      success: false,
      message: "Error interno al actualizar usuario.",
    });
  }
}

async function deleteUser(req, res) {
  const startedAt = Date.now();

  try {
    const validationId = idUsuarioSchema.safeParse(req.params);

    if (!validationId.success) {
      logger.warn(
        {
          event: "users_delete_id_validation_failed",
          ...getRequestMeta(req),
          durationMs: Date.now() - startedAt,
          validationErrors: validationId.error.flatten(),
        },
        "Validación fallida en id de usuario"
      );

      return res.status(400).json({
        success: false,
        message: "El id del usuario es inválido.",
        errors: validationId.error.flatten(),
      });
    }

    const { id_usuario } = validationId.data;

    logger.info(
      {
        event: "delete_user_attempt",
        ...getRequestMeta(req),
        id_usuario,
      },
      "Intento de eliminar usuario"
    );

    const result = await UsuariosService.deleteUser(id_usuario);

    if (!result.success) {
      logger.warn(
        {
          event: "delete_user_failed",
          ...getRequestMeta(req),
          id_usuario,
          statusCode: result.statusCode || 400,
          reason: result.message,
          durationMs: Date.now() - startedAt,
        },
        "Delete user fallido"
      );

      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    logger.info(
      {
        event: "delete_user_success",
        ...getRequestMeta(req),
        userId: result.data?.id_usuario,
        durationMs: Date.now() - startedAt,
      },
      "Delete user exitoso"
    );

    return res.status(200).json({
      success: true,
      message: "Usuario eliminado correctamente.",
      user: result.data,
    });
  } catch (error) {
    logger.error(
      {
        event: "user_delete_controller_error",
        ...getRequestMeta(req),
        durationMs: Date.now() - startedAt,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "Error interno en UsuariosController.deleteUser"
    );

    return res.status(500).json({
      success: false,
      message: "Error interno al eliminar usuario.",
    });
  }
}

module.exports = {
  updateUser,
  deleteUser,
};