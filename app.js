
const BlockChain = require("./blockchain");

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


let myBlockchain = new BlockChain(4);

for(let i=0;i<4;i++){
	/*if(!myBlockchain.addBlock(`My block: ${Math.random()*10000000}`, i*20)){
		return 
	}*/
	//myBlockchain.addBlock(`My block: ${Math.random()*10000000}`, i*20);
}


/*myBlockchain.chain.forEach((block) => {
	console.log(block.getBlock());
})*/



app.get("/blockchain", (req, res) => {
	let blocks = [];
	myBlockchain.chain.forEach((block) => {
		blocks.push(block.getBlock());
	})
	res.send(blocks);
});

app.post("/blockdata", (req, res) => {
	const {name, amount} = req.body;
	myBlockchain.addBlock(name,amount);
	res.send(myBlockchain.lastBlock().getBlock())
});





http.listen(port, () => {
    console.log(`Server running at port ` + port);

});

