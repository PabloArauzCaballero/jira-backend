jest.mock("../../modules/proyectos/proyectos.repository", () => ({
    createProyecto: jest.fn(),
    getProyectoById: jest.fn(),
    listProyectosByUsuario: jest.fn(),
    updateProyecto: jest.fn(),
    addMiembro: jest.fn(),
    removeMiembro: jest.fn(),
    isMiembro: jest.fn(),
    softDeleteProyecto: jest.fn(),
}));

jest.mock("../../modules/users/usuarios.repository", () => ({
    getUserById: jest.fn(),
}));

const ProyectosRepository = require("../../modules/proyectos/proyectos.repository");
const UsuariosRepository = require("../../modules/users/usuarios.repository");
const ProyectosService = require("../../modules/proyectos/proyectos.service");

describe("ProyectosService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createProyecto", () => {
        it("crea proyecto con datos correctos, auto-agrega creador como miembro y devuelve success true", async () => {
            const payload = { nombre: "Proyecto Test", descripcion: "Desc" };
            const userId = 1;
            const proyectoCreado = { id_proyecto: 10, nombre: "Proyecto Test" };

            ProyectosRepository.createProyecto.mockResolvedValue(proyectoCreado);
            ProyectosRepository.addMiembro.mockResolvedValue({});

            const result = await ProyectosService.createProyecto(payload, userId);

            expect(ProyectosRepository.createProyecto).toHaveBeenCalledWith({
                ...payload,
                user_id_creacion: userId,
                user_id_modificacion: userId,
                estado_registro: "ACTIVO",
                version: 1,
            });
            expect(ProyectosRepository.addMiembro).toHaveBeenCalledWith(10, userId);
            expect(result).toEqual({ success: true, data: proyectoCreado });
        });
    });

    describe("getProyectoById", () => {
        it("devuelve el proyecto si el usuario es creador", async () => {
            const proyecto = { id_proyecto: 1, nombre: "P", user_id_creacion: 5, estado_registro: "ACTIVO" };
            ProyectosRepository.getProyectoById.mockResolvedValue(proyecto);

            const result = await ProyectosService.getProyectoById(1, 5);

            expect(result).toEqual({ success: true, data: proyecto });
            expect(ProyectosRepository.isMiembro).not.toHaveBeenCalled();
        });

        it("devuelve el proyecto si el usuario es miembro", async () => {
            const proyecto = { id_proyecto: 1, nombre: "P", user_id_creacion: 5, estado_registro: "ACTIVO" };
            ProyectosRepository.getProyectoById.mockResolvedValue(proyecto);
            ProyectosRepository.isMiembro.mockResolvedValue(true);

            const result = await ProyectosService.getProyectoById(1, 99);

            expect(ProyectosRepository.isMiembro).toHaveBeenCalledWith(1, 99);
            expect(result).toEqual({ success: true, data: proyecto });
        });

        it("devuelve 404 si no existe", async () => {
            ProyectosRepository.getProyectoById.mockResolvedValue(null);

            const result = await ProyectosService.getProyectoById(1, 5);

            expect(result).toEqual({
                success: false,
                statusCode: 404,
                message: "Proyecto no encontrado.",
            });
        });

        it("devuelve 403 si no tiene acceso", async () => {
            const proyecto = { id_proyecto: 1, nombre: "P", user_id_creacion: 5, estado_registro: "ACTIVO" };
            ProyectosRepository.getProyectoById.mockResolvedValue(proyecto);
            ProyectosRepository.isMiembro.mockResolvedValue(false);

            const result = await ProyectosService.getProyectoById(1, 99);

            expect(result).toEqual({
                success: false,
                statusCode: 403,
                message: "No tenés acceso a este proyecto.",
            });
        });

        it("devuelve 404 si está eliminado", async () => {
            const proyecto = { id_proyecto: 1, nombre: "P", user_id_creacion: 5, estado_registro: "ELIMINADO" };
            ProyectosRepository.getProyectoById.mockResolvedValue(proyecto);

            const result = await ProyectosService.getProyectoById(1, 5);

            expect(result).toEqual({
                success: false,
                statusCode: 404,
                message: "Proyecto no encontrado.",
            });
        });
    });

    describe("listProyectosByUsuario", () => {
        it("devuelve lista de proyectos del usuario", async () => {
            const proyectos = [{ id_proyecto: 1 }, { id_proyecto: 2 }];
            ProyectosRepository.listProyectosByUsuario.mockResolvedValue(proyectos);

            const result = await ProyectosService.listProyectosByUsuario(5);

            expect(ProyectosRepository.listProyectosByUsuario).toHaveBeenCalledWith(5);
            expect(result).toEqual({ success: true, data: proyectos });
        });
    });

    describe("updateProyecto", () => {
        it("actualiza si es miembro", async () => {
            const proyecto = { id_proyecto: 1, user_id_creacion: 5, estado_registro: "ACTIVO" };
            const payload = { nombre: "Nuevo" };
            const updated = { id_proyecto: 1, nombre: "Nuevo" };

            ProyectosRepository.getProyectoById.mockResolvedValue(proyecto);
            ProyectosRepository.isMiembro.mockResolvedValue(true);
            ProyectosRepository.updateProyecto.mockResolvedValue(updated);

            const result = await ProyectosService.updateProyecto(1, payload, 99);

            expect(ProyectosRepository.updateProyecto).toHaveBeenCalledWith(1, {
                ...payload,
                user_id_modificacion: 99,
                actualizado_en: expect.any(Date),
            });
            expect(result).toEqual({ success: true, data: updated });
        });

        it("devuelve 404 si no existe", async () => {
            ProyectosRepository.getProyectoById.mockResolvedValue(null);

            const result = await ProyectosService.updateProyecto(1, {}, 5);

            expect(result).toEqual({
                success: false,
                statusCode: 404,
                message: "Proyecto no encontrado.",
            });
        });

        it("devuelve 403 si no tiene acceso", async () => {
            const proyecto = { id_proyecto: 1, user_id_creacion: 5, estado_registro: "ACTIVO" };
            ProyectosRepository.getProyectoById.mockResolvedValue(proyecto);
            ProyectosRepository.isMiembro.mockResolvedValue(false);

            const result = await ProyectosService.updateProyecto(1, {}, 99);

            expect(result).toEqual({
                success: false,
                statusCode: 403,
                message: "No tenés acceso a este proyecto.",
            });
        });
    });

    describe("addMiembro", () => {
        it("agrega miembro si tiene acceso", async () => {
            const proyecto = { id_proyecto: 1, user_id_creacion: 5, estado_registro: "ACTIVO" };
            ProyectosRepository.getProyectoById.mockResolvedValue(proyecto);
            ProyectosRepository.isMiembro.mockResolvedValue(true);
            UsuariosRepository.getUserById.mockResolvedValue({ id_usuario: 99 });
            ProyectosRepository.addMiembro.mockResolvedValue({});

            const result = await ProyectosService.addMiembro(1, 99, 5);

            expect(UsuariosRepository.getUserById).toHaveBeenCalledWith(99);
            expect(ProyectosRepository.addMiembro).toHaveBeenCalledWith(1, 99);
            expect(result).toEqual({ success: true, message: "Miembro agregado correctamente." });
        });

        it("devuelve 404 si el usuario no existe", async () => {
            const proyecto = { id_proyecto: 1, user_id_creacion: 5, estado_registro: "ACTIVO" };
            ProyectosRepository.getProyectoById.mockResolvedValue(proyecto);
            ProyectosRepository.isMiembro.mockResolvedValue(true);
            UsuariosRepository.getUserById.mockResolvedValue(null);

            const result = await ProyectosService.addMiembro(1, 99, 5);

            expect(result).toEqual({
                success: false,
                statusCode: 404,
                message: "El usuario no existe.",
            });
        });

        it("devuelve 404 si proyecto no existe", async () => {
            ProyectosRepository.getProyectoById.mockResolvedValue(null);

            const result = await ProyectosService.addMiembro(1, 99, 5);

            expect(result).toEqual({
                success: false,
                statusCode: 404,
                message: "Proyecto no encontrado.",
            });
        });
    });

    describe("removeMiembro", () => {
        it("remueve miembro si tiene acceso", async () => {
            const proyecto = { id_proyecto: 1, user_id_creacion: 5, estado_registro: "ACTIVO" };
            ProyectosRepository.getProyectoById.mockResolvedValue(proyecto);
            ProyectosRepository.isMiembro.mockResolvedValue(true);
            ProyectosRepository.removeMiembro.mockResolvedValue({});

            const result = await ProyectosService.removeMiembro(1, 99, 5);

            expect(ProyectosRepository.removeMiembro).toHaveBeenCalledWith(1, 99);
            expect(result).toEqual({ success: true, message: "Miembro removido correctamente." });
        });
    });

    describe("deleteProyecto", () => {
        it("soft delete si tiene acceso", async () => {
            const proyecto = { id_proyecto: 1, user_id_creacion: 5, estado_registro: "ACTIVO" };
            ProyectosRepository.getProyectoById.mockResolvedValue(proyecto);
            ProyectosRepository.isMiembro.mockResolvedValue(true);
            ProyectosRepository.softDeleteProyecto.mockResolvedValue({});

            const result = await ProyectosService.deleteProyecto(1, 5);

            expect(ProyectosRepository.softDeleteProyecto).toHaveBeenCalledWith(1);
            expect(result).toEqual({ success: true, message: "Proyecto eliminado correctamente." });
        });

        it("devuelve 404 si no existe", async () => {
            ProyectosRepository.getProyectoById.mockResolvedValue(null);

            const result = await ProyectosService.deleteProyecto(1, 5);

            expect(result).toEqual({
                success: false,
                statusCode: 404,
                message: "Proyecto no encontrado.",
            });
        });

        it("devuelve 403 si no tiene acceso", async () => {
            const proyecto = { id_proyecto: 1, user_id_creacion: 5, estado_registro: "ACTIVO" };
            ProyectosRepository.getProyectoById.mockResolvedValue(proyecto);
            ProyectosRepository.isMiembro.mockResolvedValue(false);

            const result = await ProyectosService.deleteProyecto(1, 99);

            expect(result).toEqual({
                success: false,
                statusCode: 403,
                message: "No tenés acceso a este proyecto.",
            });
        });
    });
});
