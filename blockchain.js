const Block = require("./block");

class BlockChain {
    constructor(difficultyLevel) {
        this.chain = [];
        this.difficulty = difficultyLevel;
        this.createGenesis();
    }
    createGenesis() {
        const genesisBlock = new Block(1, "Genesis Block", 100);
        this.chain.push(genesisBlock);
    }
    lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    isValid(newBlock) {
        for (let i = 0; i < this.chain.length; i++) {
            if (this.chain[i].hash !== this.chain[i].hasher()) {
                return false
            }
            let nextblock = this.chain[i + 1];
            if (nextblock) {
                if (this.chain[i].hash !== nextblock.prevHash) {
                    return false
                }

            }
        }
        if(this.lastBlock().hash !== newBlock.prevHash){
            return false
        }
        return true;
    }

    addBlock(name, amt) {
        console.log("Waiting to add Block:");
        let newBlock = new Block(this.lastBlock().index + 1, name, amt, this.lastBlock().hash);
        //if(this.isValid(newBlock)){
        newBlock.mineBlock(this.difficulty);
        this.chain.push(newBlock);
        console.log("Mining Complete. Block added to chain");
        console.log("============================")
        /*}else{
            console.log("Invalid Blockchain");
            return 
        }*/
    }
    
}

module.exports = BlockChain;