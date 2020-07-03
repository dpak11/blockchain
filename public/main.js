
const authenticateUser = document.querySelector("#authenticateUser");
const userTransaction = document.querySelector("#userTransaction");
const registerBtn = document.querySelector("#register");
const loginBtn = document.querySelector("#signin");
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
                initSocket(res.user);
            } else if (res.status == "multiple_login") {
                alert("Duplicate logIn detected");
            } else {
                sessionStorage.removeItem("token")
            }

        })
}

registerBtn.addEventListener("click", function(e) {
    labelText.textContent="User Email:";
});
loginBtn.addEventListener("click", function(e) {
    labelText.textContent="User ID:";
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
        submitForm(payload,restUrl)
    } else {
        alert("Field(s) are empty")
    }
});

userTransaction.addEventListener("submit", function(e) {
    e.preventDefault();
    const payload = {
        name:userTransaction.personName,
        amount:userTransaction.amount,
        token:sessionStorage.getItem("token")
    };

    
     fetch("../blockdata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    .then(data => data.json())
    .then((res) => {
        if(res.status=="done"){
            document.getElementById("statusmsg").textContent = res.message;
        }else{
            alert(res.status)
        }
    });
    


});

function submitForm(payload,restUrl){
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
            userTransaction.classList.remove("hide");
            document.getElementById("statusmsg").textContent = txtMsg;
            initSocket(res.userID);
        } else {
            alert(res.status)
        }

    });
}


function initSocket(userid) {
    socket = io();
    socket.emit('addToUserList', userid);
    socket.on('ConnectedUsers', (usersNum) => {
        document.getElementById("total-users").textContent = usersNum;
    });

}