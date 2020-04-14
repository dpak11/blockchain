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

    addBlock(name,amt) {
        console.log("Waiting to add Block:");
        let newBlock = new Block(this.lastBlock().index+1, name, amt, this.lastBlock().hash);        
        newBlock.mineBlock(this.difficulty);
        if (newBlock.prevHash !== this.lastBlock().hash) {
            console.log("prev hash Not matching")
            return false
        }
        this.chain.push(newBlock);
        return true;
    }
}

module.exports = BlockChain;