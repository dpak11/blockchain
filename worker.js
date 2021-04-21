const { workerData, parentPort } = require('worker_threads');
const BlockChain = require("./modules/blockchain");

console.log("Worker thread. Mining initiated....");
const newBlockChain = BlockChain(workerData.difficultyLevel, workerData.MASTER_KEY);
newBlockChain.addBlock(workerData.blockIndex, workerData.transactionData, null, null, null, workerData.lastBlockHash);

parentPort.postMessage({ updated: newBlockChain.lastBlock().get() })
