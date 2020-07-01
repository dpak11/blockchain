const BlockChain = require("./modules/blockchain");
const tokenManager = require("./modules/tokenManager");
const KEYS = require("./keys");
const { SHA256 } = require('crypto-js');
const express = require('express');
const { Worker } = require('worker_threads')
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const MASTER_KEY = KEYS.masterKey;
const DIFFICULTY = 4;
const DUMMY_DB = []; // for testing

let transactionList = [];
let auto_id = 0;
let miningActive = false;


// Socket Handling - Decentralize 

io.on('connection', (socket) => {
    console.log('New socket connection', socket.id);
    /*if (!io.sockets.mainBlockChain) {
        io.sockets.mainBlockChain = BlockChain(DIFFICULTY, MASTER_KEY);
    }*/
    if (!io.sockets.connected_bchain_users) {
        io.sockets.connected_bchain_users = [];
    }
        
    socket.on("addToUserList", (user_id) => {
        console.log("addToUserList:"+user_id);        
        io.sockets.connected_bchain_users.push({user_id,sockedID: socket.id});
        console.log(io.sockets.connected_bchain_users);
        socket.emit("ConnectedUsers", io.sockets.connected_bchain_users.length);
    });

    socket.on('blockChainConnect', (data) => {
        const tokenState = validateToken(data.token);
        if (!tokenState.includes("Error:")) {
            if (data.clientBlockChain) {
                const blockchainUpdate = updateLatestBlockChain(data.clientBlockChain)
                if (blockchainStatus.includes("Error:") || blockchainStatus.includes("Warning:")) {
                    socket.emit("statusFail", blockchainUpdate);
                } else {
                    socket.broadcast.emit("shareUpdatedBlockChain", getBlockChain());
                }

            }
        } else {
            socket.emit("statusFail", tokenState);
        }

    });
    socket.on('disconnect', () => {
        io.sockets.connected_bchain_users = io.sockets.connected_bchain_users.filter(conUser => conUser.sockedID !== socket.id);
        console.log("disconnected:"+socket.id);
        console.log(io.sockets.connected_bchain_users)
    });

});



// User Registeration
app.post("/register", (req, res) => {
    const { email, password } = req.body;
    const isEmailValid = (/(^[.a-z0-9_\-]{3,30})@[a-z]{3,15}\.(com|in|co.in|org|net)$/).test(email);
    if(!isEmailValid){
       return res.json({status:"Email Invalid"}) 
    }
    if (DUMMY_DB.some(user => user.email == email)) {
        return res.json({status:"Email id is already registered."})
    }
    const hashedPass = SHA256(password).toString();
    const userID = NEW_USER.getID();
    const mytoken = tokenManager.createToken(userID);
    DUMMY_DB.push({ email: email, pass: hashedPass, id: userID });
    return res.json({ status: "done", userID, token: mytoken, tokenValidity: tokenManager.getExpiry() });

});


// User Login
app.post("/login", (req, res) => {
    const { userid, password } = req.body;
    if (!DUMMY_DB.some(user => user.id == userid)) {
        return res.json({status:"Sorry, ID not registered"})
    }
    const hashedPass = SHA256(password).toString();
    if (!DUMMY_DB.some(user => (user.id == userid && user.pass == hashedPass))) {
        return res.json({status:"Sorry, invalid ID/password combination"})
    }
    if(isDuplicateUser(userid)){
        return res.json({status:"multiple_login"})
    }
    const mytoken = tokenManager.createToken(userid);
    return res.json({ status:"done", token: mytoken, tokenValidity: tokenManager.getExpiry() });

});

app.post("/checktoken", (req, res) => {    
    const tokenState = validateToken(req.body.token);
    if(tokenState.includes("Error:")){
        return res.json({status:tokenState})
    }    
   console.log("Connected Users:");
   console.log(io.sockets.connected_bchain_users);
   const tokenUser = tokenManager.readToken(req.body.token);
   if(isDuplicateUser(tokenUser.userid)){
        return res.json({status:"multiple_login"})
   }   
    return res.json({status:"valid",user:tokenUser.userid})    

});

function isDuplicateUser(userid){
    if(io.sockets.connected_bchain_users){
        const existingUser = io.sockets.connected_bchain_users.filter(connected => connected.user_id == userid);
        if(existingUser.length){
            return true
        }
   }
   return false
}


// Show all Blocks in a BlockChain
function getBlockChain() {
    const main_blockChain = io.sockets.mainBlockChain.get();
    let blocks = main_blockChain.map((block) => {
        return block.get();
    });
    return { blockchain: blocks }
}


app.get("/transactions/", (req, res) => {
    if (transactionList.length == 0) {
        return res.send("No pending transactions")
    }

    return res.send("User ID is missing:\nlocalhost:3000/transactions/{userid}");
});


// List all pending transactions
app.get("/transactions/:userid", (req, res) => {
    if (transactionList.length == 0) {
        return res.send("No pending transactions")
    }
    getPendingTransactions(req.params.userid, res);

});




// Add new transaction Block into BlockChain with 'name' and 'amount' as transaction inputs
app.post("/blockdata", (req, res) => {
    const { name, amount, token } = req.body;
    const tokenUser = tokenManager.readToken(token);
    if (tokenUser.error) {
        return res.send(tokenUser.error)
    }

    if (!DUMMY_DB.some(user => user.id == tokenUser.userid)) {
        return res.send("Sorry, Invalid User")
    }

    if (!name || !amount) {
        return res.send("Required 'name', 'amount'");
    }

    auto_id++;
    transactionList.push({
        id: auto_id,
        userid: tokenUser.userid,
        data: { name, amount }
    });
    return res.send("Your Transaction is added to Queue. Transaction ID is: " + auto_id + "\nView all pending transactions at 'localhost:3000/transactions'\nView BlockChain for completed transactions at 'localhost:3000/blockchain'");


});




function validateToken(token) {
    if (!token) {
        return "Error: Token is missing"
    }

    const tokenUser = tokenManager.readToken(token);
    if (tokenUser.error) {
        return "Error: " + tokenUser.error
    }
    if (!DUMMY_DB.some(user => user.id == tokenUser.userid)) {
        return "Error: Sorry, Invalid User"
    }
    
    return "OK";
    
}


function getPendingTransactions(userid, resp) {
    let queueIndex = [];
    let pendingTransactions = transactionList.filter((transaction, i) => {
        if (transaction.userid == userid) {
            queueIndex.push(i);
            return true
        }
        return false
    });

    resp.json({ allUsersTransactions_pending: transactionList.length, currentUser_queueNumber: queueIndex[0], currentUserPending: pendingTransactions });

}

function updateLatestBlockChain(block_chain_json) {
    if (!Array.isArray(block_chain_json)) {
        return "Error: Blockchain not found"
    }
    const tempBlockChain = BlockChain(DIFFICULTY, MASTER_KEY);
    tempBlockChain.clear();

    for (let i = 0; i < block_chain_json.length; i++) {
        const bchain = block_chain_json[i];
        if (typeof bchain !== "object") {
            return "Error: Invalid Blockchain";
        }
        if (!bchain.hash || typeof bchain.prevHash == "undefined" || !bchain.timestamp || typeof bchain.nonce == "undefined") {
            return "Error: Invalid Blockchain";
        }

        let userData = { name: bchain.user_data.name, amount: bchain.user_data.amount };
        tempBlockChain.addBlock(bchain.index, userData, bchain.nonce, bchain.timestamp, bchain.hash, bchain.prevHash, false); // Mining is set to FALSE
        if (!tempBlockChain.isValid(tempBlockChain.lastBlock())) {
            return "Error: Invalid Blockchain"
        }
    }

    if (io.sockets.mainBlockChain.get().length < tempBlockChain.get().length) {
        if (miningActive) {
            return "Warning: Mining is in progress. Can not accept BlockChain now"
        }
        io.sockets.mainBlockChain = tempBlockChain;
        return tempBlockChain.get().length + " Blocks Added to BlockChain successfuly "
    }
    return "Warning: Your copy of blockchain is not the latest"
}

async function doTransactions() {
    console.log("transaction processing for ID: " + transactionList[0].id);
    const new_block = await processBlockChain();
    const { index, user_data, nonce, timestamp, hash, prevHash } = new_block.updated;
    io.sockets.mainBlockChain.addBlock(index, user_data, nonce, timestamp, hash, prevHash, false); // Mining is set to FALSE    
    transactionList.splice(0, 1);
    miningActive = false;
    console.log("Block Added");
    return;

}

function processBlockChain() {
    miningActive = true;
    let lastBlock = io.sockets.mainBlockChain.lastBlock().get();
    return new Promise((resolve, reject) => {
        const worker = new Worker('./worker.js', { workerData: { blockIndex: lastBlock.index + 1, lastBlockHash: lastBlock.hash, transactionData: transactionList[0].data, difficultyLevel: DIFFICULTY, MASTER_KEY } });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        })
    })
}


const NEW_USER = {
    generate: function() {
        let id = "";
        for (let i = 0; i < 8; i++) {
            id = `${id}${Math.floor(Math.random()*10)}`;
        }
        id = id.substr(0,4)+"-"+id.substr(4)
        return id;
    },
    getID: function() {
        let newID = this.generate();
        if (DUMMY_DB.some(user => user.userid == newID)) {
            this.get();
        } else {
            return newID;
        }
    }

};

let queueInterval = setInterval(function() {
    if (transactionList.length > 0 && !miningActive) {
        doTransactions();
    }
}, 1000);


app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
})

http.listen(3000, () => {
    console.log(`Server running at port 3000 `);

});