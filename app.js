
const BlockChain = require("./blockchain");


let myBlockchain = new BlockChain(4);
//myBlockchain.createGenesis();

//myBlockchain.addBlock("this is second", 2020);
//myBlockchain.addBlock("this is third block", 300);
//myBlockchain.addBlock("Fourth block", 40000);
for(let i=0;i<5;i++){
	myBlockchain.addBlock(`My block: ${Math.random()*10000000}`, i*20);
}
console.log(myBlockchain.chain);