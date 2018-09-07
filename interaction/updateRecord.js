//Import all libraries
var Web3 = require('web3');
var Tx = require('ethereumjs-tx');
const finMigrate = require('../build/contracts/FINMigrate.json');

//Connect to the ropsten network
var web3 = new Web3(new Web3.providers.HttpProvider("http://54.95.9.122:8545"));
var BN = web3.utils.BN;

//Initializing variables
let abiArray = finMigrate.abi
let contractAddress = '0x41331C10C70E715BD317bA2Ac4a3564C159820b1'
const contractObj = new web3.eth.Contract(abiArray, contractAddress);


const owner = '0x476637335902321375B004DF6A35dF225EdbB8C0'.toLowerCase();
const privateKey = '832A51879E99EF04F2407E9E4C3DFC78FB032B0BB57DAEB2DEE8956E8908A91E'

//Custom Error message
let ENOUGH_ETHER = "Don't have enough ether to make this transaction";

/**
 *
 * @param {*string} finHolder [finholder is the eth address of the finholder]
 * @param {*String} finPoints [fin points is the total fins allocated to that person]
 * @param {*Boolean} migrationRate [migrationRate is whether the migration rate is applicable to that person]
 */
async function updateRecord(finHolder, finPoints, migrationRate) {
    return new Promise(async (resolve,reject) => {
        try {
            finPoints = web3.utils.toWei(new BN(finPoints).toString(), 'ether');
            let data = contractObj.methods.recordUpdate(finHolder, finPoints, migrationRate).encodeABI();
            signTransaction(data, resolve, reject).then(function(error, response) {
                if(error) {
                    reject(error);
                }else {
                    return resolve("Successful",response)
                }
            })

        } catch (error) {
            return reject(error)
        }
    })
}

/**
 *
 * @param {*String} functionData [payload of the transaction]
 * @param {*Promise} resolve [successful promise]
 * @param {*Promise} reject [unsuccessful promise]
 */
async function signTransaction(functionData, resolve, reject) {
    try {
        var gasObj = {
            to: contractAddress,
            from: owner,
            data: functionData
        };
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
        console.log("gasEstimate", gasEstimate)
        if (+balance < (+gasEstimate * +gasPrice)) {
            resolve([null, ENOUGH_ETHER]);
        } else {
            var tx = new Tx({
                to: contractAddress,
                nonce: nonce,
                gasPrice: web3.utils.toHex(gasPrice),
                gasLimit: web3.utils.toHex(gasEstimate),
                data: functionData
            });
            tx.sign(new Buffer(privateKey, 'hex'));
            web3.eth.sendSignedTransaction('0x' + tx.serialize().toString('hex'))
                .on('transactionHash', function (hash) {
                    console.log(hash);
                })
                .on('receipt', function (receipt,data) {
                    console.log("data",data)
                    console.log("receipt",receipt)
                    resolve([receipt]);
                })
                .on('error', function (error) {
                    try {
                        console.log(error);
                        var data = error.message.split(':\n', 2);
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


//Sample usage to update the record of a person
ethAddress = '0x5076cee698a5486ff8fcd105804fe9b88e102022';
finPoints = 500000;

updateRecord(ethAddress,finPoints,true).then(function(error,res){

    if(!error) {
        console.log(res)
    }
})