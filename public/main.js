let socket = null;
const form = document.querySelector("form");
const token = localStorage.getItem("token") || null;
if (token) {
    fetch("../checktoken/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
        .then(data => data.json())
        .then((res) => {
            if (res.status == "valid") {
                form.remove();
                document.getElementById("statusmsg").textContent = "You are logged In"
            }
            if (res.status.includes("expired!")) {
                console.log("expired");
                localStorage.removeItem("token")
            }
        })
}

form.addEventListener("submit", function(e) {
    e.preventDefault();
    const email = form.UserEmail.value;
    const password = form.UserPswd.value;
    const registerBtn = document.getElementById("register");
    let valid = true;
    let restUrl = "../login";
    let payload = { userid: email, email, password }
    if (registerBtn.checked) {
        restUrl = "../register";

    }
    if (email.trim() == "" || password.trim() == "") {
        valid = false;
    }
    if (valid) {
        fetch(restUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
            .then(data => data.json())
            .then((res) => {
                if (res.status == "done") {
                    form.remove();
                    localStorage.setItem("token", res.token);
                    let txtMsg = "";
                    if (restUrl.includes("register")) {
                        txtMsg = `Generated User ID is: ${res.userID}.  Token saved successfuly!`
                    } else {
                        txtMsg = "You have successfuly logged In"
                    }
                    document.getElementById("statusmsg").textContent = txtMsg;
                    initSocket(res.userID);
                } else {
                    alert(res.status)
                }

            });
    } else {
        alert("Field(s) are empty")
    }


});


function initSocket(userid = null) {
    socket = io();
    socket.emit('addToUserList', userid);
    socket.on('ConnectedUsers', (usersNum) => {
        document.getElementById("total-users").textContent = usersNum;
    });

}

