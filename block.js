const { SHA256 } = require('crypto-js');

class Block {
    constructor(num, userData, nonce, ts, hash, masterKey, prevHash = "0") {        
        this.setUserData(userData);
        this.index = num;
        this.nonce = (nonce == null) ? 0 : nonce;
        this.timestamp = (ts == null) ? (new Date()).toString() : ts;
        this.prevHash = prevHash;
        this.masterKey = masterKey;
        this.hash = (hash == null) ? this.hasher() : hash
    }
    mineBlock(difficulty) {
        console.log("Mining in progress...");
        while (this.hash.substr(1, difficulty) != Array(difficulty + 1).join("0") || !this.hash.includes("012")) {
            this.nonce++;
            this.hash = this.hasher();
        }
    }
    setUserData(user_data){
       for(let data in user_data){
          this[data] = user_data[data]; 
        } 
    }
    hasher() {
        return SHA256(`${this.index}-${this.name}-${this.amount}-${this.timestamp}-${this.nonce}-${this.prevHash}-${this.masterKey}`).toString();
    }
    getBlock() {        
        let obj = {};
        for(let data in this){
            if(data !== "masterKey"){
                obj[data] = this[data];
            }             
        }
        return obj;
    }

}

module.exports = Block;