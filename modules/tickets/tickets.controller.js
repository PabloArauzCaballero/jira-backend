const TicketsService = require("./tickets.service");
const {
    ticketCreationSchema,
    ticketUpdateSchema,
    ticketStatusSchema,
    idTicketSchema,
} = require("./tickets.schema");

async function createTicket(req, res) {
    try {
        const validation = ticketCreationSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Datos inválidos.",
                errors: validation.error.flatten(),
            });
        }

        const result = await TicketsService.createTicket(validation.data, req.user.id_usuario);
        return res.status(result.statusCode || 201).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno al crear el ticket.",
        });
    }
}

async function listTickets(req, res) {
    try {
        const id_proyecto = parseInt(req.query.proyecto_id);
        if (!id_proyecto || id_proyecto <= 0) {
            return res.status(400).json({
                success: false,
                message: "El parámetro proyecto_id es obligatorio.",
            });
        }

        const result = await TicketsService.listTicketsByProyecto(id_proyecto, req.user.id_usuario);
        return res.status(result.statusCode || 200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno al listar tickets.",
        });
    }
}

async function getTicket(req, res) {
    try {
        const validation = idTicketSchema.safeParse(req.params);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "ID inválido.",
                errors: validation.error.flatten(),
            });
        }

        const result = await TicketsService.getTicketById(validation.data.id_ticket, req.user.id_usuario);
        return res.status(result.statusCode || 200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno al obtener el ticket.",
        });
    }
}

async function updateTicket(req, res) {
    try {
        const idValidation = idTicketSchema.safeParse(req.params);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: "ID inválido.",
                errors: idValidation.error.flatten(),
            });
        }

        const bodyValidation = ticketUpdateSchema.safeParse(req.body);
        if (!bodyValidation.success) {
            return res.status(400).json({
                success: false,
                message: "Datos inválidos.",
                errors: bodyValidation.error.flatten(),
            });
        }

        const result = await TicketsService.updateTicket(
            idValidation.data.id_ticket,
            bodyValidation.data,
            req.user.id_usuario
        );
        return res.status(result.statusCode || 200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno al actualizar el ticket.",
        });
    }
}

async function changeStatus(req, res) {
    try {
        const idValidation = idTicketSchema.safeParse(req.params);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: "ID inválido.",
                errors: idValidation.error.flatten(),
            });
        }

        const bodyValidation = ticketStatusSchema.safeParse(req.body);
        if (!bodyValidation.success) {
            return res.status(400).json({
                success: false,
                message: "Estado inválido.",
                errors: bodyValidation.error.flatten(),
            });
        }

        const result = await TicketsService.changeTicketStatus(
            idValidation.data.id_ticket,
            bodyValidation.data.status,
            req.user.id_usuario
        );
        return res.status(result.statusCode || 200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno al cambiar el estado.",
        });
    }
}

async function deleteTicket(req, res) {
    try {
        const validation = idTicketSchema.safeParse(req.params);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "ID inválido.",
                errors: validation.error.flatten(),
            });
        }

        const result = await TicketsService.deleteTicket(validation.data.id_ticket, req.user.id_usuario);
        return res.status(result.statusCode || 200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno al eliminar el ticket.",
        });
    }
}

module.exports = {
    createTicket,
    listTickets,
    getTicket,
    updateTicket,
    changeStatus,
    deleteTicket,
};
