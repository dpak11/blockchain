# Blockchain (Decentralised)


A decentralised web application that distributes `blockchain` between individual users, and manages transaction records, thereby eliminating the need of a Server for storing Blockchain, transaction details in any form.

> This is a work-in-progress that is currently in Phase-2 stage.


### Phase-1 : 

1) API to add transaction into block chain.

	> POST request to `http://localhost:3000/blockdata`


	![Post blockdata API example](git_images/blockdata.jpg)

	User Input will contain `amount, name, token` (token is generated during Login, registeration process, refer Phase-2 below).

	This will generate individual block that will have `block index`, `timestamp`, `user data`, [nonce(PoW)](https://www.bitcoinmining.com/what-is-proof-of-work), `hash`, `previousHash`.

2) API to fetch latest blockchain from network.

	> GET request to `http://localhost:3000/blockchain`

	Refer below example #3 to see the blockchain format.


3) API to submit raw JSON data containing blockchain. Each block is validated before adding it to the main BlockChain

	> POST request to `http://localhost:3000/blockchain?token={insert token here}`

	![Post blockchain API example](git_images/blockchain.jpg)

	Once we have Logged into the network successfuly and if we already have a copy of blockchain that was previously obtained from `GET /blockchain` API (example #2), we then submit our JSON data containing blockchain into the network. The network will start validating every individual block of every single blockchain obtained from different users, and then updates the main blockchain array with latest valid blockchain.
	

	



### Phase-2 : 

- Maintain a Queue(array) containing pending transactions that will be minded sequentially and added to blockchain.

	To view all pending transactions for a particular userID:

	> GET request to `http://localhost:3000/transactions/{userid}`

	
- API for User Registeration:

	> POST request to `http://localhost:3000/register`

	![User Register API example](git_images/register.jpg)

	User input should contain email address and password. In response, you should receive an unique `user ID` along with a token


- API for User LogIn:

	> POST request to `http://localhost:3000/login`


	![User Login API example](git_images/login.jpg)

	
	User input will contain User ID and password. This is the User ID that was generated during email registeration process.
	If Login verification is successful, you will receive a token



- Maintain a database containing `email`, hashed `password` and unique `userID` of registered BlockChain users.


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

	- Next, post data: `amount` and `name` along with the token that was generated during registeration

		> POST `localhost:3000/blockdata`

	- You can check transaction status at:

		> GET `http://localhost:3000/transactions/{userid}`

	- Once your transaction is complete and added to blockchain, you can check updated blockchain at:

		> GET `localhost:3000/blockchain`

