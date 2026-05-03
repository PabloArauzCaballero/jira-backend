const {verifyAccessToken} = require("../core/jwt/jwt");

function requireAuth(req, res, next) {
    try {
        const token = req.cookies?.access_token;

        if(!token) {
            return res.status(401).json({
                success:false,
                message: "No autorizado. Token de accesso no proporcionado.",
            });
        }

        const decoded = verifyAccessToken(token);

        req.user = {
            id_usuario: decoded.sub,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    }catch(error){
        return res.status(401).json({
            success: false,
            message: "Token inválido o expirado.",
        });
    }
}

module.exports = {
    requireAuth,
}