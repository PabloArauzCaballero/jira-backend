const router = require("express").Router();
const UsuariosController = require("./usuarios.controller");

router.put("/:id", UsuariosController.updateUser);
router.delete("/:id", UsuariosController.deleteUser);

module.exports = router;