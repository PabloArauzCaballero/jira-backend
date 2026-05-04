require("dotenv").config();

jest.setTimeout(30000);

const request = require("supertest");
const app = require("../../app");
const { sequelize } = require("../../core/db/config");

const TEST_EMAIL = "test-runner@test.com";
const TEST_PASSWORD = "Test123!";

const SIGNUP_PAYLOAD = {
  nombre: "Test Runner",
  email: TEST_EMAIL,
  telefono: "1234567",
  timezone: "UTC",
  posicion_principal: "QA",
  password_hash: TEST_PASSWORD,
  is_two_factors: false,
};

const LOGIN_PAYLOAD = {
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
};

let agent;
let testUserId;
let testProyectoId;
let testProyectoId2;
let testTicketId;
let testTicketId2;
let testAsignacionId;
let testAsignacionId2;
let testUpdateId;

beforeAll(async () => {
  agent = request.agent(app);

  let loginRes = await agent.post("/api/auth/login").send(LOGIN_PAYLOAD);

  if (loginRes.body.success) {
    testUserId = loginRes.body.data.user.id_usuario;
  } else {
    const signupRes = await agent.post("/api/auth/signup").send(SIGNUP_PAYLOAD);
    if (!signupRes.body.success) {
      throw new Error("No se pudo crear el usuario de prueba: " + JSON.stringify(signupRes.body));
    }

    loginRes = await agent.post("/api/auth/login").send(LOGIN_PAYLOAD);
    if (!loginRes.body.success) {
      throw new Error("No se pudo iniciar sesion: " + JSON.stringify(loginRes.body));
    }

    testUserId = loginRes.body.data.user.id_usuario;
  }
});

afterAll(async () => {
  try {
    await agent.delete(`/api/proyectos/${testProyectoId}`);
    await agent.delete(`/api/proyectos/${testProyectoId2}`);
  } catch (e) { /* ignore */ }

  try {
    await sequelize.query(
      "DELETE FROM proyecto_miembros WHERE id_proyecto IN (:p1, :p2) AND id_usuario = :uid",
      { replacements: { p1: testProyectoId || 0, p2: testProyectoId2 || 0, uid: testUserId } }
    );
  } catch (e) { /* ignore */ }

  try {
    await agent.delete(`/api/usuarios/${testUserId}`);
  } catch (e) { /* ignore */ }

  try {
    await agent.post("/api/auth/logout");
  } catch (e) { /* ignore */ }
});

// ===================================================================
// AUTH
// ===================================================================
describe("Auth", () => {
  it("POST /api/auth/signup - duplicado devuelve 409", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send(SIGNUP_PAYLOAD);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/auth/login - credenciales invalidas devuelve 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: "wrongPassword!" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/auth/logout - cierra sesion y devuelve 200", async () => {
    const res = await agent.post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const loginAgain = await agent.post("/api/auth/login").send(LOGIN_PAYLOAD);
    expect(loginAgain.body.success).toBe(true);
  });
});

// ===================================================================
// HEALTH
// ===================================================================
describe("Health", () => {
  it("GET /health - responde ok sin token", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ===================================================================
// USUARIOS
// ===================================================================
describe("Usuarios", () => {
  it("GET /api/usuarios - lista usuarios (autenticado)", async () => {
    const res = await agent.get("/api/usuarios");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.length).toBeGreaterThanOrEqual(1);
  });

  it("PUT /api/usuarios/:id - actualiza nombre del propio usuario", async () => {
    const res = await agent
      .put(`/api/usuarios/${testUserId}`)
      .send({ nombre: "Test Runner Actualizado" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.nombre).toBe("Test Runner Actualizado");
  });
});

// ===================================================================
// PROYECTOS
// ===================================================================
describe("Proyectos", () => {
  it("POST /api/proyectos - crea proyecto y devuelve 201", async () => {
    const res = await agent.post("/api/proyectos").send({
      nombre: "Proyecto Test",
      descripcion: "Proyecto creado desde tests automatizados",
      user_id_creacion: testUserId,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nombre).toBe("Proyecto Test");

    testProyectoId = res.body.data.id_proyecto;
  });

  it("POST /api/proyectos - datos invalidos devuelve 400", async () => {
    const res = await agent.post("/api/proyectos").send({ nombre: "" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/proyectos - lista proyectos del usuario", async () => {
    const res = await agent.get("/api/proyectos");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((p) => p.id_proyecto === testProyectoId)).toBe(true);
  });

  it("GET /api/proyectos/:id - detalle de proyecto con miembros", async () => {
    const res = await agent.get(`/api/proyectos/${testProyectoId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id_proyecto).toBe(testProyectoId);
    expect(res.body.data.miembros).toBeDefined();
  });

  it("PUT /api/proyectos/:id - edita nombre del proyecto", async () => {
    const res = await agent
      .put(`/api/proyectos/${testProyectoId}`)
      .send({
        nombre: "Proyecto Test Modificado",
        user_id_modificacion: testUserId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nombre).toBe("Proyecto Test Modificado");
  });

  it("POST /api/proyectos/:id/miembros - agrega miembro (Pablo, id=1)", async () => {
    const res = await agent
      .post(`/api/proyectos/${testProyectoId}/miembros`)
      .send({ id_usuario: 1, cargo: "MIEMBRO" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/proyectos/:id/miembros - duplicado devuelve 409", async () => {
    const res = await agent
      .post(`/api/proyectos/${testProyectoId}/miembros`)
      .send({ id_usuario: 1 });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/proyectos/:id/miembros - lista miembros del proyecto", async () => {
    const res = await agent.get(`/api/proyectos/${testProyectoId}/miembros`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it("Crea un segundo proyecto para tests de listado y borrado", async () => {
    const res = await agent.post("/api/proyectos").send({
      nombre: "Proyecto Test 2",
      descripcion: "Segundo proyecto de prueba",
      user_id_creacion: testUserId,
    });

    expect(res.status).toBe(201);
    testProyectoId2 = res.body.data.id_proyecto;

    const listRes = await agent.get("/api/proyectos");
    const ownProjects = listRes.body.data.filter(
      (p) => p.id_proyecto === testProyectoId || p.id_proyecto === testProyectoId2
    );
    expect(ownProjects.length).toBe(2);
  });

  it("DELETE /api/proyectos/:id/miembros/:id_usuario - remueve miembro (no owner)", async () => {
    const res = await agent.delete(`/api/proyectos/${testProyectoId}/miembros/1`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /api/proyectos/:id/miembros/:id_usuario - no puede remover al owner", async () => {
    const res = await agent.delete(`/api/proyectos/${testProyectoId}/miembros/${testUserId}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("DELETE /api/proyectos/:id - soft delete del segundo proyecto", async () => {
    const res = await agent.delete(`/api/proyectos/${testProyectoId2}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await agent.get(`/api/proyectos/${testProyectoId2}`);
    expect(getRes.status).toBe(404);
  });
});

// ===================================================================
// TICKETS
// ===================================================================
describe("Tickets", () => {
  it("POST /api/tickets - crea ticket (status PENDIENTE por defecto)", async () => {
    const res = await agent.post("/api/tickets").send({
      nombre: "Ticket de prueba",
      descripcion: "Descripcion del ticket",
      prioridad: "ALTA",
      id_proyecto: testProyectoId,
      id_usuario: testUserId,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticket.status).toBe("PENDIENTE");
    expect(res.body.data.ticket.nombre).toBe("Ticket de prueba");

    testTicketId = res.body.data.ticket.id_ticket;
    testAsignacionId = res.body.data.asignacion.id_asignacion;
  });

  it("POST /api/tickets - faltan campos obligatorios devuelve 400", async () => {
    const res = await agent.post("/api/tickets").send({ descripcion: "Falta nombre y proyecto" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/tickets?proyecto_id=X - lista tickets del proyecto", async () => {
    const res = await agent.get(`/api/tickets?proyecto_id=${testProyectoId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((t) => t.id_ticket === testTicketId)).toBe(true);
  });

  it("GET /api/tickets?proyecto_id=X - sin proyecto_id devuelve 400", async () => {
    const res = await agent.get("/api/tickets");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/tickets/:id - detalle de ticket con asignaciones", async () => {
    const res = await agent.get(`/api/tickets/${testTicketId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id_ticket).toBe(testTicketId);
    expect(res.body.data.asignaciones).toBeDefined();
    expect(res.body.data.tasks).toBeDefined();
    expect(res.body.data.acceptanceCriteria).toBeDefined();
  });

  it("PUT /api/tickets/:id - edita titulo y prioridad", async () => {
    const res = await agent
      .put(`/api/tickets/${testTicketId}`)
      .send({ nombre: "Ticket Modificado", prioridad: "CRITICA" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nombre).toBe("Ticket Modificado");
    expect(res.body.data.prioridad).toBe("CRITICA");
  });

  it("PUT /api/tickets/:id - sin campos devuelve 400", async () => {
    const res = await agent.put(`/api/tickets/${testTicketId}`).send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("PATCH /api/tickets/:id/status - PENDIENTE -> EN_PROGRESO con asignado (valido)", async () => {
    const res = await agent
      .patch(`/api/tickets/${testTicketId}/status`)
      .send({ status: "EN_PROGRESO" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("EN_PROGRESO");
  });

  it("PATCH /api/tickets/:id/status - EN_PROGRESO -> EN_REVISION (valido)", async () => {
    const res = await agent
      .patch(`/api/tickets/${testTicketId}/status`)
      .send({ status: "EN_REVISION" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("EN_REVISION");
  });

  it("PATCH /api/tickets/:id/status - salto de EN_REVISION a PENDIENTE bloqueado (400)", async () => {
    const res = await agent
      .patch(`/api/tickets/${testTicketId}/status`)
      .send({ status: "PENDIENTE" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("PATCH /api/tickets/:id/status - estado invalido por zod devuelve 400", async () => {
    const res = await agent
      .patch(`/api/tickets/${testTicketId}/status`)
      .send({ status: "INEXISTENTE" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/tickets/proyecto/:id - lista tickets por ruta alternativa", async () => {
    const res = await agent.get(`/api/tickets/proyecto/${testProyectoId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((t) => t.id_ticket === testTicketId)).toBe(true);
  });

  it("POST /api/tickets/:id/asignaciones - duplicada devuelve 409", async () => {
    const res = await agent
      .post(`/api/tickets/${testTicketId}/asignaciones`)
      .send({ id_proyecto: testProyectoId, id_usuario: testUserId });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/tickets/:id/asignaciones - lista asignaciones del ticket", async () => {
    const res = await agent.get(`/api/tickets/${testTicketId}/asignaciones`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("PATCH /api/tickets/:id/estado - cambia estado de registro a INACTIVO", async () => {
    const res = await agent
      .patch(`/api/tickets/${testTicketId}/estado`)
      .send({ estado_registro: "INACTIVO" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.estado_registro).toBe("INACTIVO");
  });

  it("PATCH /api/tickets/:id/estado-registro - vuelve a ACTIVO", async () => {
    const res = await agent
      .patch(`/api/tickets/${testTicketId}/estado-registro`)
      .send({ estado_registro: "ACTIVO" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.estado_registro).toBe("ACTIVO");
  });
});

// ===================================================================
// ASIGNACIONES Y ACTUALIZACIONES
// ===================================================================
describe("Asignaciones y actualizaciones", () => {
  it("GET /api/tickets/proyecto/:id/asignaciones - lista asignaciones por proyecto", async () => {
    const res = await agent.get(`/api/tickets/proyecto/${testProyectoId}/asignaciones`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("PUT /api/tickets/asignaciones/:id - modifica asignacion", async () => {
    const res = await agent
      .put(`/api/tickets/asignaciones/${testAsignacionId}`)
      .send({ id_usuario: testUserId, id_proyecto: testProyectoId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/tickets/asignaciones/:id/actualizaciones - crea comentario", async () => {
    const res = await agent
      .post(`/api/tickets/asignaciones/${testAsignacionId}/actualizaciones`)
      .send({ actualizacion: "Primer comentario de prueba" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.actualizacion).toBe("Primer comentario de prueba");

    testUpdateId = res.body.data.id_actualizacion;
  });

  it("GET /api/tickets/asignaciones/:id/actualizaciones - lista comentarios", async () => {
    const res = await agent.get(
      `/api/tickets/asignaciones/${testAsignacionId}/actualizaciones`
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((u) => u.id_actualizacion === testUpdateId)).toBe(true);
  });

  it("PUT /api/tickets/actualizaciones/:id - edita comentario", async () => {
    const res = await agent
      .put(`/api/tickets/actualizaciones/${testUpdateId}`)
      .send({ actualizacion: "Comentario editado" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.actualizacion).toBe("Comentario editado");
  });

  it("GET /api/tickets/:id/actualizaciones - lista actualizaciones del ticket", async () => {
    const res = await agent.get(`/api/tickets/${testTicketId}/actualizaciones`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("DELETE /api/tickets/actualizaciones/:id - elimina (soft) comentario", async () => {
    const res = await agent.delete(`/api/tickets/actualizaciones/${testUpdateId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ===================================================================
// TASKS Y CRITERIOS
// ===================================================================
describe("Tasks y criterios", () => {
  it("PUT /api/tickets/:id/tasks - reemplaza lista de tasks", async () => {
    const res = await agent
      .put(`/api/tickets/${testTicketId}/tasks`)
      .send({ tasks: ["Disenar UI", "Implementar API", "Escribir tests"] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toContain("Disenar UI");
    expect(res.body.data.length).toBe(3);
  });

  it("GET /api/tickets/:id/tasks - lista tasks del ticket", async () => {
    const res = await agent.get(`/api/tickets/${testTicketId}/tasks`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(3);
  });

  it("PUT /api/tickets/:id/acceptance-criteria - reemplaza criterios", async () => {
    const res = await agent
      .put(`/api/tickets/${testTicketId}/acceptance-criteria`)
      .send({ acceptanceCriteria: ["Debe cargar en < 2s", "Debe ser responsive"] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toContain("Debe cargar en < 2s");
  });

  it("GET /api/tickets/:id/acceptance-criteria - lista criterios", async () => {
    const res = await agent.get(`/api/tickets/${testTicketId}/acceptance-criteria`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });
});

// ===================================================================
// SOFT DELETE DE TICKET
// ===================================================================
describe("Soft delete de ticket", () => {
  it("DELETE /api/tickets/:id - soft delete del ticket", async () => {
    const res = await agent.delete(`/api/tickets/${testTicketId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("GET /api/tickets/:id - ticket eliminado devuelve 404", async () => {
    const res = await agent.get(`/api/tickets/${testTicketId}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Ticket no encontrado.");
  });
});

// ===================================================================
// SEGURIDAD
// ===================================================================
describe("Seguridad", () => {
  it("GET /api/proyectos sin token devuelve 401", async () => {
    const res = await request(app).get("/api/proyectos");

    expect(res.status).toBe(401);
  });

  it("GET /api/tickets sin token devuelve 401", async () => {
    const res = await request(app).get("/api/tickets?proyecto_id=1");

    expect(res.status).toBe(401);
  });

  it("GET /api/proyectos/1 como usuario no miembro devuelve 403", async () => {
    const res = await agent.get("/api/proyectos/1");

    expect(res.status).toBe(403);
  });

  it("POST /api/tickets en proyecto ajeno devuelve 403", async () => {
    const res = await agent.post("/api/tickets").send({
      nombre: "Ticket intruso",
      descripcion: "No deberia crearse",
      id_proyecto: 1,
      id_usuario: testUserId,
    });

    expect(res.status).toBe(403);
  });
});
