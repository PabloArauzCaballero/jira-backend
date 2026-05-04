const request = require("supertest");
const app = require("../../app");
const TicketsService = require("../../modules/tickets/tickets.service");

jest.mock("../../middlewares/jwtMiddleware", () => ({
  requireAuth: (req, res, next) => {
    req.user = { id_usuario: 1 };
    next();
  }
}));

jest.mock("../../modules/tickets/tickets.service", () => ({
  createTicket: jest.fn(),
  getTicketById: jest.fn(),
  listTicketsByProyecto: jest.fn(),
  updateTicket: jest.fn(),
  changeTicketStatus: jest.fn(),
  deleteTicket: jest.fn(),
}));

describe("Tickets API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/tickets", () => {
    it("debe crear un ticket con datos validos y devolver 201", async () => {
      TicketsService.createTicket.mockResolvedValue({
        success: true,
        data: { id_ticket: 1, nombre: "Test", status: "PENDIENTE" }
      });

      const res = await request(app)
        .post("/api/tickets")
        .send({ nombre: "Test", descripcion: "Desc", id_proyecto: 1 })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id_ticket).toBe(1);
      expect(TicketsService.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: "Test", id_proyecto: 1 }),
        1
      );
    });

    it("debe devolver 400 cuando faltan datos obligatorios", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .send({ descripcion: "Falta nombre y proyecto" })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(TicketsService.createTicket).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/tickets", () => {
    it("debe listar tickets por proyecto y devolver 200", async () => {
      TicketsService.listTicketsByProyecto.mockResolvedValue({
        success: true,
        data: [
          { id_ticket: 1, nombre: "Ticket A", status: "PENDIENTE" },
          { id_ticket: 2, nombre: "Ticket B", status: "EN_PROGRESO" },
        ]
      });

      const res = await request(app)
        .get("/api/tickets?proyecto_id=1")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(TicketsService.listTicketsByProyecto).toHaveBeenCalledWith(1, 1);
    });

    it("debe devolver 400 cuando falta proyecto_id", async () => {
      const res = await request(app)
        .get("/api/tickets")
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(TicketsService.listTicketsByProyecto).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/tickets/:id", () => {
    it("debe devolver un ticket existente con 200", async () => {
      TicketsService.getTicketById.mockResolvedValue({
        success: true,
        data: { id_ticket: 1, nombre: "Ticket A", status: "PENDIENTE" }
      });

      const res = await request(app)
        .get("/api/tickets/1")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id_ticket).toBe(1);
      expect(TicketsService.getTicketById).toHaveBeenCalledWith(1, 1);
    });

    it("debe devolver 404 cuando el ticket no existe", async () => {
      TicketsService.getTicketById.mockResolvedValue({
        success: false,
        statusCode: 404,
        message: "Ticket no encontrado."
      });

      const res = await request(app)
        .get("/api/tickets/999")
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(TicketsService.getTicketById).toHaveBeenCalledWith(999, 1);
    });
  });

  describe("PUT /api/tickets/:id", () => {
    it("debe actualizar un ticket y devolver 200", async () => {
      TicketsService.updateTicket.mockResolvedValue({
        success: true,
        data: { id_ticket: 1, nombre: "Ticket actualizado", prioridad: "ALTA" }
      });

      const res = await request(app)
        .put("/api/tickets/1")
        .send({ nombre: "Ticket actualizado", prioridad: "ALTA" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(TicketsService.updateTicket).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ nombre: "Ticket actualizado", prioridad: "ALTA" }),
        1
      );
    });
  });

  describe("PATCH /api/tickets/:id/estado", () => {
    it("debe cambiar el estado con transicion valida y devolver 200", async () => {
      TicketsService.changeTicketStatus.mockResolvedValue({
        success: true,
        data: { id_ticket: 1, status: "EN_PROGRESO" }
      });

      const res = await request(app)
        .patch("/api/tickets/1/estado")
        .send({ status: "EN_PROGRESO" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(TicketsService.changeTicketStatus).toHaveBeenCalledWith(1, "EN_PROGRESO", 1);
    });

    it("debe devolver 400 con transicion invalida", async () => {
      TicketsService.changeTicketStatus.mockResolvedValue({
        success: false,
        statusCode: 400,
        message: "Transicion de estado no permitida: PENDIENTE -> COMPLETADO."
      });

      const res = await request(app)
        .patch("/api/tickets/1/estado")
        .send({ status: "COMPLETADO" })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(TicketsService.changeTicketStatus).toHaveBeenCalledWith(1, "COMPLETADO", 1);
    });

    it("debe devolver 400 al cambiar a EN_PROGRESO sin asignado", async () => {
      TicketsService.changeTicketStatus.mockResolvedValue({
        success: false,
        statusCode: 400,
        message: "No se puede iniciar un ticket sin responsable asignado."
      });

      const res = await request(app)
        .patch("/api/tickets/1/estado")
        .send({ status: "EN_PROGRESO" })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("No se puede iniciar un ticket sin responsable asignado.");
    });

    it("debe devolver 400 al saltar de PENDIENTE a COMPLETADO", async () => {
      TicketsService.changeTicketStatus.mockResolvedValue({
        success: false,
        statusCode: 400,
        message: "Transicion de estado no permitida: PENDIENTE -> COMPLETADO."
      });

      const res = await request(app)
        .patch("/api/tickets/1/estado")
        .send({ status: "COMPLETADO" })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Transicion de estado no permitida: PENDIENTE -> COMPLETADO.");
    });
  });

  describe("DELETE /api/tickets/:id", () => {
    it("debe eliminar un ticket y devolver 200", async () => {
      TicketsService.deleteTicket.mockResolvedValue({
        success: true,
        message: "Ticket eliminado correctamente."
      });

      const res = await request(app)
        .delete("/api/tickets/1")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Ticket eliminado correctamente.");
      expect(TicketsService.deleteTicket).toHaveBeenCalledWith(1, 1);
    });
  });
});
