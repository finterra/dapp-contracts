var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://54.95.9.122:8545"));
var Tx = require("ethereumjs-tx");
var Exchange = require("../build/contracts/FinExchange.json");
var ERC20 = require("../build/contracts/MintableToken.json");

//ERC20 Contract Details
ercAddress = "0x11a8f4a85f739e649b958e63edbd2bd8fe0aef6b";
//Fin Exchange Contract Details
exchangeAddress = "0x6086041858b7af2ED0556Fb3dba7DA73E5758c70";

//Contract Owner details
finAddress = "0x8fb5cd5d55591c1bba97879eee0367d78446342c";
privateKey = "B9B7B3DFF56A5D6DFE7F8DBBE038B495F257ABCCF67DC7ABB661FE6D5DBB7057".toLowerCase();

//Get the Contract Object
ExchangeInstance = new web3.eth.Contract(Exchange.abi, exchangeAddress);
ERC20Instance = new web3.eth.Contract(ERC20.abi, ercAddress);

/**
 *
 * @param {*string} uuid [unique id for a seller]
 * @param {*String} owner is the seller who does the deposit tokens
 * @param {*Integer} tokens [tokens seller wants to deposit]
 * @param {*String} pv [private key of the seller]
 */
async function depositTokens(uuid, owner, tokens, pv) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = ExchangeInstance.methods
        .deposit(web3.utils.toHex(uuid), tokens)
        .encodeABI();
      console.log(data);
      await signTransaction(exchangeAddress, owner, data, pv, resolve, reject);
    } catch (error) {
      console.log(error);
    }
  });
}

/**
 *
 * @param {*String} address of the exchange contract
 * @param {*String} owner address of the seller
 * @param {*Integer} tokens number of tokens the seller wants to sell
 * @param {*String} pv private key of the seller
 */
async function transferTokens(address, owner, tokens, pv) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = ERC20Instance.methods.transfer(address, tokens).encodeABI();
      console.log(data);
      await signTransaction(ercAddress, owner, data, pv, resolve, reject);
    } catch (error) {
      console.log(error);
    }
  });
}

/**
 *
 * @param {*String Array} address is an array of address to send tokens
 * @param {*Integer Array} tokens is the array of tokens to be sent
 * @param {*String} owner is the finterra account holder
 * @param {*String} privateKey is the private key of the finterra account
 */
async function closeTrade(address, tokens, owner, privateKey) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = ExchangeInstance.methods
        .sendTokens(address, tokens)
        .encodeABI();
      console.log(data);
      await signTransaction(
        exchangeAddress,
        owner,
        data,
        privateKey,
        resolve,
        reject
      );
    } catch (error) {
      console.log(error);
    }
  });
}

/**
 * @param {*string} contractAddress [address of the contract to which send transaction to be made]
 * @param {*String} owner is the account address which does the transaction
 * @param {*string} functionData [payload for sending the transaction]
 * @param {*string} privateKey [private key to sign the transaction]
 * @param {*string} resolve [promise to return]
 * @param {*string} reject  [promise to return]
 */
async function signTransaction(
  contractAddress,
  owner,
  functionData,
  privateKey,
  resolve,
  reject
) {
  try {
    var gasObj = {
      to: contractAddress,
      from: owner,
      data: functionData
    };
    console.log(gasObj);
    var nonce;
    var gasPrice;
    var gasEstimate;
    var balance;
    try {
      nonce = await web3.eth.getTransactionCount(owner);
      console.log(nonce);
      gasPrice = await web3.eth.getGasPrice();
      console.log(gasPrice);
      gasEstimate = await web3.eth.estimateGas(gasObj);
      console.log(gasEstimate);
      balance = await web3.eth.getBalance(owner);
    } catch (e) {
      console.log(e);
    }
    console.log("gasEstimate", gasEstimate);
    if (+balance < +gasEstimate * +gasPrice) {
      reject("no enough balance");
    } else {
      var tx = new Tx({
        nonce: nonce,
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gasEstimate),
        to: contractAddress,
        value: "0x00",
        data: functionData
      });
      tx.sign(new Buffer(privateKey, "hex"));
      web3.eth
        .sendSignedTransaction("0x" + tx.serialize().toString("hex"))
        .on("transactionHash", function(hash) {
          console.log(hash);
        })
        .on("receipt", function(receipt) {
          resolve([receipt]);
        })
        .on("error", function(error) {
          try {
            console.log(error);
            var data = error.message.split(":\n", 2);
            if (data.length == 2) {
              var transaction = JSON.parse(data[1]);
              transaction.messesge = data[0];
              return resolve([transaction]);
            }
            reject(error);
          } catch (e) {
            reject(e);
          }
        });
    }
  } catch (e) {
    reject(e);
  }
}

/**
 *
 * @param {*string} address of the acocunt to check the balance
 */
async function getBalance(address) {
  var balance = await ERC20Instance.methods.balanceOf(address).call({
    from: finAddress,
    gas: "4700000"
  });
  console.log("balance", balance);
}

/**
 *
 * @param {*string} uuid [unique id of the seller]
 */
async function getSeller(uuid) {
  var seller = await ExchangeInstance.methods.getSeller(uuid).call({
    from: finAddress,
    gas: "4700000"
  });
  console.log("seller details", seller);
}




/****
 * Example scenario for deposit and close trade
 * Step 1. Seller should deposit tokens in the escrow account
 *  1a. call deposit method to create a record
 *  1b. transfer tokens to the escrow account using ERC20 contract
 * Step 2. Close trade
 *  2a. send the array of adress and the array of tokens to be sent in a single transaction
 * ****/

//test uuid
uuid1 = "Q002";
seller = "0x9c5a4e96c98b6fb76aaed21ce21aaffe6d8239fc"; //Ahmed
sellerPv = "3505B47BECD3C448F445F0C6AC10C0A195AEFE37E71BB3FB259E2254DC253362".toLowerCase();

// Step 1. Seller should deposit tokens in the escrow account
// 1a. call deposit method to create a record
depositTokens(uuid1,seller,40000000000000000000,sellerPv).then(function(err,res){
  if(err){
    console.log()
  }else {
    console.log(res)
  }
})
getSeller(web3.utils.toHex(uuid1))
// 1b. transfer tokens to the escrow account using ERC20 contract
transferTokens(exchangeAddress, seller, 40000000000000000000,sellerPv);
// check Escrow wallet balance if required
getBalance(exchangeAddress)

// Step 2. Close trade
//  2a. send the array of adress and the array of tokens to be sent in a single transaction
var buyer = "0xabd362d60e32e5c9ec40cfddaefa8d0b91384771";
//sample close trade
closeTrade(
  [exchangeAddress, buyer],
  [20000000000000000000, 20000000000000000000],
  finAddress,
  privateKey
);
