const ProyectosRepository = require("./proyectos.repository");
const UsuariosRepository = require("../users/usuarios.repository");

function getAuthenticatedUserId(reqUserId, fallbackUserId) {
  return reqUserId || fallbackUserId;
}

function isOwner(proyecto, userId) {
  return Number(proyecto.user_id_creacion) === Number(userId);
}

async function canAccessProject(proyecto, userId) {
  if (isOwner(proyecto, userId)) {
    return true;
  }

  return await ProyectosRepository.isMiembro(proyecto.id_proyecto, userId);
}

async function canManageProjectMembers(proyecto, userId) {
  if (isOwner(proyecto, userId)) {
    return true;
  }

  const membership = await ProyectosRepository.getMembership(proyecto.id_proyecto, userId);

  if (!membership) {
    return false;
  }

  return ["OWNER", "ADMIN"].includes(membership.cargo);
}

async function createProyecto(payload, userId) {
  const proyectoData = {
    nombre: payload.nombre,
    descripcion: payload.descripcion,
    user_id_creacion: userId,
  };

  const ownerData = {
    id_usuario: userId,
    cargo: "OWNER",
    user_id_creacion: userId,
  };

  const { proyecto } = await ProyectosRepository.createProyectoWithOwner(proyectoData, ownerData);

  return {
    success: true,
    data: proyecto,
  };
}

async function getProyectoById(id_proyecto, userId) {
  const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);

  if (!proyecto || proyecto.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Proyecto no encontrado.",
    };
  }

  const tieneAcceso = await canAccessProject(proyecto, userId);

  if (!tieneAcceso) {
    return {
      success: false,
      statusCode: 403,
      message: "No tienes acceso a este proyecto.",
    };
  }

  return {
    success: true,
    data: proyecto,
  };
}

async function listProyectosByUsuario(userId) {
  const proyectos = await ProyectosRepository.listProyectosByUsuario(userId);

  return {
    success: true,
    data: proyectos,
  };
}

async function updateProyecto(id_proyecto, payload, userId) {
  const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);

  if (!proyecto || proyecto.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Proyecto no encontrado.",
    };
  }

  const puedeGestionar = await canManageProjectMembers(proyecto, userId);

  if (!puedeGestionar) {
    return {
      success: false,
      statusCode: 403,
      message: "No tienes permiso para actualizar este proyecto.",
    };
  }

  const updated = await ProyectosRepository.updateProyecto(id_proyecto, {
    ...payload,
    user_id_modificacion: getAuthenticatedUserId(userId, payload.user_id_modificacion),
    actualizado_en: new Date(),
  });

  return {
    success: true,
    data: updated,
  };
}

async function listMiembros(id_proyecto, userId) {
  const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);

  if (!proyecto || proyecto.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Proyecto no encontrado.",
    };
  }

  const tieneAcceso = await canAccessProject(proyecto, userId);

  if (!tieneAcceso) {
    return {
      success: false,
      statusCode: 403,
      message: "No tienes acceso a este proyecto.",
    };
  }

  const miembros = await ProyectosRepository.listMiembros(id_proyecto);

  return {
    success: true,
    data: miembros,
  };
}

async function addMiembro(id_proyecto, miembroPayload, userId) {
  const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);

  if (!proyecto || proyecto.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Proyecto no encontrado.",
    };
  }

  const puedeGestionar = await canManageProjectMembers(proyecto, userId);

  if (!puedeGestionar) {
    return {
      success: false,
      statusCode: 403,
      message: "No tienes permiso para agregar miembros a este proyecto.",
    };
  }

  const usuario = await UsuariosRepository.getUserById(miembroPayload.id_usuario);

  if (!usuario) {
    return {
      success: false,
      statusCode: 404,
      message: "El usuario no existe.",
    };
  }

  const miembroExistente = await ProyectosRepository.getMiembro(
    id_proyecto,
    miembroPayload.id_usuario
  );

  if (miembroExistente && miembroExistente.estado_registro !== "ELIMINADO") {
    return {
      success: false,
      statusCode: 409,
      message: "El usuario ya es miembro de este proyecto.",
    };
  }

  const payload = {
    id_proyecto,
    id_usuario: miembroPayload.id_usuario,
    user_id_creacion: userId,
  };

  if (miembroPayload.cargo) {
    payload.cargo = miembroPayload.cargo;
  }

  const miembro = await ProyectosRepository.addMiembro(payload);

  return {
    success: true,
    message: "Miembro agregado correctamente.",
    data: miembro,
  };
}

async function updateMiembro(id_proyecto, id_usuario, payload, userId) {
  const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);

  if (!proyecto || proyecto.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Proyecto no encontrado.",
    };
  }

  const puedeGestionar = await canManageProjectMembers(proyecto, userId);

  if (!puedeGestionar) {
    return {
      success: false,
      statusCode: 403,
      message: "No tienes permiso para modificar miembros de este proyecto.",
    };
  }

  if (Number(proyecto.user_id_creacion) === Number(id_usuario) && payload.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 409,
      message: "No puedes eliminar al propietario creador del proyecto.",
    };
  }

  const updated = await ProyectosRepository.updateMiembro(id_proyecto, id_usuario, {
    ...payload,
    user_id_modificacion: userId,
    actualizado_en: new Date(),
  });

  if (!updated) {
    return {
      success: false,
      statusCode: 404,
      message: "Miembro no encontrado.",
    };
  }

  return {
    success: true,
    message: "Miembro actualizado correctamente.",
    data: updated,
  };
}

async function removeMiembro(id_proyecto, id_usuario, userId) {
  const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);

  if (!proyecto || proyecto.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Proyecto no encontrado.",
    };
  }

  const puedeGestionar = await canManageProjectMembers(proyecto, userId);

  if (!puedeGestionar) {
    return {
      success: false,
      statusCode: 403,
      message: "No tienes permiso para remover miembros de este proyecto.",
    };
  }

  if (Number(proyecto.user_id_creacion) === Number(id_usuario)) {
    return {
      success: false,
      statusCode: 409,
      message: "No puedes remover al propietario creador del proyecto.",
    };
  }

  const removed = await ProyectosRepository.removeMiembro(id_proyecto, id_usuario);

  if (!removed) {
    return {
      success: false,
      statusCode: 404,
      message: "Miembro no encontrado.",
    };
  }

  return {
    success: true,
    message: "Miembro removido correctamente.",
  };
}

async function deleteProyecto(id_proyecto, userId) {
  const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);

  if (!proyecto || proyecto.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Proyecto no encontrado.",
    };
  }

  if (!isOwner(proyecto, userId)) {
    return {
      success: false,
      statusCode: 403,
      message: "Solo el propietario puede eliminar el proyecto.",
    };
  }

  await ProyectosRepository.softDeleteProyecto(id_proyecto, userId);

  return {
    success: true,
    message: "Proyecto eliminado correctamente.",
  };
}

module.exports = {
  createProyecto,
  getProyectoById,
  listProyectosByUsuario,
  updateProyecto,
  listMiembros,
  addMiembro,
  updateMiembro,
  removeMiembro,
  deleteProyecto,
};
