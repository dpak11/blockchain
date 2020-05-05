# Blockchain (Decentralised)


A decentralised web application that distributes `blockchain` between individual users, and manages transaction records, thereby eliminating the need of a Server for storing Blockchain, transaction details in any form.

> This is a work-in-progress that is currently in Phase-2 stage.


### Phase-1 : 

- API to add transaction into block chain.

	> POST request to `http://localhost:3000/blockdata`


	![Post blockdata API example](git_images/blockdata.jpg)

	User Input will contain `amount, name, token` (token is generated during Login, registeration process, refer Phase-2 below).

	This will generate individual block that will have `block index`, `timestamp`, `user data`, [nonce(PoW)](https://www.bitcoinmining.com/what-is-proof-of-work), `hash`, `previousHash`.

- API to fetch latest blockchain from network.

	> GET request to `http://localhost:3000/blockchain`

- API to submit raw JSON data containing blockchain. Each of the block is validated before attaching it to the main BlockChain

	> POST request to `http://localhost:3000/blockchain?token={insert token here}`

	![Post blockchain API example](git_images/blockchain.jpg)

	In the above example we tried to POST raw JSON data containing blockchain. After validating all 3 individual blocks from JSON (but only the first 2 is visible in screenshot), it gets added to the main blockchain in the network.

	

	



### Phase-2 : 

- Maintain a Queue(array) containing pending transactions(user data) that will be minded sequentially and added to blockchain.

	To view all pending transactions:

	> GET request to `http://localhost:3000/transactions`

- API for User Registeration:

	> POST request to `http://localhost:3000/register`

	![User Register API example](git_images/register.jpg)

	User input should contain email address and password. In response, you should receive an unique user ID along with a token


- API for User LogIn:

	> POST request to `http://localhost:3000/login`


	![User Login API example](git_images/login.jpg)

	
	API input will contain User ID and password. This User ID that was generated during registeration process.
	If verification is successful, you will receive a token




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

2) Inside the new directory, Open Windows Power Shell / Command prompt and run the command `npm install`.

3) After installation is complete, run the command `npm start`.

4) Use a Rest API tool such as [Postman](https://www.postman.com) to test following API's:

	- First, Register with email ID and password

		> POST `localhost:3000/register`

	- Next, post data: `amount` and `name` along with token

		> POST `localhost:3000/blockdata`

	- You can check transaction status at:

		> GET `http://localhost:3000/transactions`

	- Once your transaction is complete and added to blockchain, you can check updated blockchain at:

		> GET `localhost:3000/blockchain`
