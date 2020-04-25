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
const difficultyLevel = 3;
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
    if (transactionList.length == 0) {
        return res.send("No pending transactions")
    }
    return res.json({ inQueue_total: transactionList.length, inQueue_transactions: transactionList });
});




// Add new Block into BlockChain using input data 'name' and 'amount'

app.post("/blockdata", (req, res) => {
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
    return res.send("Your Transaction ID(" + transactionID + ") is added to queue. \nView all pending transactions at 'localhost:3000/transactions'\nView BlockChain for completed transactions at localhost:3000/blockchain");


});

async function doTransactions() {
    console.log("transaction started...");
    const new_block = await processBlockChain();
    const { index, user_data, nonce, timestamp, hash, prevHash } = new_block.updated;
    myBlockchain.addBlock(index, user_data, nonce, timestamp, hash, prevHash, false); // Mining set to false
    miningActive = false;
    transactionList.splice(0, 1);
    console.log("Block Added");
    /*if(promiseResp){
        return Promise.resolve();
    }*/
    return;

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

function processBlockChain() {
    miningActive = true;
    let lastBlock = myBlockchain.lastBlock().get();
    return new Promise((resolve, reject) => {
        const worker = new Worker('./worker.js', { workerData: { blockIndex: lastBlock.index + 1, lastBlockHash: lastBlock.hash, transactionData: transactionList[0].data, difficultyLevel, MASTER_KEY } });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        })
    })
}


let queueInterval = setInterval(function() {
    if (transactionList.length > 0 && !miningActive) {
        doTransactions();
    }
}, 3000)

http.listen(3000, () => {
    console.log(`Server running at port 3000 `);

});