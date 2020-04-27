const { workerData, parentPort } = require('worker_threads');
const BlockChain = require("./blockchain");

console.log("service thread...");
const newBlockChain = BlockChain(workerData.difficultyLevel, workerData.MASTER_KEY);
newBlockChain.addBlock(workerData.blockIndex, workerData.transactionData, null, null, null, workerData.lastBlockHash);

parentPort.postMessage({ updated: newBlockChain.lastBlock().get() })
