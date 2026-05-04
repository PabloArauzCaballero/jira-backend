const router = require("express").Router();
const ProyectosController = require("./proyectos.controller");

router.post("/", ProyectosController.createProyecto);
router.get("/", ProyectosController.listProyectos);
router.get("/:id_proyecto", ProyectosController.getProyecto);
router.put("/:id_proyecto", ProyectosController.updateProyecto);
router.delete("/:id_proyecto", ProyectosController.deleteProyecto);

router.get("/:id_proyecto/miembros", ProyectosController.listMiembros);
router.post("/:id_proyecto/miembros", ProyectosController.addMiembro);
router.put("/:id_proyecto/miembros/:id_usuario", ProyectosController.updateMiembro);
router.patch("/:id_proyecto/miembros/:id_usuario", ProyectosController.updateMiembro);
router.delete("/:id_proyecto/miembros/:id_usuario", ProyectosController.removeMiembro);

module.exports = router;
