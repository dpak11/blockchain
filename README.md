# Blockchain - Decentralised


> This is a work in progress BlockChain application which is in Phase-1 of development.

Aim is build a decentralised application by distributing the `blockchain` between individual users, and thereby eliminating the need of a Server for storing Blockchain in any form.


### Phase-1 : 

- Add individual blocks into block chain.

	> POST request to `http://localhost:3000/blockdata`

- List all blockchains

	> GET request to `http://localhost:3000/blockchain`

- Send raw JSON data containing all the blocks. Also validate the same.

	> POST request to `http://localhost:3000/blockchain`


### Phase-2 : (Tentative)

- Create a Queue for new transactions(block data) that is ready for mining (Proof of Work).

- Manage individual blockchain users using hash verification (User password + Server Master Key)


### Phase-3 :

Decentralisation using Socket.IO


