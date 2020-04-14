const { SHA256 } = require('crypto-js');

class Block {
    constructor(num, name, amount, prevHash = "0") {
    	console.log("prev Hash:"+prevHash);
    	this.blockNum = num;
        this.name = name;
        this.amount = amount;
        this.nonce = 0;
        this.timestamp = Date.now();
        this.hash = "";
        this.prevHash = prevHash;
    }
    mineBlock(difficulty) {
        while (this.hash.substr(0, difficulty) != Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.hasher();
            //console.log(this.hash);
        }
        return this;

    }
    hasher() {
        //let start = Date.now()
        let blockstring = `SHA256${this.name}${this.amount}${this.timestamp}${this.nonce}${this.prevHash}`;
        return SHA256(blockstring).toString();

        /*let end = Date.now()
        console.log("hash complete at:"+ (end-start)/1000);*/
    }


}

let block1 = new Block(1,"Genesis",100);
block1.mineBlock(3);
console.log(block1);
console.log("Hash is: "+block1.hash);

let block2 = new Block(2,"second block",200,block1.hash);
block2.mineBlock(3);
console.log(block2);
console.log("Hash is: "+block2.hash);
