//Import all libraries
var Web3 = require('web3');
var Tx = require('ethereumjs-tx');
const finRecordUpdate = require('../build/contracts/FINPointRecord.json');


//Connect to the ropsten network
var web3 = new Web3(new Web3.providers.HttpProvider("http://54.95.9.122:8545"));
var BN = web3.utils.BN;

//Initializing variables
let abiArray = finRecordUpdate.abi
let contractAddress = '0x41331C10C70E715BD317bA2Ac4a3564C159820b1'
const contractObj = new web3.eth.Contract(abiArray, contractAddress);


const owner = '0x476637335902321375B004DF6A35dF225EdbB8C0'.toLowerCase();
const privateKey = '832A51879E99EF04F2407E9E4C3DFC78FB032B0BB57DAEB2DEE8956E8908A91E'

//Custom Error message
let ENOUGH_ETHER = "Don't have enough ether to make this transaction";

/**
 * @dev createRecord function is to create a fin record for a new address
 * @param {*string} finHolder [finholder is the eth address of the finholder]
 * @param {*String} finPoints [fin points is the total fins allocated to that person]
 * @param {*Boolean} migrationRate [migrationRate is whether the migration rate is applicable to that person]
 */
async function createRecord(finHolder, finPoints, migrationRate) {
    return new Promise(async (resolve,reject) => {
        try {
            finPoints = web3.utils.toWei(new BN(finPoints).toString(), 'ether');
            let data = contractObj.methods.recordCreate(finHolder, finPoints, migrationRate).encodeABI();
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
 * @dev updateRecord function is used when we mistakenly created a record with wrong balance. We can use this function to change the balance
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
 * @dev updateRecord function is used when we mistakenly created a record with wrong balance. We can use this function to change the balance
 * @param {*string} oldAddress [oldAdrress is the eth address of the finHolder which was updated in the database already]
 * @param {*String} newAddress [fin points is the total fins allocated to that person]
 */
async function moveRecord(oldAddress,newAddress) {
    return new Promise(async (resolve,reject) => {
        try {
            finPoints = web3.utils.toWei(new BN(finPoints).toString(), 'ether');
            let data = contractObj.methods.recordMove(oldAddress,newAddress).encodeABI();
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
 * @dev signTransaction function signs and sends a transaction to the blockchain network
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


//Sample usage to create the record of a finHolder
ethAddress = '0x441de93e374895ec51b80406da78deb1f721f7bc';
finPoints = 500000;

createRecord(ethAddress,finPoints,true).then(function(error,res){
    if(!error) {
        console.log(res)
    }
})


// Sample usage to update  the record of a finHolder if the balance was incorrect
updateRecord(ethAddress,finPoints,true).then(function(error,res){
    if(!error) {
        console.log(res)
    }
})

oldAddress = "0x441de93e374895ec51b80406da78deb1f721f7bc";
newAddress = "0xe9f68f420063b26a3aa1354e04d27679cdf4aee1"

// Sample usage to update eth address
moveRecord(oldAddress,newAddress).then(function(error,res){
    if(!error) {
        console.log(res)
    }
})