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
const DIFFICULTY = 3;
const DUMMY_DB = []; // for testing

let auto_id = 0;
let miningActive = false;



io.on('connection', (socket) => {
    console.log('New socket connection', socket.id);
    if (!io.sockets.mainBlockChain) {
        io.sockets.mainBlockChain = BlockChain(DIFFICULTY, MASTER_KEY);
    }
    if (!io.sockets.connected_bchain_users) {
        io.sockets.connected_bchain_users = [];
        io.sockets.transactionList = [];
    }

    socket.on("addToUserList", (user) => {
        const tokenUser = tokenManager.readToken(user.token);
        if (!tokenUser.error) {
            if (!isDuplicateUser(tokenUser.userid)) {
                io.sockets.connected_bchain_users.push({ user_id: tokenUser.userid, sockedID: socket.id });
                socket.emit("ConnectedUsers", {id: tokenUser.userid, total:io.sockets.connected_bchain_users.length});
                socket.broadcast.emit("totalUsersCount",io.sockets.connected_bchain_users.length);
                console.log(io.sockets.connected_bchain_users);
            }
        }

    });

    socket.on('blockchainUpload', (data) => {
        const tokenState = validateToken(data.token);
        if (!tokenState.includes("Error:")) {
            if (data.clientBlockChain) {
                const blockchainUpdate = updateLatestBlockChain(data.clientBlockChain)
                if (blockchainUpdate.includes("Error:") || blockchainUpdate.includes("Alert:")) {
                    socket.emit("uploadRejected", blockchainUpdate);
                } else {
                    console.log(blockchainUpdate);                    
                    socket.broadcast.emit("shareUpdatedBlockChain", getBlockChain());
                }

            }
        } 

    });
    
    socket.on('disconnect', () => {
        io.sockets.connected_bchain_users = io.sockets.connected_bchain_users.filter(conUser => conUser.sockedID !== socket.id);
        socket.broadcast.emit("totalUsersCount",io.sockets.connected_bchain_users.length);
        console.log("disconnected:" + socket.id);
    });

});



// User Registeration
app.post("/register", (req, res) => {
    const { email, password } = req.body;
    const isEmailValid = (/(^[.a-z0-9_\-]{3,30})@[a-z]{3,15}\.(com|in|co.in|org|net)$/).test(email);
    if (!isEmailValid) {
        return res.json({ status: "Email Invalid" })
    }
    if (DUMMY_DB.some(user => user.email == email)) {
        return res.json({ status: "Email id is already registered." })
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
        return res.json({ status: "Sorry, ID not registered" })
    }
    const hashedPass = SHA256(password).toString();
    if (!DUMMY_DB.some(user => (user.id == userid && user.pass == hashedPass))) {
        return res.json({ status: "Sorry, invalid ID/password combination" })
    }
    if (isDuplicateUser(userid)) {
        return res.json({ status: "multiple_login" })
    }
    const mytoken = tokenManager.createToken(userid);
    return res.json({ status: "done", token: mytoken, tokenValidity: tokenManager.getExpiry() });

});

app.post("/checktoken", (req, res) => {
    const tokenState = validateToken(req.body.token);
    if (tokenState.includes("Error:")) {
        return res.json({ status: tokenState })
    }
    console.log("Connected Users:");
    console.log(io.sockets.connected_bchain_users);
    const tokenUser = tokenManager.readToken(req.body.token);
    if (isDuplicateUser(tokenUser.userid)) {
        return res.json({ status: "multiple_login" })
    }
    return res.json({ status: "valid", user: tokenUser.userid })

});

function isDuplicateUser(userid) {
    if (io.sockets.connected_bchain_users) {
        const existingUser = io.sockets.connected_bchain_users.filter(connected => connected.user_id == userid);
        if (existingUser.length) {
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
    if (io.sockets.transactionList.length == 0) {
        return res.send("No pending transactions")
    }

    return res.send("User ID is missing:\nlocalhost:3000/transactions/{userid}");
});


// List all pending transactions
app.get("/transactions/:userid", (req, res) => {
    if (!io.sockets.transactionList || !io.sockets.transactionList.length) {        
        return res.send("No pending transactions")
    }
    getPendingTransactions(req.params.userid, res);

});




// Add new transaction Block into BlockChain with 'name' and 'amount' as transaction inputs
app.post("/blockdata", (req, res) => {
    const { name, amount, token } = req.body;
    const tokenUser = tokenManager.readToken(token);
    if (tokenUser.error) {
        return res.json({ status: tokenUser.error })
    }

    if (!DUMMY_DB.some(user => user.id == tokenUser.userid)) {
        return res.json({ status: "Sorry, Invalid User" })
    }

    if (!name || !amount) {
        return res.json({ status: "Required name, amount" });
    }

    auto_id++;
    io.sockets.transactionList.push({
        id: auto_id,
        userid: tokenUser.userid,
        data: { name, amount }
    });

    return res.json({ status: "done", message: "Your Transaction is added to Queue #" + auto_id + "<br>View all pending transactions <a href='http://localhost:3000/transactions/" + tokenUser.userid + "' target='_blank'>here</a>" });

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
    let pendingTransactions = io.sockets.transactionList.filter((transaction, i) => {
        if (transaction.userid == userid) {
            queueIndex.push(i);
            return true
        }
        return false
    });

    resp.json({ allUsersTransactions_pending: io.sockets.transactionList.length, currentUser_queueNumber: queueIndex[0], currentUserPending: pendingTransactions });

}

function updateLatestBlockChain(block_chain_json) {
    const blockChain_client = block_chain_json.blockchain;
    if (!Array.isArray(blockChain_client)) {
        return "Error: Blockchain not found"
    }
    const tempBlockChain = BlockChain(DIFFICULTY, MASTER_KEY);
    tempBlockChain.clear();

    for (let i = 0; i < blockChain_client.length; i++) {
        const bchain = blockChain_client[i];
        if (typeof bchain !== "object") {
            return "Error: Invalid Blockchain";
        }
        if (!bchain.user_data || !bchain.hash || typeof bchain.prevHash == "undefined" || !bchain.timestamp || typeof bchain.nonce == "undefined") {
            return "Error: Invalid Blockchain";
        }

        let userData = { name: bchain.user_data.name, amount: bchain.user_data.amount };
        tempBlockChain.addBlock(bchain.index, userData, bchain.nonce, bchain.timestamp, bchain.hash, bchain.prevHash, false); // Mining is set to FALSE
        if (!tempBlockChain.isValid(tempBlockChain.lastBlock())) {
            return "Error: Invalid Blockchain"
        }
    }

    if(io.sockets.mainBlockChain.get().length == tempBlockChain.get().length){
        return "Alert: Your copy of blockchain is already in Sync with Network"
    }

    if (io.sockets.mainBlockChain.get().length < tempBlockChain.get().length) {
        if (miningActive) {
            return "Alert: Mining is in progress. Can not accept BlockChain now"
        }
        io.sockets.mainBlockChain = tempBlockChain;
        return tempBlockChain.get().length + " Blocks Added to BlockChain successfuly "
    }
    
    return "Alert: Your copy of blockchain is not the latest"
}

async function processTransactions() {
    console.log("transaction processing for Queue ID#" + io.sockets.transactionList[0].id);
    const new_block = await processBlockChain();
    const { index, user_data, nonce, timestamp, hash, prevHash } = new_block.updated;
    io.sockets.mainBlockChain.addBlock(index, user_data, nonce, timestamp, hash, prevHash, false); // Mining is set to FALSE    
    io.sockets.transactionList.splice(0, 1);
    miningActive = false;
    console.log("Block Added");
    io.sockets.emit("latestBlockChain", {
        bchain: getBlockChain(),
        remaining: io.sockets.transactionList.length,
        users: io.sockets.connected_bchain_users.length
    });
    if (io.sockets.transactionList.length == 0) console.log("All transactions done");

}

function processBlockChain() {
    miningActive = true;
    const lastBlock = io.sockets.mainBlockChain.lastBlock().get();
    return new Promise((resolve, reject) => {
        const worker = new Worker('./worker.js', { workerData: { blockIndex: lastBlock.index + 1, lastBlockHash: lastBlock.hash, transactionData: io.sockets.transactionList[0].data, difficultyLevel: DIFFICULTY, MASTER_KEY } });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        })
    });
}



const NEW_USER = {
    generate: function() {
        let id = "";
        for (let i = 0; i < 8; i++) {
            id = `${id}${Math.floor(Math.random()*10)}`;
        }
        id = id.substr(0, 4) + "-" + id.substr(4)
        return id;
    },
    getID: function() {
        let newID = this.generate();
        if (DUMMY_DB.some(user => user.userid == newID)) {
            this.getID();
        } else {
            return newID;
        }
    }

};

let queueInterval = setInterval(function() {
    if(io.sockets.transactionList){
        if (io.sockets.transactionList.length && !miningActive) {
            processTransactions();
        }
    }
    
}, 1000);


app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
})

http.listen(3000, () => {
    console.log(`Server running at port 3000 `);

});