//Claiming fin tokens
var Web3 = require("web3");
var Tx = require("ethereumjs-tx");
var web3 = new Web3(new Web3.providers.HttpProvider("http://54.95.9.122:8545"));
const ERC20 = require("../build/contracts/MintableToken.json");
const abiArray = ERC20.abi;
const contractAddress = "0x404309a25028a0046e093d4fc0510509595cd047";
const mintableToken = new web3.eth.Contract(abiArray, contractAddress);

finterraAccount = "0x476637335902321375B004DF6A35dF225EdbB8C0";
privateKey = "0x832A51879E99EF04F2407E9E4C3DFC78FB032B0BB57DAEB2DEE8956E8908A91E".toLowerCase();

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
      let payload = mintableToken.methods.claim(msgHash, v, r, s).encodeABI();
      signTransaction(payload, finHolder, pv, resolve, reject).then(function(error , response) {
        if(error) {
          return reject(error);
        }else {
          return resolve(response)
        }
      })
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
        gasLimit: web3.utils.toHex('173628'),
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
signMessage("0x5076cee698a5486ff8fcd105804fe9b88e102022", 1).then(function(
  data
) {
  claim(
    data.messageHash,
    parseInt(data.v, 16),
    data.r,
    data.s,
    "0x5076cee698a5486ff8fcd105804fe9b88e102022",
    "016FC2358ED8CF757AF89FAD788F5359FA780A35179E4D830F95E9F9CEC33142"
  ).then(function() {
    console.log("success");
  });
});