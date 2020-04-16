const { SHA256 } = require('crypto-js');

class Block {
    constructor(num, name, amount, nonce, ts, hash, masterKey, prevHash = "0") {
        this.index = num;
        this.name = name;
        this.amount = amount;
        this.nonce = (nonce == null) ? 0 : nonce;
        this.timestamp = (ts == null) ? (new Date()).toString() : ts;
        this.prevHash = prevHash;
        this.masterKey = masterKey;
        this.hash = (hash == null) ? this.hasher("") : hash
    }
    mineBlock(difficulty) {
        console.log("Mining started");
        while (this.hash.substr(5, difficulty) != Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.hasher();
        }
    }
    hasher() {
        return SHA256(`${this.index}-${this.name}-${this.amount}-${this.timestamp}-${this.nonce}-${this.prevHash}-${this.masterKey}`).toString();
    }
    getBlock() {
        const { index, amount, name, nonce, timestamp, hash, prevHash } = this;
        return {
            index,
            amount,
            name,
            nonce,
            timestamp,
            hash,
            prevHash
        }
    }

}

module.exports = Block;