const router = require("express").Router();
const ProyectosController = require("./proyectos.controller");

router.post("/", ProyectosController.createProyecto);
router.get("/", ProyectosController.listProyectos);
router.get("/:id_proyecto", ProyectosController.getProyecto);
router.put("/:id_proyecto", ProyectosController.updateProyecto);
router.delete("/:id_proyecto", ProyectosController.deleteProyecto);
router.post("/:id_proyecto/miembros", ProyectosController.addMiembro);
router.delete("/:id_proyecto/miembros/:id_usuario", ProyectosController.removeMiembro);

module.exports = router;
