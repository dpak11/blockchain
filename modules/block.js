const { SHA256 } = require('crypto-js');

function Block(num, userData, _nonce, ts, _hash, master_Key, _prevHash = "0") {
    let user_data = userData;
    let index = num;
    let nonce = (_nonce == null) ? 0 : _nonce;
    let timestamp = (ts == null) ? (new Date()).toString() : ts;
    let prevHash = _prevHash;
    let masterKey = master_Key;
    let hash = (_hash == null) ? generateHash() : _hash


    function generateHash() {
        return SHA256(`${index}-${JSON.stringify(user_data)}-${timestamp}-${nonce}-${prevHash}-${masterKey}`).toString();
    }

    return {
        mineBlock: function(difficulty) {
            console.log("Mining in progress...");
            while (hash.substr(1, difficulty) != Array(difficulty + 1).join("0") || !hash.includes("123")) {
                nonce++;
                hash = generateHash();
            }
        },
        get: function() {
            return { user_data, index, nonce, timestamp, prevHash, hash }
        },
        hasher: generateHash
    }

}

module.exports = Block;