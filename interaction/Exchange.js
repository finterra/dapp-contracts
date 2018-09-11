var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://54.95.9.122:8545"));
var Tx = require("ethereumjs-tx");
var Exchange = require("../build/contracts/FinExchange.json");
var ERC20 = require("../build/contracts/MintableToken.json");
var BN = web3.utils.BN;

//ERC20 Contract Details
ercAddress = "0x404309a25028a0046e093d4fc0510509595cd047";
//Fin Exchange Contract Details
exchangeAddress = "0x5a56adf6318300d6520ff2a9d4c505153603473b";

//Contract Owner details
finAddress = "0x476637335902321375b004df6a35df225edbb8c0";
privateKey = "832A51879E99EF04F2407E9E4C3DFC78FB032B0BB57DAEB2DEE8956E8908A91E".toLowerCase();

//Get the Contract Object
ExchangeInstance = new web3.eth.Contract(Exchange.abi, exchangeAddress);
ERC20Instance = new web3.eth.Contract(ERC20.abi, ercAddress);

/**
 *
 * @param {*string} uuid [unique id for a seller]
 * @param {*String} ethAddress is the address of the seller who deposits tokens
 * @param {*Integer} tokens [tokens seller wants to deposit]
 * @param {*String} pv [private key of the seller]
 */
async function depositTokens(uuid, ethAddress,tokens, pv) {
  return new Promise(async (resolve, reject) => {
    try {
      tokens = web3.utils.toWei(new BN(tokens).toString(), 'ether');
      let data = ExchangeInstance.methods
        .deposit(web3.utils.toHex(uuid), ethAddress, tokens)
        .encodeABI();
      console.log(data);
      signTransaction(exchangeAddress, finAddress, data, pv, resolve, reject).then(function(error , response) {
        if(error) {
          return reject(error);
        }else {
          return resolve(response)
        }
      })
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
      tokens = web3.utils.toWei(new BN(tokens).toString(), 'ether');
      let data = ERC20Instance.methods.transfer(address, tokens).encodeABI();
      console.log(data);
      signTransaction(ercAddress, owner, data, pv, resolve, reject).then(function(error, response) {
          if(error){
            reject(error)
          }else {
            return resolve(response)
          }
      })
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
        .withdraw(address, tokens)
        .encodeABI();
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
      gasPrice = await web3.eth.getGasPrice();
      gasEstimate = await web3.eth.estimateGas(gasObj);
      balance = await web3.eth.getBalance(owner);
    } catch (e) {
      console.log(e);
    }
    console.log("gasEstimate",gasEstimate+15000)
    if (+balance < +gasEstimate * +gasPrice) {
      resolve([null, ENOUGH_ETHER]);
    } else {
      var tx = new Tx({
        nonce: nonce,
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gasEstimate+15000),
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
          console.log(receipt)
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
seller = "0x8fb5cd5d55591c1bba97879eee0367d78446342c";
sellerPv = "B9B7B3DFF56A5D6DFE7F8DBBE038B495F257ABCCF67DC7ABB661FE6D5DBB7057"

// Step 1. Seller should deposit tokens in the escrow account
// 1a. call deposit method to create a record
// depositTokens(uuid1,seller,500,sellerPv).then(function(err,res){
//   if(err){
//     console.log()
//   }else {
//     console.log(res)
//   }
// })
// getSeller(web3.utils.toHex(uuid1))

// 1b. transfer tokens to the escrow account using ERC20 contract
// transferTokens(exchangeAddress, seller, 1000,sellerPv).then(function(res){
//   console.log(res)
// })
// check Escrow wallet balance if required
getBalance(exchangeAddress)


// Step 2. Close trade
//  2a. send the array of adress and the array of tokens to be sent in a single transaction
// var buyer = "0x441de93e374895ec51b80406da78deb1f721f7bc";
// //sample close trade
// closeTrade(
//   [exchangeAddress, buyer],
//   ["700000000000000000000", "700000000000000000000"],
//   finAddress,
//   privateKey
// );