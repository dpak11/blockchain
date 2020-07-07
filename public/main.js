const loginBtn = document.querySelector("#signin");
const registerBtn = document.querySelector("#register");
const authenticateUser = document.querySelector("#authenticateUser");
const userTransaction = document.querySelector("#userTransaction");
const labelText = document.querySelector("label[for=UserEmail]");
let socket = null;

const token = sessionStorage.getItem("token") || null;
if (token) {
    fetch("../checktoken/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
        .then(data => data.json())
        .then((res) => {
            if (res.status == "valid") {
                document.getElementById("statusmsg").textContent = "You are logged In";
                authenticateUser.remove();
                initSocket();
            } else if (res.status == "multiple_login") {
                alert("Duplicate logIn detected");
            } else {
                sessionStorage.removeItem("token")
            }

        })
}

registerBtn.addEventListener("click", function(e) {
    labelText.textContent = "User Email:";
});

loginBtn.addEventListener("click", function(e) {
    labelText.textContent = "User ID:";
})

authenticateUser.addEventListener("submit", function(e) {
    e.preventDefault();
    const email = authenticateUser.UserEmail.value;
    const password = authenticateUser.UserPswd.value;
    const registerBtn = document.getElementById("register");
    let restUrl = "../login";
    let payload = { userid: email, email, password }
    if (registerBtn.checked) {
        restUrl = "../register";

    }
    if (email.trim() !== "" && password.trim() !== "") {
        authSubmitForm(payload, restUrl)
    } else {
        alert("Field(s) are empty")
    }
});

userTransaction.addEventListener("submit", function(e) {
    e.preventDefault();
    const payload = {
        name: userTransaction.personName.value,
        amount: userTransaction.amount.value,
        token: sessionStorage.getItem("token")
    };

    fetch("../blockdata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(data => data.json())
        .then((res) => {
            if (res.status == "done") {
                document.getElementById("statusmsg").innerHTML = res.message;
                userTransaction.reset();
            } else {
                alert(res.status)
            }
        });

});


function uploadBlockChainFile(file) {
    let reader = new FileReader();
    reader.onload = function(event) {
        let contents = JSON.parse(event.target.result);
        console.log(contents);
        socket.emit('blockchainUpload', { clientBlockChain: contents, token: sessionStorage.getItem("token") });
    };

    reader.readAsText(file);

}


function authSubmitForm(payload, restUrl) {
    fetch(restUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(data => data.json())
        .then((res) => {
            if (res.status == "done") {
                sessionStorage.setItem("token", res.token);
                let txtMsg = "";
                if (restUrl.includes("register")) {
                    txtMsg = `Generated User ID is: ${res.userID}.  Token saved successfuly!`
                } else {
                    txtMsg = "You have successfuly logged In"
                }
                authenticateUser.remove();
                document.getElementById("statusmsg").textContent = txtMsg;
                initSocket();
            } else {
                alert(res.status)
            }

        });
}

function insertTransactionFields() {
    const formDiv = document.createElement("div");
    const formElts = `<p>
            <label for="personName">Name:</label><input type="text" id="personName">
        </p>
        <p>
            <label for="amount">Amount:</label><input type="text" id="amount">
        </p>
        <br><br>
        <input type="submit" value="Send Amount">`;
    formDiv.innerHTML = formElts;
    userTransaction.appendChild(formDiv)

}

function insertUploadButton() {
    const paraElt = document.createElement("p");
    paraElt.innerHTML = `<input type="file" id="uploadFile" accept="text/plain" />
        <label for="uploadFile">Upload Blockchain</label>`;
    document.body.appendChild(paraElt);
    const blockchainUpload = document.getElementById("uploadFile");
    blockchainUpload.addEventListener("change", function(evt) {
        uploadBlockChainFile(evt.target.files[0]);
    });

    console.log("inserted uploader button");

}


function getDownloadLink() {
    let downloadLink = document.getElementById("bc_download");
    if (!downloadLink) {
        const paraElt = document.createElement("p");
        paraElt.innerHTML = `<a id="bc_download" href="" download="blockchain">Download Blockchain</a>`;
        document.body.appendChild(paraElt);
        downloadLink = document.getElementById("bc_download")
    }
    return downloadLink;

}


function initSocket() {
    socket = io();
    socket.on('ConnectedUsers', (usersNum) => {
        document.getElementById("total-users").textContent = "Users: " + usersNum;
        insertTransactionFields();
        insertUploadButton();
    });
    socket.on('latestBlockChain', (latest) => {
        const blockchainString = JSON.stringify(latest.bchain);       
        const bcFile = new Blob([blockchainString], { type: "text/plain" });
        const downloader = getDownloadLink();
        downloader.href = URL.createObjectURL(bcFile);
        downloader.download = "blockchain.text";
        document.getElementById("pendings").textContent = " / Pending Transactions: " + latest.remaining;
        document.getElementById("total-users").textContent = "Users: " + latest.users;
        alert("Received New BlockChain.")

    });
    socket.on("uploadRejected", (errorStatus) => {
        alert(errorStatus);
    });

    socket.emit('addToUserList', { token: sessionStorage.getItem("token") });

}