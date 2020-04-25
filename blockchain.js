const Block = require("./block");

function BlockChain(difficultyLevel, masterKey) {
    
    let chain = [];
    let difficulty = difficultyLevel;
    let MASTER_KEY = masterKey;       
    createGenesis();
    
    function createGenesis() {
        const newdata = {name:"Genesis Block", amount: 100};
        const genesisBlock = Block(1, newdata, null, null, null, MASTER_KEY);
        genesisBlock.hasher();
        chain.push(genesisBlock);
    }

    

    return {
        lastBlock: function() {
            return chain[chain.length - 1];
        },
        addBlock: function(index, userdata, nonce, time, hash, prevhash, startMining = true) {
            let newBlock = Block(index, userdata, nonce, time, hash, MASTER_KEY, prevhash);
            if (startMining) {
                newBlock.mineBlock(difficulty);
                console.log("Mining Complete");
            }
            chain.push(newBlock);
        },
        isValid: function(_block) {        
            console.log("Checking New Block hash");
            if (_block.get().hash !== _block.hasher()) {
                /*console.log("hash Mismatch:\n"+_block.get().hash);
                console.log({..._block.get()});
                console.log(_block.hasher());*/

                return false
            }
            let prevblock = chain[chain.length - 2];
            if (prevblock) {                
                if (prevblock.get().hash !== _block.get().prevHash) {
                    console.log("prevHash Mismatch:");
                    console.log(prevblock.get().hash, _block.get().prevHash);
                    return false;
                }
            }            
            return true;
        },
        clear: function(){
            chain = [];
        },
        get: function(){
            return chain;
        }
    }

}

module.exports = BlockChain;