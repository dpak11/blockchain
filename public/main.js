const loginBtn = document.querySelector("#signin");
const registerBtn = document.querySelector("#register");
const authenticateUser = document.querySelector("#authenticateUser");
const userTransaction = document.querySelector("#userTransaction");
const labelText = document.querySelector("label[for=UserEmail]");
let socket = null;


registerBtn.addEventListener("click", function (e) {
  labelText.textContent = "User Email:";
});

loginBtn.addEventListener("click", function (e) {
  labelText.textContent = "User ID:";
});


userTransaction.addEventListener("submit", function (e) {
  e.preventDefault();
  submitTransactionData();  
});


authenticateUser.addEventListener("submit", function (e) {
  e.preventDefault();
  const email = authenticateUser.UserEmail.value;
  const password = authenticateUser.UserPswd.value;
  const registerBtn = document.getElementById("register");
  let restUrl = "../login";
  let data = { userid: email, email, password };
  if (registerBtn.checked) {
    restUrl = "../register";
  }
  if (email.trim() !== "" && password.trim() !== "") {
    authSubmitForm(data, restUrl);
  } else {
    alert("Field(s) are empty");
  }
});


const showMessage = {
  text(elt, msg) {
    document.querySelector(elt).textContent = msg;
  },
  html(elt, msg) {
    document.querySelector(elt).innerHTML = msg;
  }
};

const checkTokenValidity = async () => {
  const postToken = await fetch("../checktoken/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const response = await postToken.json();
  if (response.status == "valid") {
    showMessage.text("#statusmsg", "You are logged In");
    authenticateUser.remove();
    initSocket();
  } else if (response.status == "multiple_login") {
    alert("Duplicate logIn detected");
  } else {
    sessionStorage.removeItem("token");
  }
};

const submitTransactionData = async () => {
  const submitData = await fetch("../blockdata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userid: userTransaction.UserID.value,
      amount: userTransaction.amount.value,
      token: sessionStorage.getItem("token")
    })
  });
  const response = await submitData.json();
  if (response.status == "done") {
    userTransaction.reset();
    showMessage.html("#statusmsg", response.message);
    showMessage.text("#pendings", "Pending Transactions: " + response.remaining);
    document.getElementById("UserID").focus();
  } else {
    alert(response.status);
  }
}

const authSubmitForm = async (payload, restUrl) => {
  const authSubmit = await fetch(restUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const response = await authSubmit.json();
  if (response.status == "done") {
    sessionStorage.setItem("token", response.token);
    let txtMsg = "";
    if (restUrl.includes("register")) {
      txtMsg = `Generated User ID is: ${response.userID}.  Token saved successfuly!`;
    } else {
      txtMsg = "You have successfuly logged In";
    }
    
    showMessage.text("#statusmsg", txtMsg);
    authenticateUser.remove();
    initSocket();
  } else if (response.status == "multiple_login") {
    alert("Duplicate logIn detected");
  } else {
    alert(response.status);
  }
    
}

const showUsersList = (users) => {
  const allUsers = document.getElementById("allUsers");
  let html = ``;
  const uid = document.getElementById("userIdTxt").getAttribute("uid");
  users.forEach(user => {
    const class_name = (uid === user.user_id) ? "disabled" : ""; 
    html += `<p class="${class_name}">${user.user_id}</p>`;
  });
  allUsers.innerHTML=html;
  showMessage.text("#total-users", "Total Connected Users: " + users.length);
  pickUserOnClick(allUsers.querySelectorAll("p"), uid);

}

const pickUserOnClick = (usersLink, id) => {  
  usersLink.forEach(user => {
    user.addEventListener("click", function(e){
      const selected = e.target.textContent;
      if(selected != id){
        userTransaction["UserID"].value=selected
      }
    })
  });

}



function uploadBlockChainFile(file) {
  let reader = new FileReader();
  reader.onload = function (event) {
    let contents = JSON.parse(event.target.result);
    console.log(contents);
    socket.emit("blockchainUpload", {
      clientBlockChain: contents,
      token: sessionStorage.getItem("token"),
    });
  };

  reader.readAsText(file);
}


function insertTransactionFields() {
  const formDiv = document.createElement("div");
  const formElts = `<p id="balance-amt"></p><p>
            <label for="UserID">User ID:</label><input type="text" id="UserID">
        </p>
        <p>
            <label for="amount">Amount:</label><input type="text" id="amount">
        </p>
        <br><br>
        <input type="submit" value="Submit">`;
  formDiv.innerHTML = formElts;
  userTransaction.appendChild(formDiv);
}

function insertUploadButton() {
  const paraElt = document.createElement("p");
  paraElt.innerHTML = `<input type="file" id="uploadFile" accept="text/plain" />
        <label for="uploadFile">Upload Blockchain</label>`;
  document.body.appendChild(paraElt);
  const blockchainUpload = document.getElementById("uploadFile");
  blockchainUpload.addEventListener("change", function (evt) {
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
    paraElt.querySelector("a").addEventListener("click",(e) => {
      downloadLink.classList.remove("show-dot");
    })
    downloadLink = document.getElementById("bc_download");
  }
  downloadLink.classList.add("show-dot");
  return downloadLink;
}


function initSocket() {
  socket = io();
  socket.on("ConnectedUsers", (connUsers) => {       
    if(connUsers.mode == "new"){
      insertTransactionFields();
      insertUploadButton();            
      showMessage.text("#userIdTxt", "Welcome, User(" + connUsers.id + ")");
      showMessage.text("#balance-amt", "Balance Amount: "+connUsers.balanceAmt);
      document.getElementById("userIdTxt").setAttribute("uid",connUsers.id);      
    }
    showUsersList(connUsers.total);
    
  });

  socket.on("latestBlockChain", (latest) => {
    const blockchainString = JSON.stringify(latest.bchain);
    const bcFile = new Blob([blockchainString], { type: "text/plain" });
    const downloader = getDownloadLink();
    downloader.href = URL.createObjectURL(bcFile);
    downloader.download = "blockchain.text";
    showMessage.text("#pendings", "Pending Transactions: " + latest.remaining);   
  });

  socket.on("uploadRejected", (errorStatus) => {
    alert(errorStatus);
  });

  socket.emit("addToUserList", { token: sessionStorage.getItem("token") });
}

const token = sessionStorage.getItem("token") || null;
if (token) checkTokenValidity();
