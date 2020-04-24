const BlockChain = require("./blockchain");
const keys = require("./keys");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const MASTER_KEY = keys.MASTERKEY;
const difficultyLevel = 3;
let transactionList = [];
let miningActive = false;
let myBlockchain = new BlockChain(difficultyLevel, MASTER_KEY);


// Show all Blocks in a BlockChain

app.get("/blockchain", (req, res) => {
    let blocks = [];
    myBlockchain.chain.forEach((block) => {
        blocks.push(block.getBlock());
    })
    res.send({ blockchain: blocks });
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
    if (!miningActive) {
        processTransaction().then(() => {
            res.send(myBlockchain.lastBlock().getBlock())
        });
    } else {
        res.send("Your Transaction ID("+transactionID + ") is added to queue");
    }


});

// Input will be raw JSON data containing BlockChain.
// Testing purpose: The Output (JSON) from GET request > "/blockchain" api will be the input for this (POST request)
// Try making small changes to this JSON, you get BlockChain rejected error message

app.post("/blockchain", (req, res) => {
    const blockchain_json = req.body.blockchain;
    if (!Array.isArray(blockchain_json)) {
        return res.send("Error: Blockchain not found");
    }

    const tempBlockChain = new BlockChain(difficultyLevel, MASTER_KEY);
    tempBlockChain.chain = [];
    for (let i = 0; i < blockchain_json.length; i++) {
        const bchain = blockchain_json[i];
        if (typeof bchain !== "object") {
            return res.send("Error: Blockchain not found");
        }
        if (!bchain.hash || typeof bchain.prevHash == "undefined" || !bchain.timestamp || typeof bchain.nonce == "undefined") {
            return res.send("Error: Invalid Blockchain");
        }

        let userData = { name: bchain.name, amount: bchain.amount };
        tempBlockChain.addBlock(bchain.index, userData, bchain.nonce, bchain.timestamp, bchain.hash, bchain.prevHash, false);
        if (!tempBlockChain.isValid(tempBlockChain.lastBlock())) {
            return res.send("Error: BlockChain Rejected")
        }
    }
    myBlockchain = tempBlockChain;
    res.send(tempBlockChain.chain.length + " Block(s) Added to BlockChain successfuly ")

});

function processTransaction() {
    miningActive = true;
    //console.log("data:: ", transactionList[0].data);
    myBlockchain.addBlock(myBlockchain.lastBlock().index + 1, transactionList[0].data, null, null, null, myBlockchain.lastBlock().hash);
    miningActive = false;
    transactionList.splice(0, 1);
    return Promise.resolve();
}


http.listen(3000, () => {
    console.log(`Server running at port 3000 `);

});