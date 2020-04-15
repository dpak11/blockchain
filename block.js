const { SHA256 } = require('crypto-js');

class Block {
    constructor(num, name, amount, prevHash = "0") {
        this.index = num;
        this.name = name;
        this.amount = amount;
        this.nonce = 0;
        this.timestamp = (new Date()).toString();        
        this.prevHash = prevHash;
        this.hash = this.hasher();
    }
    mineBlock(difficulty) {
        console.log("Mining started");
        while (this.hash.substr(5, difficulty) != Array(difficulty + 1).join("0")) {
        //while (!this.hash.includes("000111")) {
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