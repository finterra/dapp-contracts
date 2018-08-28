### Migration Contracts

Compiled contracts for FIN-ERC20, FIN-GTX-SWAP and FIN-MIGRATE.

### Prerequisite
    Nodejs v8+
### Installation
1. Install truffle globally
```
npm install -g truffle
```

2. After cloning the project run the below command to install dependencies.
```
npm i 
```
3. Compile and migrate test smart contracts
```
truffle compile
truffle migrate --network {ropsten/mainnet}
truffle test
```

The GTX_Swap_Rate and FinMigrate Rate should be updated before excecuting the contract. Smart contract does not support float values so we can specify 375 instead of 3.75. Internally smart contract will do the conversion

4. Configure your address in truffle.js to deploy contracts from a specific address
    `from: 'address'`

5. To interact with smart contracts using web3.

    5a. Connect to the network
    ```
    var web3 = new Web3(new Web3.providers.HttpProvider("http://testnet:port"));
    ```
    5b. Create a contract instance to interact with the contract deployed in the {ropsten/mainnet}
    ```
    var contractObj = new web3.eth.Contract(contractABI, contractAddress);
    ```
    where,
    contractABI is found under ./build/contract_name/contract_name.json
    contractAddress address is displayed while deploying the contracts using `truffle migrate --network ropsten`

### Excecution
=== WIP ===
1. Fin Record Update
recordUpdate.js script can be used to update the records in smart contract. A csv file of records can be placed inside ./interaction/ folder
The csv file should have three columns say address, fins and true(if migration rate is applicable)

2. Fin Record Move
recordMove.js script can be used to update the records in smart contract. A csv file of records can be placed inside ./interaction/ folder
The csv file should have two columns say address and fins

3. Fin Claim
Using finClaim.js script we can claim tokens. The person whose record is updated during migration can only claim with the registered address
