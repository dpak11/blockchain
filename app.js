const BlockChain = require("./blockchain");
const keys = require("./keys");
const express = require('express');
const { Worker } = require('worker_threads')
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const MASTER_KEY = keys.MASTERKEY;
const difficultyLevel = 4;
let transactionList = [];
let miningActive = false;
let myBlockchain = BlockChain(difficultyLevel, MASTER_KEY);


// Show all Blocks in a BlockChain

app.get("/blockchain", (req, res) => {
    let blocks = [];
    myBlockchain.get().forEach((block) => {
        blocks.push(block.get());
    })
    res.send({ blockchain: blocks });
});

app.get("/transactions", (req, res) => {
    if(transactionList.length == 0){
        return res.send("No pending transactions")
    }
    return res.json({total_inQueue:transactionList.length, transactions:transactionList});
});




// Add new Block into BlockChain using input data 'name' and 'amount'

app.post("/blockdata", async (req, res) => {
    const { name, amount } = req.body;
    if (!name || !amount) {
        return res.send("Required 'name', 'amount'");
    }
    let inputData = { name, amount };
    let transactionID = (transactionList.length > 0) ? transactionList[transactionList.length - 1].id + 1 : 1;
    let transaction = {
        id: transactionID,
        data: { ...inputData }
    };
    transactionList.push(transaction);
    //let lastBlock = myBlockchain.lastBlock().get();
    //myBlockchain.addBlock(lastBlock.index + 1, inputData, null, null, null, lastBlock.hash);
    //return res.send(myBlockchain.lastBlock().get());
    if (!miningActive) {
        //console.log("processing...");
        const new_block = await processTransaction();
        const {index, user_data, nonce, timestamp, hash, prevHash} = new_block.updated;
        //console.log("processTransaction Complete: ");
        miningActive = false;
        transactionList.splice(0, 1);
        /*console.log("++++++++");
        console.log(new_block);*/
        myBlockchain.addBlock(index, user_data, nonce, timestamp, hash, prevHash, false); // Mining set to false
        res.send(myBlockchain.lastBlock().get());


    } else {
        res.send("Your Transaction ID(" + transactionID + ") is added to queue");
    }


});

async function doTransactions(){

}

// Input will be raw JSON data containing BlockChain.
// Testing purpose: The Output (JSON) from GET request > "/blockchain" api will be the input for this (POST request)
// Try making small changes to this JSON, you get BlockChain rejected error message

app.post("/blockchain", (req, res) => {
    const blockchain_json = req.body.blockchain;
    if (!Array.isArray(blockchain_json)) {
        return res.send("Error: Blockchain not found");
    }

    const tempBlockChain = BlockChain(difficultyLevel, MASTER_KEY);
    tempBlockChain.clear();

    for (let i = 0; i < blockchain_json.length; i++) {
        const bchain = blockchain_json[i];
        if (typeof bchain !== "object") {
            return res.send("Error: Blockchain not found");
        }
        if (!bchain.hash || typeof bchain.prevHash == "undefined" || !bchain.timestamp || typeof bchain.nonce == "undefined") {
            return res.send("Error: Invalid Blockchain");
        }

        let userData = { name: bchain.user_data.name, amount: bchain.user_data.amount };
        tempBlockChain.addBlock(bchain.index, userData, bchain.nonce, bchain.timestamp, bchain.hash, bchain.prevHash, false);
        if (!tempBlockChain.isValid(tempBlockChain.lastBlock())) {
            return res.send("Error: BlockChain Rejected")
        }
    }
    myBlockchain = tempBlockChain;
    res.send(tempBlockChain.get().length + " Block(s) Added to BlockChain successfuly ")

});

function processTransaction() {
    miningActive = true;
    let lastBlock = myBlockchain.lastBlock().get();
    return new Promise((resolve, reject) => {
        const worker = new Worker('./service.js', { workerData: { blockIndex: lastBlock.index + 1, lastBlockHash: lastBlock.hash, transactionData: transactionList[0].data, difficultyLevel, MASTER_KEY } });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        })
    })
}


let queueInterval = setInterval(function(){
    if(transactionList.length>0 && !miningActive){

    }
},3000)

http.listen(3000, () => {
    console.log(`Server running at port 3000 `);

});