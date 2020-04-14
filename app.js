
const BlockChain = require("./blockchain");


let myBlockchain = new BlockChain(5);
//myBlockchain.createGenesis();

myBlockchain.addBlock("this is second", 2020);
myBlockchain.addBlock("this is third block", 300);
myBlockchain.addBlock("Fourth block", 40000);
console.log(myBlockchain.chain);