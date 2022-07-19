const BlockChain = require("./modules/blockchain");
const tokenManager = require("./modules/tokenManager");
const KEYS = require("./keys");
const { SHA256 } = require("crypto-js");
const express = require("express");
const { Worker } = require("worker_threads");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").Server(app);
const IOsocket = require("socket.io")(http);

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const MASTER_KEY = KEYS.masterKey;
const DIFFICULTY = 3;
const DUMMY_DB = []; // for testing
const USERID_FORMAT = /^[0-9]{4}-[0-9]{4}$/;
const INITIAL_AMOUNT =  5000;

let autoID = 0;
let miningActive = false;
let latestHash = "";

const NEW_USER = {
  getID() {
    let id = "";
    for (let i = 0; i < 8; i++) {
      id = `${id}${Math.floor(Math.random() * 10)}`;
    }
    id = id.substring(0, 4) + "-" + id.substring(4);
    return id;
  }
};

IOsocket.on("connection", (socket) => {
  console.log("New socket connection", socket.id);
  if (!IOsocket.sockets.mainBlockChain) {
    IOsocket.sockets.mainBlockChain = BlockChain(DIFFICULTY, MASTER_KEY);
  }
  if (!IOsocket.sockets.connected_bchain_users) {
    IOsocket.sockets.connected_bchain_users = [];
    IOsocket.sockets.transactionList = [];
  }

  socket.on("addToUserList", (user) => {
    const tokenUser = tokenManager.readToken(user.token);
    if (!tokenUser.error) {
      if (!isDuplicateUser(tokenUser.userid)) {
        IOsocket.sockets.connected_bchain_users.push({
          user_id: tokenUser.userid,
          sockedID: socket.id
        });

        const balanceAmt = DUMMY_DB.find((u) => u.id == tokenUser.userid).amt;       
        socket.emit("ConnectedUsers", {
          id: tokenUser.userid,
          total: IOsocket.sockets.connected_bchain_users.map(user => user.user_id),
          balanceAmt,
          mode:"new"
        });
        
        if(IOsocket.sockets.mainBlockChain.get().length>1){
          socket.emit("latestBlockChain", {
            bchain: getBlockChain(),
            remaining: IOsocket.sockets.transactionList.length
          });
        }
        socket.broadcast.emit("ConnectedUsers", {
          total: IOsocket.sockets.connected_bchain_users.map(user => user.user_id),
          mode:"update"
        });        
        console.log(IOsocket.sockets.connected_bchain_users);
      }
    }
  });

  socket.on("blockchainUpload", (data) => {
    const tokenState = validateToken(data.token);
    if (!tokenState.includes("Error:")) {
      if (data.clientBlockChain) {
        const blockchainUpdate = updateLatestBlockChain(data.clientBlockChain);
        if (blockchainUpdate.includes("Error:") || blockchainUpdate.includes("Alert:")) {
          socket.emit("uploadRejected", blockchainUpdate);
        } else {
          console.log(blockchainUpdate);
         // socket.broadcast.emit("shareBlockChain", getBlockChain());
        }
      }
    }
  });

  socket.on("disconnect", () => {
    IOsocket.sockets.connected_bchain_users = IOsocket.sockets.connected_bchain_users.filter(
      (conUser) => conUser.sockedID !== socket.id
    );
    socket.broadcast.emit("ConnectedUsers", {
      total: IOsocket.sockets.connected_bchain_users.map(user => user.user_id),
      mode:"update"
    }); 
    console.log("disconnected:" + socket.id);
  });
});

// User Registeration
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const isEmailValid = /(^[.a-z0-9_\-]{3,30})@[a-z]{3,15}\.(com|in|co.in|org|net)$/.test(email);
  if (!isEmailValid) {
    return res.json({ status: "Email Invalid" });
  }
  if (DUMMY_DB.some((user) => user.email == email)) {
    return res.json({ status: "Email id is already registered." });
  }
  const hashedPass = SHA256(password).toString();
  const userID = NEW_USER.getID();
  const mytoken = tokenManager.createToken(userID);
  DUMMY_DB.push({ email: email, pass: hashedPass, id: userID, amt:INITIAL_AMOUNT });
  return res.json({
    status: "done",
    userID,
    token: mytoken,
    tokenValidity: tokenManager.getExpiry()
  });
});

// User Login
app.post("/login", (req, res) => {
  const { userid, password } = req.body;
  if (!DUMMY_DB.some((user) => user.id == userid)) {
    return res.json({ status: "Sorry, ID not registered" });
  }
  const hashedPass = SHA256(password).toString();
  if (!DUMMY_DB.some((user) => user.id == userid && user.pass == hashedPass)) {
    return res.json({ status: "Sorry, invalid ID/password combination" });
  }
  if (isDuplicateUser(userid)) {
    return res.json({ status: "multiple_login" });
  }
  const mytoken = tokenManager.createToken(userid);
  return res.json({
    status: "done",
    token: mytoken,
    tokenValidity: tokenManager.getExpiry()
  });
});

app.post("/checktoken", (req, res) => {
  const tokenState = validateToken(req.body.token);
  if (tokenState.includes("Error:")) {
    return res.json({ status: tokenState });
  }
  console.log("Connected Users:");
  console.log(IOsocket.sockets.connected_bchain_users);
  const tokenUser = tokenManager.readToken(req.body.token);
  /*if (isDuplicateUser(tokenUser.userid)) {
    return res.json({ status: "multiple_login" });
  }*/
  return res.json({ status: "valid", user: tokenUser.userid });
});


app.get("/transactions/", (req, res) => {
  if (IOsocket.sockets.transactionList.length == 0) {
    return res.send("No pending transactions");
  }

  return res.send("User ID is missing:\nlocalhost:3000/transactions/{userid}");
});

// List all pending transactions
app.get("/transactions/:userid", (req, res) => {
  if (!IOsocket.sockets.transactionList || !IOsocket.sockets.transactionList.length) {
    return res.send("No pending transactions");
  }
  getPendingTransactions(req.params.userid, res);
});

// Add new transaction Block into BlockChain with 'userid' and 'amount' as transaction inputs
app.post("/blockdata", (req, res) => {
  const { userid, amount, token } = req.body;
  const tokenUser = tokenManager.readToken(token);
  if (tokenUser.error) {
    return res.json({ status: tokenUser.error });
  }
  if(isNaN(amount)) return res.json({ status: "Amount Invalid" });

  const thisUser = DUMMY_DB.find((user) => user.id === tokenUser.userid);
  if(!thisUser) return res.json({ status: "Sorry, Invalid User" });  

  if (!userid || !amount) {
    return res.json({ status: "Required UserID, Amount" });
  }

  
  if(USERID_FORMAT.test(userid)===false){
    return res.json({ status: "Enter a valid ID" });
  }  

  if(!DUMMY_DB.some((user) => user.id === userid)){
    return res.json({ status: "User ID does not exist" }); 
  }
  if(thisUser.amt - amount < 0) return res.json({ status: "Sorry, You have insufficient Balance" });

  autoID++;
  IOsocket.sockets.transactionList.push({
    id: autoID,
    userid: tokenUser.userid,
    data: { sender:tokenUser.userid, to: userid, amount }
  });

  return res.json({
    status: "done",
    balance: thisUser.amt - amount,
    remaining: IOsocket.sockets.transactionList.length,
    message: `Your Transaction is added to Queue # ${autoID} <br>View all pending transactions <a href='http://localhost:3000/transactions/${tokenUser.userid}' target='_blank'>here</a>`,
  });
});


function isDuplicateUser(userid) {
  if (IOsocket.sockets.connected_bchain_users) {
    const duplicate = IOsocket.sockets.connected_bchain_users.some((connected) => connected.user_id == userid);
    if (duplicate) return true;
  }
  return false;
}

// Show all Blocks in a BlockChain
function getBlockChain() {
  const main_blockChain = IOsocket.sockets.mainBlockChain.get();
  let blocks = main_blockChain.map((block) => {
    return block.get();
  });
  return { blockchain: blocks };
}

function validateToken(token) {
  if (!token) {
    return "Error: Token is missing";
  }

  const tokenUser = tokenManager.readToken(token);
  if (tokenUser.error) {
    return "Error: " + tokenUser.error;
  }
  if (!DUMMY_DB.some((user) => user.id == tokenUser.userid)) {
    return "Error: Sorry, Invalid User";
  }

  return "OK";
}

function getPendingTransactions(userid, resp) {
  let queueIndex = [];
  let pendingTransactions = IOsocket.sockets.transactionList.filter(
    (transaction, i) => {
      if (transaction.userid == userid) {
        queueIndex.push(i);
        return true;
      }
      return false;
    }
  );

  resp.json({
    allUsersTransactions_pending: IOsocket.sockets.transactionList.length,
    currentUser_queueNumber: queueIndex[0],
    currentUserPending: pendingTransactions,
  });
}

function validateClientBlocks(newBlocks){
  const blockChain_client = newBlocks;
  if (!Array.isArray(blockChain_client)) {
    return {error: "Error: Blockchain not found"};
  }
  const tempBlockChain = BlockChain(DIFFICULTY, MASTER_KEY);
  tempBlockChain.clear();
  let hashMatch = latestHash.length>10 ? false : true;

  for (let i = 0; i < blockChain_client.length; i++) {
    const bchain = blockChain_client[i];
    if (typeof bchain !== "object") {
      return {error: "Error: Invalid Blockchain"};
    }
    if (!bchain.user_data || !bchain.hash || typeof bchain.prevHash == "undefined" || !bchain.timestamp || typeof bchain.nonce == "undefined") {
      return {error: "Error: Invalid Blockchain"};
    }

    const userData = {
      sender: bchain.user_data.sender,
      to: bchain.user_data.to,
      amount: bchain.user_data.amount
    };
    
    tempBlockChain.addBlock(bchain.index, userData, bchain.nonce, bchain.timestamp,bchain.hash,bchain.prevHash,false); // Mining is set to FALSE
    if (!tempBlockChain.isValid(tempBlockChain.lastBlock())) {
      return {error: "Error: Invalid Blockchain"};
    }
    
    if(bchain.hash === latestHash){
      hashMatch = true;
    }
    
  }
  if(!hashMatch) return {error: "Error: Latest Hash Missing"};
  return {validated: tempBlockChain};
} 

function updateLatestBlockChain(block_chain_json) {
  const clientBlocks = validateClientBlocks(block_chain_json.blockchain)
  if(clientBlocks.error) return clientBlocks.error;

  const validatedBlocks = clientBlocks.validated.get();
  if (IOsocket.sockets.mainBlockChain.get().length == validatedBlocks.length) {
    return "Alert: Your copy of blockchain is already in Sync with Network";
  }

  if (IOsocket.sockets.mainBlockChain.get().length < validatedBlocks.length) {    
    if (miningActive) {
      return "Alert: Mining is in progress. Can not accept BlockChain now";
    }
    IOsocket.sockets.mainBlockChain = clientBlocks.validated;
    latestHash = validatedBlocks[validatedBlocks.length-1].get().hash;
    console.log("latest::",latestHash);
    return (
      validatedBlocks.length + " Blocks Added to BlockChain successfuly "
    );
  }

  return "Alert: Your copy of blockchain is not the latest";
}

async function processTransactions() {
  console.log(
    "transaction processing for Queue ID#" + IOsocket.sockets.transactionList[0].id
  );
  const new_block = await processBlockChain();
  const {index,user_data, nonce, timestamp, hash, prevHash} = new_block.updated;  
  IOsocket.sockets.mainBlockChain.addBlock(index, user_data, nonce,timestamp,hash, prevHash, false); // Mining is set to FALSE
  IOsocket.sockets.transactionList.splice(0, 1);
  latestHash = hash;
  miningActive = false;
  console.log("Block Added");
  updateBalanceAmount(user_data);  
  IOsocket.sockets.emit("latestBlockChain", {
    bchain: getBlockChain(),
    receive_id:user_data.to,
    remaining: IOsocket.sockets.transactionList.length    
  });
  if (IOsocket.sockets.transactionList.length == 0)
    console.log("All transactions done");
}

function processBlockChain() {
  miningActive = true;
  const lastBlock = IOsocket.sockets.mainBlockChain.lastBlock().get();
  return new Promise((resolve, reject) => {
    const worker = new Worker("./worker.js", {
      workerData: {
        blockIndex: lastBlock.index + 1,
        lastBlockHash: lastBlock.hash,
        transactionData: IOsocket.sockets.transactionList[0].data,
        difficultyLevel: DIFFICULTY,
        MASTER_KEY
      },
    });
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

const updateBalanceAmount =(transact) => {
  const payer = DUMMY_DB.find((user) => user.id == transact.sender);
  const payee = DUMMY_DB.find((user) => user.id == transact.to);
  payer.amt-= Number(transact.amount);
  payee.amt+=Number(transact.amount)
}



let queueInterval = setInterval(function () {
  if (IOsocket.sockets.transactionList) {
    if (IOsocket.sockets.transactionList.length && !miningActive) {
      processTransactions();
    }
  }
}, 1000);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

http.listen(3000, () => {
  console.log(`Server running at port 3000 `);
});
