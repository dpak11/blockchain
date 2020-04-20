# Blockchain (Decentralised)


A decentralised web application that distributes `blockchain` between individual users, and manages transaction records, thereby eliminating the need of a Server for storing Blockchain in any form.

> This is a work-in-progress BlockChain Web app that is currently in Phase-2 development stage.


### Phase-1 : 

- API to add individual blocks into block chain.

	> POST request to `http://localhost:3000/blockdata`

	Each block contains: block index, timestamp, `userdata`, [nonce(PoW)](https://www.bitcoinmining.com/what-is-proof-of-work), hash, previous block hash.

	`userdata` is an object that may contain any user defined data such as amount, id, name etc..

- API to fetch the latest blockchain from network.

	> GET request to `http://localhost:3000/blockchain`

- API to submit raw JSON data containing blockchain. Each of the submitted block is validated before attaching it to the main BlockChain

	> POST request to `http://localhost:3000/blockchain`


### Phase-2 : 

- Create a Queue containing pending transactions(userdata) that needs to be mined and sequentially added to BlockChain.

- Maintain a database(MongoDB) containing `email id` of registered BlockChain users.

- Manage individual blockchain users using hash verification.


### Phase-3 :

1) Decentralisation using Socket.IO

2) For Developers: A piece of Code that needs to be added into the website of the client/user inorder to receive and transmit latest blockchain.

3) Registered Users should be able to manually download a copy of latest BlockChain on clicking a button. This is not required if (2) is implemented on the Client side

4) Registered Users should also be able to upload the BlockChain into the Network. This is not required if (2) is implemented on the Client side
