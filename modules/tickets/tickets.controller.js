const TicketsService = require("./tickets.service");
const {
  ticketCreationSchema,
  ticketUpdateSchema,
  ticketStatusSchema,
  ticketEstadoRegistroSchema,
  idTicketSchema,
  ticketUpdateIdSchema,
  listTicketsByProyectoQuerySchema,
  idProyectoSchema,
  proyectoAsignacionCreationSchema,
  proyectoAsignacionUpdateSchema,
  idProyectoAsignacionSchema,
  ticketUpdateCreationSchema,
  ticketUpdateBodySchema,
  idTicketUpdateSchema,
  ticketTasksSchema,
  ticketAcceptanceCriteriaSchema,
} = require("./tickets.schema");

function getAuthUserId(req) {
  return req.user?.id_usuario || req.user?.id || req.user?.user_id;
}

function sendValidationError(res, message, error) {
  return res.status(400).json({
    success: false,
    message,
    errors: error.flatten(),
  });
}

function sendInternalError(res, message, error) {
  console.error(error);

  return res.status(500).json({
    success: false,
    message,
  });
}

async function createTicket(req, res) {
  try {
    const validation = ticketCreationSchema.safeParse(req.body);

    if (!validation.success) {
      return sendValidationError(res, "Datos inválidos para crear el ticket.", validation.error);
    }

    const result = await TicketsService.createTicket(validation.data, getAuthUserId(req));
    return res.status(result.statusCode || 201).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al crear el ticket.", error);
  }
}

async function listTickets(req, res) {
  try {
    const validation = listTicketsByProyectoQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return sendValidationError(
        res,
        "El parámetro proyecto_id es obligatorio para listar tickets.",
        validation.error
      );
    }

    const result = await TicketsService.listTicketsByProyecto(
      validation.data.proyecto_id,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al listar tickets.", error);
  }
}

async function listTicketsByProyecto(req, res) {
  try {
    const validation = idProyectoSchema.safeParse(req.params);

    if (!validation.success) {
      return sendValidationError(res, "ID de proyecto inválido.", validation.error);
    }

    const result = await TicketsService.listTicketsByProyecto(
      validation.data.id_proyecto,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al listar tickets del proyecto.", error);
  }
}

async function getTicket(req, res) {
  try {
    const validation = idTicketSchema.safeParse(req.params);

    if (!validation.success) {
      return sendValidationError(res, "ID de ticket inválido.", validation.error);
    }

    const result = await TicketsService.getTicketById(
      validation.data.id_ticket,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al obtener el ticket.", error);
  }
}

async function updateTicket(req, res) {
  try {
    const idValidation = ticketUpdateIdSchema.safeParse(req.params);

    if (!idValidation.success) {
      return sendValidationError(res, "ID de ticket inválido para actualizar.", idValidation.error);
    }

    const bodyValidation = ticketUpdateSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return sendValidationError(res, "Datos inválidos para actualizar el ticket.", bodyValidation.error);
    }

    const result = await TicketsService.updateTicket(
      idValidation.data.id_ticket,
      bodyValidation.data,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al actualizar el ticket.", error);
  }
}

async function changeStatus(req, res) {
  try {
    const idValidation = idTicketSchema.safeParse(req.params);

    if (!idValidation.success) {
      return sendValidationError(res, "ID de ticket inválido.", idValidation.error);
    }

    const bodyValidation = ticketStatusSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return sendValidationError(res, "Estado de ticket inválido.", bodyValidation.error);
    }

    const result = await TicketsService.changeTicketStatus(
      idValidation.data.id_ticket,
      bodyValidation.data.status,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al cambiar el estado del ticket.", error);
  }
}

async function changeEstadoRegistro(req, res) {
  try {
    const idValidation = idTicketSchema.safeParse(req.params);

    if (!idValidation.success) {
      return sendValidationError(res, "ID de ticket inválido.", idValidation.error);
    }

    const bodyValidation = ticketEstadoRegistroSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return sendValidationError(res, "Estado de registro inválido.", bodyValidation.error);
    }

    const result = await TicketsService.changeTicketEstadoRegistro(
      idValidation.data.id_ticket,
      bodyValidation.data.estado_registro,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al cambiar el estado de registro.", error);
  }
}

async function deleteTicket(req, res) {
  try {
    const validation = idTicketSchema.safeParse(req.params);

    if (!validation.success) {
      return sendValidationError(res, "ID de ticket inválido.", validation.error);
    }

    const result = await TicketsService.deleteTicket(validation.data.id_ticket, getAuthUserId(req));
    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al eliminar el ticket.", error);
  }
}

async function createAssignmentToTicket(req, res) {
  try {
    const idValidation = idTicketSchema.safeParse(req.params);

    if (!idValidation.success) {
      return sendValidationError(res, "ID de ticket inválido.", idValidation.error);
    }

    const bodyValidation = proyectoAsignacionCreationSchema.safeParse({
      ...req.body,
      id_ticket: idValidation.data.id_ticket,
    });

    if (!bodyValidation.success) {
      return sendValidationError(res, "Datos inválidos para asignar el ticket.", bodyValidation.error);
    }

    const result = await TicketsService.createAssignmentToTicket(
      idValidation.data.id_ticket,
      bodyValidation.data,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 201).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al asignar el ticket.", error);
  }
}

async function listAssignmentsByTicket(req, res) {
  try {
    const validation = idTicketSchema.safeParse(req.params);

    if (!validation.success) {
      return sendValidationError(res, "ID de ticket inválido.", validation.error);
    }

    const result = await TicketsService.listAssignmentsByTicket(
      validation.data.id_ticket,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al listar asignaciones del ticket.", error);
  }
}

async function listAssignmentsByProyecto(req, res) {
  try {
    const validation = idProyectoSchema.safeParse(req.params);

    if (!validation.success) {
      return sendValidationError(res, "ID de proyecto inválido.", validation.error);
    }

    const result = await TicketsService.listAssignmentsByProyecto(
      validation.data.id_proyecto,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al listar asignaciones del proyecto.", error);
  }
}

async function updateAssignment(req, res) {
  try {
    const idValidation = idProyectoAsignacionSchema.safeParse(req.params);

    if (!idValidation.success) {
      return sendValidationError(res, "ID de asignación inválido.", idValidation.error);
    }

    const bodyValidation = proyectoAsignacionUpdateSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return sendValidationError(res, "Datos inválidos para actualizar la asignación.", bodyValidation.error);
    }

    const result = await TicketsService.updateAssignment(
      idValidation.data.id_asignacion,
      bodyValidation.data,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al actualizar la asignación.", error);
  }
}

async function deleteAssignment(req, res) {
  try {
    const validation = idProyectoAsignacionSchema.safeParse(req.params);

    if (!validation.success) {
      return sendValidationError(res, "ID de asignación inválido.", validation.error);
    }

    const result = await TicketsService.deleteAssignment(
      validation.data.id_asignacion,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al eliminar la asignación.", error);
  }
}

async function createTicketUpdate(req, res) {
  try {
    const idValidation = idProyectoAsignacionSchema.safeParse(req.params);

    if (!idValidation.success) {
      return sendValidationError(res, "ID de asignación inválido.", idValidation.error);
    }

    const bodyValidation = ticketUpdateCreationSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return sendValidationError(res, "Datos inválidos para crear la actualización.", bodyValidation.error);
    }

    const result = await TicketsService.createTicketUpdate(
      idValidation.data.id_asignacion,
      bodyValidation.data,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 201).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al crear la actualización del ticket.", error);
  }
}

async function listTicketUpdatesByAssignment(req, res) {
  try {
    const validation = idProyectoAsignacionSchema.safeParse(req.params);

    if (!validation.success) {
      return sendValidationError(res, "ID de asignación inválido.", validation.error);
    }

    const result = await TicketsService.listTicketUpdatesByAssignment(
      validation.data.id_asignacion,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al listar actualizaciones de la asignación.", error);
  }
}

async function listTicketUpdatesByTicket(req, res) {
  try {
    const validation = idTicketSchema.safeParse(req.params);

    if (!validation.success) {
      return sendValidationError(res, "ID de ticket inválido.", validation.error);
    }

    const result = await TicketsService.listTicketUpdatesByTicket(
      validation.data.id_ticket,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al listar actualizaciones del ticket.", error);
  }
}

async function updateTicketUpdate(req, res) {
  try {
    const idValidation = idTicketUpdateSchema.safeParse(req.params);

    if (!idValidation.success) {
      return sendValidationError(res, "ID de actualización inválido.", idValidation.error);
    }

    const bodyValidation = ticketUpdateBodySchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return sendValidationError(res, "Datos inválidos para actualizar el comentario.", bodyValidation.error);
    }

    const result = await TicketsService.updateTicketUpdate(
      idValidation.data.id_actualizacion,
      bodyValidation.data,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al actualizar el comentario.", error);
  }
}

async function deleteTicketUpdate(req, res) {
  try {
    const validation = idTicketUpdateSchema.safeParse(req.params);

    if (!validation.success) {
      return sendValidationError(res, "ID de actualización inválido.", validation.error);
    }

    const result = await TicketsService.deleteTicketUpdate(
      validation.data.id_actualizacion,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al eliminar el comentario.", error);
  }
}



async function listTicketTasks(req, res) {
  try {
    const validation = idTicketSchema.safeParse(req.params);

    if (!validation.success) {
      return sendValidationError(res, "ID de ticket inválido.", validation.error);
    }

    const result = await TicketsService.listTicketTasks(
      validation.data.id_ticket,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al listar las acciones del ticket.", error);
  }
}

async function replaceTicketTasks(req, res) {
  try {
    const idValidation = idTicketSchema.safeParse(req.params);

    if (!idValidation.success) {
      return sendValidationError(res, "ID de ticket inválido.", idValidation.error);
    }

    const bodyValidation = ticketTasksSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return sendValidationError(res, "Datos inválidos para actualizar las acciones.", bodyValidation.error);
    }

    const result = await TicketsService.replaceTicketTasks(
      idValidation.data.id_ticket,
      bodyValidation.data.tasks,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al actualizar las acciones del ticket.", error);
  }
}

async function listTicketAcceptanceCriteria(req, res) {
  try {
    const validation = idTicketSchema.safeParse(req.params);

    if (!validation.success) {
      return sendValidationError(res, "ID de ticket inválido.", validation.error);
    }

    const result = await TicketsService.listTicketAcceptanceCriteria(
      validation.data.id_ticket,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al listar los criterios de aceptación.", error);
  }
}

async function replaceTicketAcceptanceCriteria(req, res) {
  try {
    const idValidation = idTicketSchema.safeParse(req.params);

    if (!idValidation.success) {
      return sendValidationError(res, "ID de ticket inválido.", idValidation.error);
    }

    const bodyValidation = ticketAcceptanceCriteriaSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return sendValidationError(res, "Datos inválidos para actualizar los criterios de aceptación.", bodyValidation.error);
    }

    const result = await TicketsService.replaceTicketAcceptanceCriteria(
      idValidation.data.id_ticket,
      bodyValidation.data.acceptanceCriteria,
      getAuthUserId(req)
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return sendInternalError(res, "Error interno al actualizar los criterios de aceptación.", error);
  }
}

module.exports = {
  createTicket,
  listTickets,
  listTicketsByProyecto,
  getTicket,
  updateTicket,
  changeStatus,
  changeEstadoRegistro,
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
