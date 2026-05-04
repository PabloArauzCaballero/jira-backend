const { verifyAccessToken } = require("../core/jwt/jwt");

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    const tokenFromHeader =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    const tokenFromCookie = req.cookies?.access_token;

    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No autorizado. Token de acceso no proporcionado.",
      });
    }

    const decoded = verifyAccessToken(token);

    req.user = {
      id_usuario: decoded.id_usuario || decoded.sub,
      email: decoded.email,
      role: decoded.role || "user",
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado.",
    });
  }
}

module.exports = {
  requireAuth,
};