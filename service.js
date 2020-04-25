const { workerData, parentPort } = require('worker_threads');
const BlockChain = require("./blockchain");
//console.log(workerData);
console.log("service thread...");
const newBlockChain = BlockChain(workerData.difficultyLevel, workerData.MASTER_KEY);
newBlockChain.addBlock(workerData.blockIndex, workerData.transactionData, null, null, null, workerData.lastBlockHash);
/*
console.log("Service------");
console.log(newBlockChain.lastBlock().get())*/

//block_chain.addBlock(block_chain.lastBlock().index + 1, workerData.transactionData, null, null, null, block_chain.lastBlock().hash);
parentPort.postMessage({ updated: newBlockChain.lastBlock().get() })
