const { tokie } = require('./tokie');
const KEYS = require("../keys");

module.exports = {
    createToken: function(id) {
        const token = tokie.create({
            data: { userid: id },
            secretKey: KEYS.tokenAccess,
            expiresIn: "15m"
        });
        if (token.error) {
            return { error: token.status }
        }
        return token.value
    },
    readToken: function(_token) {
        const token = tokie.read({
            secretKey: KEYS.tokenAccess,
            tokenKey: _token
        });
        if (token.error) {
            return { error: token.status }
        }
        return token.value
    }

}