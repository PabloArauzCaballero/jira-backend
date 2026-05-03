const jwt = require('jsonwebtoken');

function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id_usuario, // Nombre del campo desde base
            email: user.email,
            role: user.rol || "user",
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: "15m",
        }
    );
}

function verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}