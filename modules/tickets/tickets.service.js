const TicketsRepository = require("./tickets.repository");
const ProyectosRepository = require("../proyectos/proyectos.repository");

const TRANSICIONES_PERMITIDAS = {
    PENDIENTE: ["EN_PROGRESO"],
    EN_PROGRESO: ["PENDIENTE", "COMPLETADO"],
    COMPLETADO: ["EN_PROGRESO"],
};

async function createTicket(payload, userId) {
    const { id_proyecto, id_asignado, ...ticketData } = payload;

    // Verificar que el usuario pertenece al proyecto
    const esMiembro = await ProyectosRepository.isMiembro(id_proyecto, userId);
    const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);
    const esCreador = proyecto && proyecto.user_id_creacion === userId;

    if (!esMiembro && !esCreador) {
        return { success: false, statusCode: 403, message: "No tenés acceso a este proyecto." };
    }

    // Verificar que el asignado es miembro del proyecto (si se proporciona)
    if (id_asignado) {
        const asignadoEsMiembro = await ProyectosRepository.isMiembro(id_proyecto, id_asignado);
        const asignadoEsCreador = proyecto && proyecto.user_id_creacion === id_asignado;
        if (!asignadoEsMiembro && !asignadoEsCreador) {
            return { success: false, statusCode: 400, message: "El usuario asignado no pertenece al proyecto." };
        }
    }

    const ticket = await TicketsRepository.createTicket({
        ...ticketData,
        id_proyecto,
        id_asignado: id_asignado || null,
        status: "PENDIENTE",
        user_id_creacion: userId,
        user_id_modificacion: userId,
        estado_registro: "ACTIVO",
        version: 1,
    });

    return { success: true, data: ticket };
}

async function getTicketById(id_ticket, userId) {
    const ticket = await TicketsRepository.getTicketById(id_ticket);

    if (!ticket || ticket.estado_registro === "ELIMINADO") {
        return { success: false, statusCode: 404, message: "Ticket no encontrado." };
    }

    const esMiembro = await ProyectosRepository.isMiembro(ticket.id_proyecto, userId);
    const proyecto = await ProyectosRepository.getProyectoById(ticket.id_proyecto);
    const esCreador = proyecto && proyecto.user_id_creacion === userId;

    if (!esMiembro && !esCreador) {
        return { success: false, statusCode: 403, message: "No tenés acceso a este ticket." };
    }

    return { success: true, data: ticket };
}

async function listTicketsByProyecto(id_proyecto, userId) {
    const esMiembro = await ProyectosRepository.isMiembro(id_proyecto, userId);
    const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);
    const esCreador = proyecto && proyecto.user_id_creacion === userId;

    if (!esMiembro && !esCreador) {
        return { success: false, statusCode: 403, message: "No tenés acceso a este proyecto." };
    }

    const tickets = await TicketsRepository.listTicketsByProyecto(id_proyecto);
    return { success: true, data: tickets };
}

async function updateTicket(id_ticket, payload, userId) {
    const ticket = await TicketsRepository.getTicketById(id_ticket);

    if (!ticket || ticket.estado_registro === "ELIMINADO") {
        return { success: false, statusCode: 404, message: "Ticket no encontrado." };
    }

    const esMiembro = await ProyectosRepository.isMiembro(ticket.id_proyecto, userId);
    const proyecto = await ProyectosRepository.getProyectoById(ticket.id_proyecto);
    const esCreador = proyecto && proyecto.user_id_creacion === userId;

    if (!esMiembro && !esCreador) {
        return { success: false, statusCode: 403, message: "No tenés acceso a este ticket." };
    }

    // Si se está cambiando el asignado, validar que sea miembro
    if (payload.id_asignado) {
        const asignadoEsMiembro = await ProyectosRepository.isMiembro(ticket.id_proyecto, payload.id_asignado);
        const asignadoEsCreador = proyecto && proyecto.user_id_creacion === payload.id_asignado;
        if (!asignadoEsMiembro && !asignadoEsCreador) {
            return { success: false, statusCode: 400, message: "El usuario asignado no pertenece al proyecto." };
        }
    }

    const updated = await TicketsRepository.updateTicket(id_ticket, {
        ...payload,
        user_id_modificacion: userId,
        actualizado_en: new Date(),
    });

    return { success: true, data: updated };
}

async function changeTicketStatus(id_ticket, status, userId) {
    const ticket = await TicketsRepository.getTicketById(id_ticket);

    if (!ticket || ticket.estado_registro === "ELIMINADO") {
        return { success: false, statusCode: 404, message: "Ticket no encontrado." };
    }

    const esMiembro = await ProyectosRepository.isMiembro(ticket.id_proyecto, userId);
    const proyecto = await ProyectosRepository.getProyectoById(ticket.id_proyecto);
    const esCreador = proyecto && proyecto.user_id_creacion === userId;

    if (!esMiembro && !esCreador) {
        return { success: false, statusCode: 403, message: "No tenés acceso a este ticket." };
    }

    // Validar transición de estado
    const estadosPermitidos = TRANSICIONES_PERMITIDAS[ticket.status] || [];
    if (!estadosPermitidos.includes(status)) {
        return { success: false, statusCode: 400, message: `Transición de estado no permitida: ${ticket.status} → ${status}.` };
    }

    // Validar que tenga asignado si va a EN_PROGRESO
    if (status === "EN_PROGRESO" && !ticket.id_asignado) {
        return { success: false, statusCode: 400, message: "No se puede iniciar un ticket sin responsable asignado." };
    }

    const updated = await TicketsRepository.updateTicket(id_ticket, {
        status,
        user_id_modificacion: userId,
        actualizado_en: new Date(),
    });

    return { success: true, data: updated };
}

async function deleteTicket(id_ticket, userId) {
    const ticket = await TicketsRepository.getTicketById(id_ticket);

    if (!ticket || ticket.estado_registro === "ELIMINADO") {
        return { success: false, statusCode: 404, message: "Ticket no encontrado." };
    }

    const esMiembro = await ProyectosRepository.isMiembro(ticket.id_proyecto, userId);
    const proyecto = await ProyectosRepository.getProyectoById(ticket.id_proyecto);
    const esCreador = proyecto && proyecto.user_id_creacion === userId;

    if (!esMiembro && !esCreador) {
        return { success: false, statusCode: 403, message: "No tenés acceso a este ticket." };
    }

    await TicketsRepository.softDeleteTicket(id_ticket);

    return { success: true, message: "Ticket eliminado correctamente." };
}

module.exports = {
    createTicket,
    getTicketById,
    listTicketsByProyecto,
    updateTicket,
    changeTicketStatus,
    deleteTicket,
};
