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
const myBlockchain = new BlockChain(4,MASTER_KEY);


// Show all Blocks from in a BlockChain

app.get("/blockchain", (req, res) => {
    let blocks = [];
    myBlockchain.chain.forEach((block) => {
        blocks.push(block.getBlock());
    })
    res.send({ blockchain: blocks });
});

// Add new Block into BlockChain.
// Input Data: "name" and "amount"

app.post("/blockdata", (req, res) => {
    const { name, amount } = req.body;
    myBlockchain.addBlock(myBlockchain.lastBlock().index + 1, name, amount, null, null, null, myBlockchain.lastBlock().hash);
    res.send(myBlockchain.lastBlock().getBlock())
});


// POST raw JSON data that contains all Blocks

app.post("/blockchain", (req, res) => {
    const blockchain_json = req.body.blockchain;
    if (!Array.isArray(blockchain_json)) {
        return res.send("Blockchain not found");
    }
    const tempBlockChain = new BlockChain(4, MASTER_KEY);
    tempBlockChain.chain = [];
    for (let i = 0; i < blockchain_json.length; i++) {
    	const bchain = blockchain_json[i];
    	if(typeof bchain !== "object"){
    		return res.send("Blockchain not found");
    	}
        tempBlockChain.addBlock(bchain.index, bchain.name, bchain.amount, bchain.nonce, bchain.timestamp, bchain.hash, bchain.prevHash, false);
        if (!tempBlockChain.isValid(tempBlockChain.lastBlock())) {
            return res.send("BlockChain corrupt")
        }
    }
    res.send("Blocks Added:" + blockchain_json.length)

});


http.listen(port, () => {
    console.log(`Server running at port ` + port);

});