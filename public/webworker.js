importScripts("forge.min.js");

onmessage = function(e) {
    var md = forge.md.sha256.create();
    var hashed = "";
    var iterations = 0;
    while(hashed.indexOf("0000") !== 0 || !hashed.includes("123")){
    	iterations++;
    	let txt = `${e.data}_${iterations}`;
        md.update(txt);
        hashed = md.digest().toHex();
    } 
    
	postMessage({iterations, hashed});
}