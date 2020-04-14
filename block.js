const { SHA256 } = require('crypto-js');

class Block {
    constructor(num, name, amount, prevHash = "0") {
        this.index = num;
        this.name = name;
        this.amount = amount;
        this.nonce = 0;
        this.timestamp = (new Date()).toString();
        this.hash = this.hasher();
        this.prevHash = prevHash;
    }
    mineBlock(difficulty) {
        console.log("Mining started");
        while (this.hash.substr(0, difficulty) != Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.hasher();
            //console.log(this.hash);
        }
        //return this;

    }
    hasher() {
        return SHA256(`SHA256${this.name}${this.amount}${this.timestamp}${this.nonce}${this.prevHash}`).toString();
    }
}

module.exports = Block;