const { ticketModel, usuarioModel, proyectoModel } = require("../../core/db/models");

async function createTicket(payload) {
    return await ticketModel.create(payload);
}

async function getTicketById(id_ticket) {
    return await ticketModel.findByPk(id_ticket, {
        include: [
            { model: usuarioModel, as: "asignado", attributes: ["id_usuario", "nombre", "email"] },
            { model: proyectoModel, as: "proyecto", attributes: ["id_proyecto", "nombre", "descripcion"] },
        ],
    });
}

async function listTicketsByProyecto(id_proyecto) {
    return await ticketModel.findAll({
        where: { id_proyecto, estado_registro: "ACTIVO" },
        include: [
            { model: usuarioModel, as: "asignado", attributes: ["id_usuario", "nombre", "email"] },
        ],
        order: [["fecha_creacion", "DESC"]],
    });
}

async function updateTicket(id_ticket, payload) {
    const ticket = await ticketModel.findByPk(id_ticket);
    if (!ticket) return null;
    await ticket.update(payload);
    return ticket;
}

async function softDeleteTicket(id_ticket) {
    const ticket = await ticketModel.findByPk(id_ticket);
    if (!ticket) return null;
    await ticket.update({ estado_registro: "ELIMINADO" });
    return ticket;
}

module.exports = {
    createTicket,
    getTicketById,
    listTicketsByProyecto,
    updateTicket,
    softDeleteTicket,
};
