const BlockChain = require("./blockchain");
const keys = require("./keys")
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const MASTER_KEY = keys.MASTERKEY;
const difficultyLevel = 3;
let myBlockchain = new BlockChain(difficultyLevel, MASTER_KEY);


// Show all Blocks from in a BlockChain

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
    myBlockchain.addBlock(myBlockchain.lastBlock().index + 1, inputData, null, null, null, myBlockchain.lastBlock().hash);
    res.send(myBlockchain.lastBlock().getBlock())
});


// Input will be raw JSON data containing BlockChain.
// Testing purpose: The Output (JSON) from GET request > "/blockchain" api will be the input for this (POST request)
// Try making small changes to this JSON. You get BlockChain Corrupt error message

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
        let userData = { name: bchain.name, amount: bchain.amount };
        tempBlockChain.addBlock(bchain.index, userData, bchain.nonce, bchain.timestamp, bchain.hash, bchain.prevHash, false);
        if (!tempBlockChain.isValid(tempBlockChain.lastBlock())) {
            return res.send("Error: BlockChain corrupt")
        }
    }
    myBlockchain = tempBlockChain;
    res.send("Total Blocks Added to BlockChain: " + tempBlockChain.chain.length)

});


http.listen(port, () => {
    console.log(`Server running at port ` + port);

});