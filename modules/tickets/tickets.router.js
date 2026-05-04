const router = require("express").Router();
const TicketsController = require("./tickets.controller");

// Tickets por proyecto
router.get("/proyecto/:id_proyecto", TicketsController.listTicketsByProyecto);
router.get("/proyecto/:id_proyecto/asignaciones", TicketsController.listAssignmentsByProyecto);

// Asignaciones
router.put("/asignaciones/:id_asignacion", TicketsController.updateAssignment);
router.delete("/asignaciones/:id_asignacion", TicketsController.deleteAssignment);
router.get(
  "/asignaciones/:id_asignacion/actualizaciones",
  TicketsController.listTicketUpdatesByAssignment
);
router.post(
  "/asignaciones/:id_asignacion/actualizaciones",
  TicketsController.createTicketUpdate
);

// Actualizaciones / comentarios de tickets
router.put("/actualizaciones/:id_actualizacion", TicketsController.updateTicketUpdate);
router.delete("/actualizaciones/:id_actualizacion", TicketsController.deleteTicketUpdate);

// Tickets
router.post("/", TicketsController.createTicket);
router.get("/", TicketsController.listTickets);
router.get("/:id_ticket", TicketsController.getTicket);
router.put("/:id_ticket", TicketsController.updateTicket);
router.patch("/:id_ticket/status", TicketsController.changeStatus);
router.patch("/:id_ticket/estado", TicketsController.changeEstadoRegistro);
router.patch("/:id_ticket/estado-registro", TicketsController.changeEstadoRegistro);
router.delete("/:id_ticket", TicketsController.deleteTicket);

// Acciones y criterios de aceptación del ticket

router.get("/:id_ticket/tasks", TicketsController.listTicketTasks);
router.put("/:id_ticket/tasks", TicketsController.replaceTicketTasks);
router.get("/:id_ticket/acceptance-criteria", TicketsController.listTicketAcceptanceCriteria);
router.put("/:id_ticket/acceptance-criteria", TicketsController.replaceTicketAcceptanceCriteria);

// Asignaciones de un ticket específico
router.get("/:id_ticket/asignaciones", TicketsController.listAssignmentsByTicket);
router.post("/:id_ticket/asignaciones", TicketsController.createAssignmentToTicket);
router.get("/:id_ticket/actualizaciones", TicketsController.listTicketUpdatesByTicket);

module.exports = router;
