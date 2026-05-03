const router = require("express").Router();
const UsuariosController = require("./usuarios.controller");

router.put("/:id_usuario", UsuariosController.updateUser);
router.delete("/:id_usuario", UsuariosController.deleteUser);
router.get("/", UsuariosController.listUsers);

module.exports = router;