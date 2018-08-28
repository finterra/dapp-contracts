//Claiming fin tokens
var Web3 = require("web3");
var Tx = require("ethereumjs-tx");
var web3 = new Web3(new Web3.providers.HttpProvider("http://54.95.9.122:8545"));
const ERC20 = require("../build/contracts/MintableToken.json");
const abiArray = ERC20.abi;
const contractAddress = "0x11a8f4a85f739e649b958e63edbd2bd8fe0aef6b";
const mintableToken = new web3.eth.Contract(abiArray, contractAddress);

finterraAccount = "0x8fb5cd5d55591c1bba97879eee0367d78446342c";
privateKey = "0xB9B7B3DFF56A5D6DFE7F8DBBE038B495F257ABCCF67DC7ABB661FE6D5DBB7057".toLowerCase();

//Custom Error message
let ENOUGH_ETHER = "Don't have enough ether to make this transaction";

/**
 * Finterra account should verify the KYC status of a person and sign the message and send the hash to the claim function
 * Sample finterra account to sign the message finterra = '0x4d2657ed642f356eede2ad77856c58b021beb0ea'
 */

/**
 * @dev Signs the message which is the ethAddress and kyc status
 * Note : The account should be unlocked before signing
 * @param {*string} ethAddress [ethAddress of the finholder to verify the kyc]
 * @param {*Integer} kycStatus [kyc status]
 */
async function signMessage(ethAddress, kycStatus) {
  return new Promise(async (resolve, reject) => {
    try {
      // creating message hash of the address and kyc value
      var message = ethAddress + kycStatus;
      var response = await web3.eth.accounts.sign(message, privateKey);
      return resolve(response);
    } catch (error) {
      return reject("Error while signing the message");
    }
  });
}

/**
//  *
//  * @param {*String} msgHash [Hash of the  message signed by finterra account]
//  * @param {*String} signature [Signature of the messageHash]
//  * @param {*String} finHolder [Address of the person who wants to claim Fins]
//  * @param {*String} pv is the privatekey of the user who wants to claim fins by sending a signed transaction to the ethereum network
//  */
async function claim(msgHash, v, r, s, finHolder, pv) {
  return new Promise(async (resolve, reject) => {
    try {
      // console.log("msgHash:", msgHash, "v: ", v, "r: ", r, "s: ", s);
      let payload = mintableToken.methods.claim(msgHash, v, r, s).encodeABI();
      await signTransaction(payload, finHolder, pv, resolve, reject);
      return resolve();
    } catch (error) {
      return reject("Error while claiming");
    }
  });
}

/**
 *
 * @param {*String} functionData [payload of the transaction field]
 * @param {*String} finHolder [Person who want to claim the fins]
 * @param {*String} privateKey [Private key of the finHolder]
 * @param {*Promise} resolve [Success return object]
 * @param {*Promise} reject [Failure return object]
 */
async function signTransaction(
  functionData,
  finHolder,
  privateKey,
  resolve,
  reject
) {
  try {
    var gasObj = {
      to: contractAddress,
      data: functionData
    };
    var nonce;
    var gasPrice;
    var gasEstimate;
    var balance;
    try {
      nonce = await web3.eth.getTransactionCount(finHolder);
      gasPrice = await web3.eth.getGasPrice();
      gasEstimate = await web3.eth.estimateGas({ gasObj });
      balance = await web3.eth.getBalance(finHolder);
    } catch (e) {
      console.log(e);
    }
    if (+balance < +gasEstimate * +gasPrice) {
      resolve([null, ENOUGH_ETHER]);
    } else {
      var tx = new Tx({
        nonce: nonce,
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex('123628'),
        to: contractAddress,
        value: "0x00",
        data: functionData
      });
      console.log("Your transaciton is processing in ropsten testnet.... please wait for....")
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

//First Sign the Kyc status of a user
signMessage("0x5e58c0a7206a8273e2ea3f136427578f9bfd9204", 1).then(function(
  data
) {
  claim(
    data.messageHash,
    parseInt(data.v, 16),
    data.r,
    data.s,
    "0x5e58c0a7206a8273e2ea3f136427578f9bfd9204",
    "EC7AA44E9975D92E543EA3D904792815DBDE4254179AD04E2F1F7D4868856B85"
  ).then(function() {
    console.log("success");
  });
});
