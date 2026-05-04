const ProyectosService = require("./proyectos.service");
const {
  proyectoCreationSchema,
  proyectoUpdateSchema,
  idProyectoSchema,
  idUsuarioParamSchema,
  miembroCreationSchema,
  miembroUpdateSchema,
} = require("./proyectos.schema");

function getUserId(req) {
  return req.user?.id_usuario;
}

function sendValidationError(res, message, error) {
  return res.status(400).json({
    success: false,
    message,
    errors: error.flatten(),
  });
}

async function createProyecto(req, res) {
  try {
    const validation = proyectoCreationSchema.safeParse(req.body);

    if (!validation.success) {
      return sendValidationError(res, "Datos inválidos.", validation.error);
    }

    const result = await ProyectosService.createProyecto(validation.data, getUserId(req));

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error interno al crear el proyecto.",
    });
  }
}

async function listProyectos(req, res) {
  try {
    const result = await ProyectosService.listProyectosByUsuario(getUserId(req));

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error interno al listar proyectos.",
    });
  }
}

async function getProyecto(req, res) {
  try {
    const validation = idProyectoSchema.safeParse(req.params);

    if (!validation.success) {
      return sendValidationError(res, "ID inválido.", validation.error);
    }

    const result = await ProyectosService.getProyectoById(
      validation.data.id_proyecto,
      getUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error interno al obtener el proyecto.",
    });
  }
}

async function updateProyecto(req, res) {
  try {
    const idValidation = idProyectoSchema.safeParse(req.params);

    if (!idValidation.success) {
      return sendValidationError(res, "ID inválido.", idValidation.error);
    }

    const bodyValidation = proyectoUpdateSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return sendValidationError(res, "Datos inválidos.", bodyValidation.error);
    }

    const result = await ProyectosService.updateProyecto(
      idValidation.data.id_proyecto,
      bodyValidation.data,
      getUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error interno al actualizar el proyecto.",
    });
  }
}

async function listMiembros(req, res) {
  try {
    const idValidation = idProyectoSchema.safeParse(req.params);

    if (!idValidation.success) {
      return sendValidationError(res, "ID inválido.", idValidation.error);
    }

    const result = await ProyectosService.listMiembros(
      idValidation.data.id_proyecto,
      getUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error interno al listar miembros.",
    });
  }
}

async function addMiembro(req, res) {
  try {
    const idValidation = idProyectoSchema.safeParse(req.params);

    if (!idValidation.success) {
      return sendValidationError(res, "ID inválido.", idValidation.error);
    }

    const bodyValidation = miembroCreationSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return sendValidationError(res, "Datos inválidos.", bodyValidation.error);
    }

    const result = await ProyectosService.addMiembro(
      idValidation.data.id_proyecto,
      bodyValidation.data,
      getUserId(req)
    );

    return res.status(result.statusCode || 201).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error interno al agregar miembro.",
    });
  }
}

async function updateMiembro(req, res) {
  try {
    const proyectoValidation = idProyectoSchema.safeParse(req.params);

    if (!proyectoValidation.success) {
      return sendValidationError(res, "ID de proyecto inválido.", proyectoValidation.error);
    }

    const usuarioValidation = idUsuarioParamSchema.safeParse(req.params);

    if (!usuarioValidation.success) {
      return sendValidationError(res, "ID de usuario inválido.", usuarioValidation.error);
    }

    const bodyValidation = miembroUpdateSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return sendValidationError(res, "Datos inválidos.", bodyValidation.error);
    }

    const result = await ProyectosService.updateMiembro(
      proyectoValidation.data.id_proyecto,
      usuarioValidation.data.id_usuario,
      bodyValidation.data,
      getUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error interno al actualizar miembro.",
    });
  }
}

async function removeMiembro(req, res) {
  try {
    const proyectoValidation = idProyectoSchema.safeParse(req.params);

    if (!proyectoValidation.success) {
      return sendValidationError(res, "ID de proyecto inválido.", proyectoValidation.error);
    }

    const usuarioValidation = idUsuarioParamSchema.safeParse(req.params);

    if (!usuarioValidation.success) {
      return sendValidationError(res, "ID de usuario inválido.", usuarioValidation.error);
    }

    const result = await ProyectosService.removeMiembro(
      proyectoValidation.data.id_proyecto,
      usuarioValidation.data.id_usuario,
      getUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error interno al remover miembro.",
    });
  }
}

async function deleteProyecto(req, res) {
  try {
    const validation = idProyectoSchema.safeParse(req.params);

    if (!validation.success) {
      return sendValidationError(res, "ID inválido.", validation.error);
    }

    const result = await ProyectosService.deleteProyecto(
      validation.data.id_proyecto,
      getUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error interno al eliminar el proyecto.",
    });
  }
}

module.exports = {
  createProyecto,
  listProyectos,
  getProyecto,
  updateProyecto,
  listMiembros,
  addMiembro,
  updateMiembro,
  removeMiembro,
  deleteProyecto,
};
