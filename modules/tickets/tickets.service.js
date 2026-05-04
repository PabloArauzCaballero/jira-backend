const TicketsRepository = require("./tickets.repository");
const ProyectosRepository = require("../proyectos/proyectos.repository");

const TRANSICIONES_PERMITIDAS = {
  PENDIENTE: ["EN_PROGRESO", "CANCELADO"],
  EN_PROGRESO: ["PENDIENTE", "EN_REVISION", "CANCELADO"],
  EN_REVISION: ["EN_PROGRESO", "FINALIZADO", "CANCELADO"],
  FINALIZADO: ["EN_REVISION"],
  CANCELADO: ["PENDIENTE"],
};

function sameId(left, right) {
  return String(left) === String(right);
}

async function getProyectoOrFail(id_proyecto) {
  const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);

  if (!proyecto || proyecto.estado_registro === "ELIMINADO") {
    return {
      ok: false,
      statusCode: 404,
      message: "Proyecto no encontrado.",
    };
  }

  return { ok: true, proyecto };
}

async function canAccessProyecto(id_proyecto, userId) {
  const proyectoResult = await getProyectoOrFail(id_proyecto);

  if (!proyectoResult.ok) return proyectoResult;

  const proyecto = proyectoResult.proyecto;
  const esMiembro = await ProyectosRepository.isMiembro(id_proyecto, userId);
  const esCreador = proyecto.user_id_creacion && sameId(proyecto.user_id_creacion, userId);

  if (!esMiembro && !esCreador) {
    return {
      ok: false,
      statusCode: 403,
      message: "No tenés acceso a este proyecto.",
    };
  }

  return { ok: true, proyecto };
}

async function validateAssignedUser(id_proyecto, id_usuario, proyecto) {
  const usuarioEsMiembro = await ProyectosRepository.isMiembro(id_proyecto, id_usuario);
  const usuarioEsCreador = proyecto.user_id_creacion && sameId(proyecto.user_id_creacion, id_usuario);

  if (!usuarioEsMiembro && !usuarioEsCreador) {
    return {
      ok: false,
      statusCode: 400,
      message: "El usuario asignado no pertenece al proyecto.",
    };
  }

  return { ok: true };
}

async function getTicketAccess(id_ticket, userId) {
  const ticket = await TicketsRepository.getTicketById(id_ticket);

  if (!ticket || ticket.estado_registro === "ELIMINADO") {
    return {
      ok: false,
      statusCode: 404,
      message: "Ticket no encontrado.",
    };
  }

  const asignaciones = await TicketsRepository.listAssignmentsByTicket(id_ticket, {
    activeOnly: true,
  });

  if (asignaciones.length === 0) {
    const esCreadorTicket = ticket.user_id_creacion && sameId(ticket.user_id_creacion, userId);

    if (!esCreadorTicket) {
      return {
        ok: false,
        statusCode: 403,
        message: "No tenés acceso a este ticket.",
      };
    }

    return { ok: true, ticket, asignaciones };
  }

  for (const asignacion of asignaciones) {
    const acceso = await canAccessProyecto(asignacion.id_proyecto, userId);
    if (acceso.ok) {
      return { ok: true, ticket, asignaciones, proyecto: acceso.proyecto };
    }
  }

  return {
    ok: false,
    statusCode: 403,
    message: "No tenés acceso a este ticket.",
  };
}

async function createTicket(payload, userId) {
  const {
    id_proyecto,
    id_usuario,
    nombre,
    descripcion,
    prioridad,
    tasks = [],
    acceptanceCriteria = [],
  } = payload;

  const acceso = await canAccessProyecto(id_proyecto, userId);
  if (!acceso.ok) return acceso;

  const usuarioValido = await validateAssignedUser(id_proyecto, id_usuario, acceso.proyecto);
  if (!usuarioValido.ok) return usuarioValido;

  const result = await TicketsRepository.createTicketWithAssignment({
    ticketData: {
      nombre,
      descripcion,
      prioridad,
      user_id_creacion: userId,
    },
    assignmentData: {
      id_proyecto,
      id_usuario,
      user_id_creacion: userId,
    },
    tasks,
    acceptanceCriteria,
  });

  return {
    success: true,
    statusCode: 201,
    data: result,
  };
}

async function getTicketById(id_ticket, userId) {
  const acceso = await getTicketAccess(id_ticket, userId);
  if (!acceso.ok) return acceso;

  const [actualizaciones, tasks, acceptanceCriteria] = await Promise.all([
    TicketsRepository.listTicketUpdatesByTicket(id_ticket, {
      activeOnly: true,
    }),
    TicketsRepository.listTicketActionsByTicket(id_ticket),
    TicketsRepository.listTicketAcceptanceCriteriaByTicket(id_ticket),
  ]);

  return {
    success: true,
    data: {
      ...acceso.ticket,
      asignaciones: acceso.asignaciones,
      actualizaciones,
      tasks,
      acceptanceCriteria,
    },
  };
}

async function listTicketsByProyecto(id_proyecto, userId) {
  const acceso = await canAccessProyecto(id_proyecto, userId);
  if (!acceso.ok) return acceso;

  const tickets = await TicketsRepository.listTicketsByProyecto(id_proyecto);

  return {
    success: true,
    data: tickets,
  };
}

async function updateTicket(id_ticket, payload, userId) {
  const acceso = await getTicketAccess(id_ticket, userId);
  if (!acceso.ok) return acceso;

  const { tasks, acceptanceCriteria, ...ticketPayload } = payload;

  const updated = await TicketsRepository.updateTicket(id_ticket, {
    ...ticketPayload,
    user_id_modificacion: userId,
    actualizado_en: new Date(),
  });

  const response = {
    ...updated,
  };

  if (tasks !== undefined) {
    response.tasks = await TicketsRepository.replaceTicketActions(id_ticket, tasks);
  }

  if (acceptanceCriteria !== undefined) {
    response.acceptanceCriteria = await TicketsRepository.replaceTicketAcceptanceCriteria(
      id_ticket,
      acceptanceCriteria
    );
  }

  return {
    success: true,
    data: response,
  };
}

async function changeTicketStatus(id_ticket, status, userId) {
  const acceso = await getTicketAccess(id_ticket, userId);
  if (!acceso.ok) return acceso;

  const ticket = acceso.ticket;
  const statusActual = ticket.status || "PENDIENTE";
  const estadosPermitidos = TRANSICIONES_PERMITIDAS[statusActual] || [];

  if (!estadosPermitidos.includes(status)) {
    return {
      success: false,
      statusCode: 400,
      message: `Transición de estado no permitida: ${statusActual} → ${status}.`,
    };
  }

  if (status === "EN_PROGRESO" && acceso.asignaciones.length === 0) {
    return {
      success: false,
      statusCode: 400,
      message: "No se puede iniciar un ticket sin una asignación activa.",
    };
  }

  const updated = await TicketsRepository.updateTicket(id_ticket, {
    status,
    user_id_modificacion: userId,
    actualizado_en: new Date(),
  });

  return {
    success: true,
    data: updated,
  };
}

async function changeTicketEstadoRegistro(id_ticket, estado_registro, userId) {
  const acceso = await getTicketAccess(id_ticket, userId);
  if (!acceso.ok) return acceso;

  const updated = await TicketsRepository.updateTicket(id_ticket, {
    estado_registro,
    user_id_modificacion: userId,
    actualizado_en: new Date(),
  });

  return {
    success: true,
    data: updated,
  };
}

async function deleteTicket(id_ticket, userId) {
  const acceso = await getTicketAccess(id_ticket, userId);
  if (!acceso.ok) return acceso;

  await TicketsRepository.softDeleteTicket(id_ticket, userId);

  return {
    success: true,
    message: "Ticket eliminado correctamente.",
  };
}

async function createAssignmentToTicket(id_ticket, payload, userId) {
  const ticketAccess = await getTicketAccess(id_ticket, userId);
  if (!ticketAccess.ok) return ticketAccess;

  const { id_proyecto, id_usuario } = payload;
  const accesoProyecto = await canAccessProyecto(id_proyecto, userId);
  if (!accesoProyecto.ok) return accesoProyecto;

  const usuarioValido = await validateAssignedUser(id_proyecto, id_usuario, accesoProyecto.proyecto);
  if (!usuarioValido.ok) return usuarioValido;

  const asignaciones = await TicketsRepository.listAssignmentsByTicket(id_ticket, {
    activeOnly: true,
  });

  const yaExiste = asignaciones.some(
    (asignacion) =>
      sameId(asignacion.id_proyecto, id_proyecto) && sameId(asignacion.id_usuario, id_usuario)
  );

  if (yaExiste) {
    return {
      success: false,
      statusCode: 409,
      message: "Esta asignación ya existe para el ticket.",
    };
  }

  const asignacion = await TicketsRepository.createAssignment({
    id_ticket,
    id_proyecto,
    id_usuario,
    user_id_creacion: userId,
  });

  return {
    success: true,
    statusCode: 201,
    data: asignacion,
  };
}

async function listAssignmentsByTicket(id_ticket, userId) {
  const acceso = await getTicketAccess(id_ticket, userId);
  if (!acceso.ok) return acceso;

  return {
    success: true,
    data: acceso.asignaciones,
  };
}

async function listAssignmentsByProyecto(id_proyecto, userId) {
  const acceso = await canAccessProyecto(id_proyecto, userId);
  if (!acceso.ok) return acceso;

  const asignaciones = await TicketsRepository.listAssignmentsByProyecto(id_proyecto, {
    activeOnly: true,
  });

  return {
    success: true,
    data: asignaciones,
  };
}

async function updateAssignment(id_asignacion, payload, userId) {
  const asignacion = await TicketsRepository.getAssignmentById(id_asignacion);

  if (!asignacion || asignacion.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Asignación no encontrada.",
    };
  }

  const accesoActual = await canAccessProyecto(asignacion.id_proyecto, userId);
  if (!accesoActual.ok) return accesoActual;

  const nextProjectId = payload.id_proyecto || asignacion.id_proyecto;
  const nextUserId = payload.id_usuario || asignacion.id_usuario;

  const accesoNuevoProyecto = await canAccessProyecto(nextProjectId, userId);
  if (!accesoNuevoProyecto.ok) return accesoNuevoProyecto;

  const usuarioValido = await validateAssignedUser(nextProjectId, nextUserId, accesoNuevoProyecto.proyecto);
  if (!usuarioValido.ok) return usuarioValido;

  const updated = await TicketsRepository.updateAssignment(id_asignacion, {
    ...payload,
    user_id_modificacion: userId,
    actualizado_en: new Date(),
  });

  return {
    success: true,
    data: updated,
  };
}

async function deleteAssignment(id_asignacion, userId) {
  const asignacion = await TicketsRepository.getAssignmentById(id_asignacion);

  if (!asignacion || asignacion.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Asignación no encontrada.",
    };
  }

  const acceso = await canAccessProyecto(asignacion.id_proyecto, userId);
  if (!acceso.ok) return acceso;

  await TicketsRepository.softDeleteAssignment(id_asignacion, userId);

  return {
    success: true,
    message: "Asignación eliminada correctamente.",
  };
}

async function createTicketUpdate(id_asignacion, payload, userId) {
  const asignacion = await TicketsRepository.getAssignmentById(id_asignacion);

  if (!asignacion || asignacion.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Asignación no encontrada.",
    };
  }

  const acceso = await canAccessProyecto(asignacion.id_proyecto, userId);
  if (!acceso.ok) return acceso;

  const actualizacion = await TicketsRepository.createTicketUpdate({
    id_asignacion,
    actualizacion: payload.actualizacion,
    user_id_creacion: userId,
  });

  return {
    success: true,
    statusCode: 201,
    data: actualizacion,
  };
}

async function listTicketUpdatesByAssignment(id_asignacion, userId) {
  const asignacion = await TicketsRepository.getAssignmentById(id_asignacion);

  if (!asignacion || asignacion.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Asignación no encontrada.",
    };
  }

  const acceso = await canAccessProyecto(asignacion.id_proyecto, userId);
  if (!acceso.ok) return acceso;

  const actualizaciones = await TicketsRepository.listTicketUpdatesByAssignment(id_asignacion, {
    activeOnly: true,
  });

  return {
    success: true,
    data: actualizaciones,
  };
}

async function listTicketUpdatesByTicket(id_ticket, userId) {
  const acceso = await getTicketAccess(id_ticket, userId);
  if (!acceso.ok) return acceso;

  const actualizaciones = await TicketsRepository.listTicketUpdatesByTicket(id_ticket, {
    activeOnly: true,
  });

  return {
    success: true,
    data: actualizaciones,
  };
}

async function updateTicketUpdate(id_actualizacion, payload, userId) {
  const actualizacion = await TicketsRepository.getTicketUpdateById(id_actualizacion);

  if (!actualizacion || actualizacion.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Actualización no encontrada.",
    };
  }

  const asignacion = await TicketsRepository.getAssignmentById(actualizacion.id_asignacion);
  if (!asignacion || asignacion.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Asignación no encontrada.",
    };
  }

  const acceso = await canAccessProyecto(asignacion.id_proyecto, userId);
  if (!acceso.ok) return acceso;

  const updated = await TicketsRepository.updateTicketUpdate(id_actualizacion, {
    ...payload,
    user_id_modificacion: userId,
    actualizado_en: new Date(),
  });

  return {
    success: true,
    data: updated,
  };
}

async function deleteTicketUpdate(id_actualizacion, userId) {
  const actualizacion = await TicketsRepository.getTicketUpdateById(id_actualizacion);

  if (!actualizacion || actualizacion.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Actualización no encontrada.",
    };
  }

  const asignacion = await TicketsRepository.getAssignmentById(actualizacion.id_asignacion);
  if (!asignacion || asignacion.estado_registro === "ELIMINADO") {
    return {
      success: false,
      statusCode: 404,
      message: "Asignación no encontrada.",
    };
  }

  const acceso = await canAccessProyecto(asignacion.id_proyecto, userId);
  if (!acceso.ok) return acceso;

  await TicketsRepository.softDeleteTicketUpdate(id_actualizacion, userId);

  return {
    success: true,
    message: "Actualización eliminada correctamente.",
  };
}



async function listTicketTasks(id_ticket, userId) {
  const acceso = await getTicketAccess(id_ticket, userId);
  if (!acceso.ok) return acceso;

  const tasks = await TicketsRepository.listTicketActionsByTicket(id_ticket);

  return {
    success: true,
    data: tasks,
  };
}

async function replaceTicketTasks(id_ticket, tasks, userId) {
  const acceso = await getTicketAccess(id_ticket, userId);
  if (!acceso.ok) return acceso;

  const updatedTasks = await TicketsRepository.replaceTicketActions(id_ticket, tasks);

  await TicketsRepository.updateTicket(id_ticket, {
    user_id_modificacion: userId,
    actualizado_en: new Date(),
  });

  return {
    success: true,
    data: updatedTasks,
  };
}

async function listTicketAcceptanceCriteria(id_ticket, userId) {
  const acceso = await getTicketAccess(id_ticket, userId);
  if (!acceso.ok) return acceso;

  const acceptanceCriteria = await TicketsRepository.listTicketAcceptanceCriteriaByTicket(id_ticket);

  return {
    success: true,
    data: acceptanceCriteria,
  };
}

async function replaceTicketAcceptanceCriteria(id_ticket, acceptanceCriteria, userId) {
  const acceso = await getTicketAccess(id_ticket, userId);
  if (!acceso.ok) return acceso;

  const updatedAcceptanceCriteria = await TicketsRepository.replaceTicketAcceptanceCriteria(
    id_ticket,
    acceptanceCriteria
  );

  await TicketsRepository.updateTicket(id_ticket, {
    user_id_modificacion: userId,
    actualizado_en: new Date(),
  });

  return {
    success: true,
    data: updatedAcceptanceCriteria,
  };
}

module.exports = {
  createTicket,
  getTicketById,
  listTicketsByProyecto,
  updateTicket,
  changeTicketStatus,
  changeTicketEstadoRegistro,
  deleteTicket,

  createAssignmentToTicket,
  listAssignmentsByTicket,
  listAssignmentsByProyecto,
  updateAssignment,
  deleteAssignment,

  createTicketUpdate,
  listTicketUpdatesByAssignment,
  listTicketUpdatesByTicket,
  updateTicketUpdate,
  deleteTicketUpdate,

  listTicketTasks,
  replaceTicketTasks,
  listTicketAcceptanceCriteria,
  replaceTicketAcceptanceCriteria,
};
