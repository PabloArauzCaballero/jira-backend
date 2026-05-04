const router = require("express").Router();
const TicketsController = require("./tickets.controller");

router.post("/", TicketsController.createTicket);
router.get("/", TicketsController.listTickets);
router.get("/:id_ticket", TicketsController.getTicket);
router.put("/:id_ticket", TicketsController.updateTicket);
router.patch("/:id_ticket/estado", TicketsController.changeStatus);
router.delete("/:id_ticket", TicketsController.deleteTicket);

module.exports = router;
