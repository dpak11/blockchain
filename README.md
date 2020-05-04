# Blockchain (Decentralised)


A decentralised web application that distributes `blockchain` between individual users, and manages transaction records, thereby eliminating the need of a Server for storing Blockchain, transaction details in any form.

> This is a work-in-progress application that is currently in Phase-2 stage.


### Phase-1 : 

- API to add transaction into block chain.

	> POST request to `http://localhost:3000/blockdata`

	Each block contains block index, timestamp, `user data`, [nonce(PoW)](https://www.bitcoinmining.com/what-is-proof-of-work), hash, previous block hash.

	`user data` is an object that may contain data such as amount, id, name, sender, receiver etc..

- API to fetch blockchain from network.

	> GET request to `http://localhost:3000/blockchain`

- API to submit raw JSON data containing blockchain. Each of the block is validated before attaching it to the main BlockChain

	> POST request to `http://localhost:3000/blockchain`


### Phase-2 : 

- Maintain a Queue(array) containing pending transactions(userdata) that will get minded sequentially.

	To view all pending transactions:

	> GET request to `http://localhost:3000/transactions`

- Maintain a database(MongoDB) containing `email id` of registered BlockChain users.

- Manage individual blockchain users using hash verification.


### Phase-3 :

1) Decentralisation using Socket.IO

2) For Developers: A piece of Code needs to be added into your website inorder to receive and transmit latest blockchain.

3) Registered Users should be able to manually download a copy of latest BlockChain on clicking a button. However, this is not required if (2) was implemented.

4) Registered Users should also be able to upload the BlockChain into the Network. However this is not required if (2) was implemented.


---

## To Test Blockchain:

1) Download or clone this repository into a new directory in your Local.

2) Inside the new directory, Open Windows Power Shell / Command panel and run the command `npm install`.

3) After installation is complete, run the command `npm start`.

4) Use a Rest API tool such as Postman to test following API's

	POST `localhost:3000/register`

	POST `localhost:3000/login`

	GET `http://localhost:3000/transactions`

	GET `localhost:3000/blockchain`

	POST `localhost:3000/blockchain?token={your_token_here}`

	POST `localhost:3000/blockdata`