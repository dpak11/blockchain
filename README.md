# Blockchain (Decentralised)


A decentralised web application that distributes `blockchain` between individual users, and manages transaction records, thereby eliminating the need of a Server for storing Blockchain in any form.

> This is a work-in-progress BlockChain Web app that is currently in Phase-2 development stage.


### Phase-1 : 

- API to add individual blocks into block chain.

	> POST request to `http://localhost:3000/blockdata`

	Each block contains: block index, timestamp, `userdata`, [nonce(PoW)](https://www.bitcoinmining.com/what-is-proof-of-work), hash, previous block hash.

	`userdata` is an object that may contain username(or userid), amount, etc..

- API to List all blockchains

	> GET request to `http://localhost:3000/blockchain`

- API to POST raw JSON data containing all the blocks. Each block is validated before attaching to the main BlockChain

	> POST request to `http://localhost:3000/blockchain`


### Phase-2 : 

- Create a Queue containing pending transactions(userdata) that needs to be mined (PoW) and added to BlockChain.

- Maintain a database(MongoDB) containing `email id` of registered BlockChain users.

- Manage individual blockchain users using hash verification.


### Phase-3 :

1) Decentralisation using Socket.IO

2) For Javascript Developers: A Code block that needs to be added(integrated) into the website of the user(developer) that will automatically receive and transmit latest copy of blockchain.

3) For Non-developers: Registered Users should be able to manually download a copy of latest BlockChain on click of a button. This is not required if (2) is implemented

4) For Non-developers: Registered Users should also be able to upload the BlockChain into the Network. This is not required if (2) is implemented
