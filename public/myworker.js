document.write("Mining the String: 'This is a test String!!'")

var timer = 0;
var interval;
if (window.Worker) {	
    var myWorker = new Worker('webworker.js');
    myWorker.postMessage("This is a test String");
    myWorker.onmessage = function(e) {
        document.write("<br><br>Mining complete for the String: 'This is a test String!!'");
        document.write("<br>Hashes Total: "+e.data.iterations+"<br>Final Hash: "+e.data.hashed)        
        clearInterval(interval);
    }
    interval = setInterval(function(){
    	timer++;
    	document.write("<br>Hashing in progress: "+timer+" seconds");
    },1000)
}