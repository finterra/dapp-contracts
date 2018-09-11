//Import all libraries
var Web3 = require('web3');
var Tx = require('ethereumjs-tx');
var web3 = new Web3(new Web3.providers.HttpProvider("http://54.95.9.122:8545"));
var Exchange = require("../build/contracts/FinExchange.json");
var BN = web3.utils.BN;

//Fin Exchange Contract Details
exchangeAddress = "0x1fedb479a43e9092dd481898c4a910473215ab37";

//Contract Owner details
finAddress = "0x476637335902321375b004df6a35df225edbb8c0";
privateKey = "832A51879E99EF04F2407E9E4C3DFC78FB032B0BB57DAEB2DEE8956E8908A91E".toLowerCase();

//Get the Contract Object
ExchangeInstance = new web3.eth.Contract(Exchange.abi, exchangeAddress);

/**
 *
 * @param {*String Array} array of ethAddress to send ethers
 * @param {*String Array} array of amount to be sent to ethAddresses
 * @param {*String} totalEther is the totalAmount to be appended in the value field in forming the transaction
 */
async function sentToMany(ethAddress, amount, totalEther) {
    return new Promise(async (resolve,reject) => {
        try {
            let data = ExchangeInstance.methods.sendToMany(ethAddress, amount).encodeABI();
            console.log("data",data)
            signTransaction(data, totalEther, resolve, reject).then(function(error, response) {
                if(error) {
                    return  reject(error);
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
 * @dev signTransaction function forms a raw transaction , signs the tx  and sends the signed transaction to the blockchain network
 * @param {*String} functionData [payload of the transaction]
 * @param {*Promise} resolve [successful promise]
 * @param {*Promise} reject [unsuccessful promise]
 */
async function signTransaction(functionData, totalEther, resolve, reject) {
    try {
        var gasObj = {
            to: exchangeAddress,
            from: finAddress,
            data: functionData
        };
        var nonce;
        var gasPrice;
        var gasEstimate;
        var balance;
        try {
            nonce = await web3.eth.getTransactionCount(finAddress);
            gasPrice = await web3.eth.getGasPrice();
            balance = await web3.eth.getBalance(finAddress);
        } catch (e) {
            console.log(e);
        }
        console.log("gasEstimate", gasEstimate)
        if (+balance < (+gasEstimate * +gasPrice)) {
            resolve([null, ENOUGH_ETHER]);
        } else {
            var tx = new Tx({
                to: exchangeAddress,
                nonce: nonce,
                gasPrice: web3.utils.toHex(gasPrice),
                gasLimit: web3.utils.toHex('99343'),
                data: functionData,
                value: web3.utils.toHex(totalEther)
            });
            tx.sign(new Buffer(privateKey, 'hex'));
            web3.eth.sendSignedTransaction('0x' + tx.serialize().toString('hex'))
                .on('transactionHash', function (hash) {
                    console.log(hash);
                })
                .on('receipt', function (receipt,data) {
                    console.log("receipt",receipt)
                    return resolve([receipt]);
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
                        return reject(error);
                    } catch (e) {
                        return reject(e);
                    }
                });
        }
    } catch (e) {
        reject(e);
    }

}

totalEther = '1000000000000000000'
testAddress1 = "0x441de93e374895ec51b80406da78deb1f721f7bc"
amount = '1000000000000000000; // should be in wei

sentToMany([testAddress1],[amount],totalEther).then(function(response) {
    console.log(response)
})


