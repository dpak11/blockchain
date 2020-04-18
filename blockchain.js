const Block = require("./block");

class BlockChain {
    constructor(difficultyLevel, masterKey) {
        this.chain = [];
        this.difficulty = difficultyLevel;
        this.MASTER_KEY = masterKey;
        this.createGenesis();

    }
    createGenesis() {
        const newdata = {name:"Genesis Block", amount: 100};
        const genesisBlock = new Block(1, newdata, null, null, null, this.MASTER_KEY);
        genesisBlock.hasher();
        this.chain.push(genesisBlock);
    }
    lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    isValid(newBlock = null) {
        if (newBlock == null) {
            console.log("Checking all Block hashes");
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
        } else {
            console.log("Checking New Block hash");
            if (newBlock.hash !== newBlock.hasher()) {
                return false
            }
            let prevblock = this.chain[this.chain.length - 2];
            if (prevblock) {
                if (prevblock.hash !== newBlock.prevHash) {
                    return false;
                }
            }

        }
        return true;
    }

    addBlock(index, userdata, nonce, time, hash, prevhash, startMining = true) {
        let newBlock = new Block(index, userdata, nonce, time, hash, this.MASTER_KEY, prevhash);
        if (startMining) {
            newBlock.mineBlock(this.difficulty);
            console.log("Mining Complete");
        }
        this.chain.push(newBlock);
        console.log("Block added to chain");
        console.log("---------------------")

    }

}

module.exports = BlockChain;