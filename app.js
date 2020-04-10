const { SHA256 } = require('crypto-js');

let difficulty = 3;
let hash = "0";
let nounce = 0;
//136923 0000
function hasher(){
	let start = Date.now()
	while (hash.substr(0, 3) != "123") {
	    hash = SHA256("This is a secret key " + nounce).toString();
	    nounce+=1;
	    console.log(nounce + "   " + hash);
	}
	let end = Date.now()
	console.log("hash complete at:"+ (end-start)/1000);
}
hasher();