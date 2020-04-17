# Blockchain (Decentralised)


> This is a work in progress BlockChain application which is in Phase-1 of development.

Aim is to build a decentralised application by distributing the `blockchain` between individual users, and thereby eliminating the need of a Server for storing Blockchain in any form.


### Phase-1 : 

- Add individual blocks into block chain.

	> POST request to `http://localhost:3000/blockdata`

	Each block contains: block index, timestamp, `userdata`, proof of work(nonce), hash, previous block hash.

	`userdata` is an object that may contain username(or userid), amount, etc..

- List all blockchains

	> GET request to `http://localhost:3000/blockchain`

- Send raw JSON data containing all the blocks. Each block is validated before adding it to the main BlockChain

	> POST request to `http://localhost:3000/blockchain`


### Phase-2 : (Tentative)

- Create a Queue containing new transactions(userdata) that needs to be mined (PoW).

- Maintain a database(MongoDB) containing registered BlockChain users email id.

- Manage individual blockchain users using hash verification (User password + Server Master Key).


### Phase-3 :

Decentralisation using Socket.IO


