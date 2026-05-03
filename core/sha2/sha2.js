const crypto = require("crypto");

module.exports = {
    sha2Encode: (str) => {
        return crypto
            .createHash("sha256")
            .update(str)
            .digest("hex");
    }
};