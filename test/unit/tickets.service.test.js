const {
  createTicket,
  getTicketById,
  listTicketsByProyecto,
  updateTicket,
  changeTicketStatus,
  deleteTicket,
} = require("../../modules/tickets/tickets.service");

const TicketsRepository = require("../../modules/tickets/tickets.repository");
const ProyectosRepository = require("../../modules/proyectos/proyectos.repository");

jest.mock("../../modules/tickets/tickets.repository", () => ({
  createTicket: jest.fn(),
  getTicketById: jest.fn(),
  listTicketsByProyecto: jest.fn(),
  updateTicket: jest.fn(),
  softDeleteTicket: jest.fn(),
}));

jest.mock("../../modules/proyectos/proyectos.repository", () => ({
  getProyectoById: jest.fn(),
  isMiembro: jest.fn(),
}));

describe("Tickets Service", () => {
  const userId = 1;
  const proyectoId = 10;
  const ticketId = 100;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockProyectoAcceso({ esMiembro = true, esCreador = false, proyectoId: pid = proyectoId }) {
    ProyectosRepository.isMiembro.mockResolvedValue(esMiembro);
    ProyectosRepository.getProyectoById.mockResolvedValue({
      id_proyecto: pid,
      user_id_creacion: esCreador ? userId : 99,
    });
  }

  function mockTicket(data = {}) {
    return {
      id_ticket: ticketId,
      id_proyecto: proyectoId,
      status: "PENDIENTE",
      id_asignado: null,
      estado_registro: "ACTIVO",
      ...data,
    };
  }

  describe("createTicket", () => {
    it("crea ticket con estado PENDIENTE por defecto", async () => {
      mockProyectoAcceso({ esMiembro: true });
      TicketsRepository.createTicket.mockResolvedValue(mockTicket());

      const payload = { id_proyecto: proyectoId, titulo: "Test" };
      const result = await createTicket(payload, userId);

      expect(result.success).toBe(true);
      expect(TicketsRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "PENDIENTE",
          id_proyecto: proyectoId,
          user_id_creacion: userId,
        })
      );
    });

    it("devuelve 403 si el usuario no pertenece al proyecto", async () => {
      mockProyectoAcceso({ esMiembro: false, esCreador: false });

      const payload = { id_proyecto: proyectoId, titulo: "Test" };
      const result = await createTicket(payload, userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it("devuelve 400 si el asignado no es miembro del proyecto", async () => {
      mockProyectoAcceso({ esMiembro: true });
      ProyectosRepository.isMiembro.mockImplementation((pid, uid) => {
        if (uid === userId) return Promise.resolve(true);
        return Promise.resolve(false);
      });

      const payload = { id_proyecto: proyectoId, titulo: "Test", id_asignado: 999 };
      const result = await createTicket(payload, userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
    });

    it("permite crear ticket si el asignado es miembro del proyecto", async () => {
      mockProyectoAcceso({ esMiembro: true });
      ProyectosRepository.isMiembro.mockImplementation((pid, uid) => {
        return Promise.resolve(true);
      });
      TicketsRepository.createTicket.mockResolvedValue(mockTicket({ id_asignado: 2 }));

      const payload = { id_proyecto: proyectoId, titulo: "Test", id_asignado: 2 };
      const result = await createTicket(payload, userId);

      expect(result.success).toBe(true);
    });
  });

  describe("getTicketById", () => {
    it("devuelve ticket si el usuario tiene acceso al proyecto", async () => {
      TicketsRepository.getTicketById.mockResolvedValue(mockTicket());
      mockProyectoAcceso({ esMiembro: true });

      const result = await getTicketById(ticketId, userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("devuelve 404 si el ticket no existe", async () => {
      TicketsRepository.getTicketById.mockResolvedValue(null);

      const result = await getTicketById(ticketId, userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it("devuelve 403 si el usuario no tiene acceso al proyecto", async () => {
      TicketsRepository.getTicketById.mockResolvedValue(mockTicket());
      mockProyectoAcceso({ esMiembro: false, esCreador: false });

      const result = await getTicketById(ticketId, userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(403);
    });
  });

  describe("listTicketsByProyecto", () => {
    it("lista tickets si el usuario tiene acceso al proyecto", async () => {
      mockProyectoAcceso({ esMiembro: true });
      TicketsRepository.listTicketsByProyecto.mockResolvedValue([mockTicket(), mockTicket({ id_ticket: 101 })]);

      const result = await listTicketsByProyecto(proyectoId, userId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("devuelve 403 si el usuario no tiene acceso al proyecto", async () => {
      mockProyectoAcceso({ esMiembro: false, esCreador: false });

      const result = await listTicketsByProyecto(proyectoId, userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(403);
    });
  });

  describe("updateTicket", () => {
    it("actualiza ticket si el usuario tiene acceso", async () => {
      TicketsRepository.getTicketById.mockResolvedValue(mockTicket());
      mockProyectoAcceso({ esMiembro: true });
      TicketsRepository.updateTicket.mockResolvedValue(mockTicket({ titulo: "Actualizado" }));

      const result = await updateTicket(ticketId, { titulo: "Actualizado" }, userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("devuelve 404 si el ticket no existe", async () => {
      TicketsRepository.getTicketById.mockResolvedValue(null);

      const result = await updateTicket(ticketId, { titulo: "Actualizado" }, userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it("devuelve 403 si el usuario no tiene acceso", async () => {
      TicketsRepository.getTicketById.mockResolvedValue(mockTicket());
      mockProyectoAcceso({ esMiembro: false, esCreador: false });

      const result = await updateTicket(ticketId, { titulo: "Actualizado" }, userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it("devuelve 400 si el nuevo asignado no es miembro del proyecto", async () => {
      TicketsRepository.getTicketById.mockResolvedValue(mockTicket());
      mockProyectoAcceso({ esMiembro: true });
      ProyectosRepository.isMiembro.mockImplementation((pid, uid) => {
        if (uid === userId) return Promise.resolve(true);
        return Promise.resolve(false);
      });

      const result = await updateTicket(ticketId, { id_asignado: 999 }, userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
    });
  });

  describe("changeTicketStatus", () => {
    function setupTicketAccess(ticketData) {
      TicketsRepository.getTicketById.mockResolvedValue(mockTicket(ticketData));
      mockProyectoAcceso({ esMiembro: true });
    }

    it("PENDIENTE → EN_PROGRESO es válido", async () => {
      setupTicketAccess({ status: "PENDIENTE", id_asignado: 2 });
      TicketsRepository.updateTicket.mockResolvedValue(mockTicket({ status: "EN_PROGRESO" }));

      const result = await changeTicketStatus(ticketId, "EN_PROGRESO", userId);

      expect(result.success).toBe(true);
    });

    it("PENDIENTE → COMPLETADO es inválido (400)", async () => {
      setupTicketAccess({ status: "PENDIENTE" });

      const result = await changeTicketStatus(ticketId, "COMPLETADO", userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
    });

    it("EN_PROGRESO → PENDIENTE es válido", async () => {
      setupTicketAccess({ status: "EN_PROGRESO", id_asignado: 2 });
      TicketsRepository.updateTicket.mockResolvedValue(mockTicket({ status: "PENDIENTE" }));

      const result = await changeTicketStatus(ticketId, "PENDIENTE", userId);

      expect(result.success).toBe(true);
    });

    it("EN_PROGRESO → COMPLETADO es válido", async () => {
      setupTicketAccess({ status: "EN_PROGRESO", id_asignado: 2 });
      TicketsRepository.updateTicket.mockResolvedValue(mockTicket({ status: "COMPLETADO" }));

      const result = await changeTicketStatus(ticketId, "COMPLETADO", userId);

      expect(result.success).toBe(true);
    });

    it("COMPLETADO → EN_PROGRESO es válido", async () => {
      setupTicketAccess({ status: "COMPLETADO", id_asignado: 2 });
      TicketsRepository.updateTicket.mockResolvedValue(mockTicket({ status: "EN_PROGRESO" }));

      const result = await changeTicketStatus(ticketId, "EN_PROGRESO", userId);

      expect(result.success).toBe(true);
    });

    it("COMPLETADO → PENDIENTE es inválido (400)", async () => {
      setupTicketAccess({ status: "COMPLETADO" });

      const result = await changeTicketStatus(ticketId, "PENDIENTE", userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
    });

    it("bloquea EN_PROGRESO sin asignado (400)", async () => {
      setupTicketAccess({ status: "PENDIENTE", id_asignado: null });

      const result = await changeTicketStatus(ticketId, "EN_PROGRESO", userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
    });

    it("devuelve 404 si el ticket no existe", async () => {
      TicketsRepository.getTicketById.mockResolvedValue(null);

      const result = await changeTicketStatus(ticketId, "EN_PROGRESO", userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it("devuelve 403 si el usuario no tiene acceso", async () => {
      TicketsRepository.getTicketById.mockResolvedValue(mockTicket());
      mockProyectoAcceso({ esMiembro: false, esCreador: false });

      const result = await changeTicketStatus(ticketId, "EN_PROGRESO", userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(403);
    });
  });

  describe("deleteTicket", () => {
    it("hace soft delete si el usuario tiene acceso", async () => {
      TicketsRepository.getTicketById.mockResolvedValue(mockTicket());
      mockProyectoAcceso({ esMiembro: true });
      TicketsRepository.softDeleteTicket.mockResolvedValue(mockTicket({ estado_registro: "ELIMINADO" }));

      const result = await deleteTicket(ticketId, userId);

      expect(result.success).toBe(true);
      expect(TicketsRepository.softDeleteTicket).toHaveBeenCalledWith(ticketId);
    });

    it("devuelve 404 si el ticket no existe", async () => {
      TicketsRepository.getTicketById.mockResolvedValue(null);

      const result = await deleteTicket(ticketId, userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it("devuelve 403 si el usuario no tiene acceso", async () => {
      TicketsRepository.getTicketById.mockResolvedValue(mockTicket());
      mockProyectoAcceso({ esMiembro: false, esCreador: false });

      const result = await deleteTicket(ticketId, userId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(403);
    });
  });
});
