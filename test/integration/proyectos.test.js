const request = require("supertest");

jest.mock("../../middlewares/jwtMiddleware", () => ({
  requireAuth: (req, res, next) => {
    req.user = { id_usuario: 1 };
    next();
  }
}));

jest.mock("../../modules/proyectos/proyectos.service", () => ({
  createProyecto: jest.fn(),
  getProyectoById: jest.fn(),
  listProyectosByUsuario: jest.fn(),
  updateProyecto: jest.fn(),
  addMiembro: jest.fn(),
  removeMiembro: jest.fn(),
  deleteProyecto: jest.fn(),
}));

const app = require("../../app");
const ProyectosService = require("../../modules/proyectos/proyectos.service");

describe("Proyectos API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/proyectos", () => {
    it("debe crear un proyecto con datos validos", async () => {
      ProyectosService.createProyecto.mockResolvedValue({
        success: true,
        data: { id_proyecto: 1, nombre: "Test" }
      });

      const res = await request(app)
        .post("/api/proyectos")
        .send({ nombre: "Test", descripcion: "Desc" })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(ProyectosService.createProyecto).toHaveBeenCalledWith(
        { nombre: "Test", descripcion: "Desc" },
        1
      );
    });

    it("debe devolver 400 cuando datos son invalidos", async () => {
      const res = await request(app)
        .post("/api/proyectos")
        .send({ nombre: "" })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(ProyectosService.createProyecto).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/proyectos", () => {
    it("debe listar proyectos del usuario", async () => {
      ProyectosService.listProyectosByUsuario.mockResolvedValue({
        success: true,
        data: [{ id_proyecto: 1, nombre: "Proyecto A" }]
      });

      const res = await request(app)
        .get("/api/proyectos")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(ProyectosService.listProyectosByUsuario).toHaveBeenCalledWith(1);
    });
  });

  describe("GET /api/proyectos/:id_proyecto", () => {
    it("debe devolver un proyecto existente", async () => {
      ProyectosService.getProyectoById.mockResolvedValue({
        success: true,
        data: { id_proyecto: 1, nombre: "Proyecto A" }
      });

      const res = await request(app)
        .get("/api/proyectos/1")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id_proyecto).toBe(1);
      expect(ProyectosService.getProyectoById).toHaveBeenCalledWith(1, 1);
    });

    it("debe devolver 404 cuando el proyecto no existe", async () => {
      ProyectosService.getProyectoById.mockResolvedValue({
        success: false,
        statusCode: 404,
        message: "Proyecto no encontrado."
      });

      const res = await request(app)
        .get("/api/proyectos/999")
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Proyecto no encontrado.");
    });
  });

  describe("PUT /api/proyectos/:id_proyecto", () => {
    it("debe actualizar un proyecto con datos validos", async () => {
      ProyectosService.updateProyecto.mockResolvedValue({
        success: true,
        data: { id_proyecto: 1, nombre: "Proyecto Actualizado" }
      });

      const res = await request(app)
        .put("/api/proyectos/1")
        .send({ nombre: "Proyecto Actualizado" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(ProyectosService.updateProyecto).toHaveBeenCalledWith(
        1,
        { nombre: "Proyecto Actualizado" },
        1
      );
    });
  });

  describe("DELETE /api/proyectos/:id_proyecto", () => {
    it("debe eliminar un proyecto existente", async () => {
      ProyectosService.deleteProyecto.mockResolvedValue({
        success: true,
        message: "Proyecto eliminado correctamente."
      });

      const res = await request(app)
        .delete("/api/proyectos/1")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(ProyectosService.deleteProyecto).toHaveBeenCalledWith(1, 1);
    });
  });

  describe("POST /api/proyectos/:id_proyecto/miembros", () => {
    it("debe agregar un miembro al proyecto", async () => {
      ProyectosService.addMiembro.mockResolvedValue({
        success: true,
        message: "Miembro agregado correctamente."
      });

      const res = await request(app)
        .post("/api/proyectos/1/miembros")
        .send({ id_usuario: 2 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(ProyectosService.addMiembro).toHaveBeenCalledWith(1, 2, 1);
    });
  });

  describe("DELETE /api/proyectos/:id_proyecto/miembros/:id_usuario", () => {
    it("debe remover un miembro del proyecto", async () => {
      ProyectosService.removeMiembro.mockResolvedValue({
        success: true,
        message: "Miembro removido correctamente."
      });

      const res = await request(app)
        .delete("/api/proyectos/1/miembros/2")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(ProyectosService.removeMiembro).toHaveBeenCalledWith(1, 2, 1);
    });
  });
});
