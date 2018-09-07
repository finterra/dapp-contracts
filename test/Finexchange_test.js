let mintableToken = artifacts.require('./MintableToken')
let finMigrate = artifacts.require('./FINMigrate')
var finExchange = artifacts.require('./FinExchange')

var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

const truffleAssert = require('truffle-assertions');
const assert = require("chai").assert;
require('chai')
    .use(require('chai-as-promised'))
    .should();

const pv = "0x6929676b180d25d2182516811adda52e8b0a18b7052abb8c66fd08608c58990f";

contract('Finexchange', function (accounts) {
    //Global variables
    let finMigrateIns;
    let mintableTokenIns;
    let finexchangeIns;

    //Fin Record Balance
    record1 = 80 * 10e18
    record2 = 50 * 10e18
    record3 = 30 * 10e18
    record4 = 20 * 10e18

    describe('Updating Record in FinMigrate and Claiming tokens for the adddress', async function () {
        before('Should return finMigrate instance and deploy mintable contract', async function () {
            finMigrateIns = await finMigrate.deployed();
            await finMigrateIns.setMigrationRate(100)
            mintableTokenIns = await mintableToken.new(finMigrateIns.address, "Fin Token", "FIN", 18);
        })
        it('Should update FinMigrate Records', async function () {
            await finMigrateIns.recordUpdate(accounts[1], record1, true, { from: accounts[0] })
            await finMigrateIns.recordUpdate(accounts[2], record2, true, { from: accounts[0] })
            await finMigrateIns.recordUpdate(accounts[3], record3, true, { from: accounts[0] })
            await finMigrateIns.recordUpdate(accounts[4], record4, true, { from: accounts[0] })
        })
        it('Claim Should mint and transfer tokens to the finMigrate record', async function () {
            //claiming for acocunt1
            //creating message hash including the address and kyc value
            var message = accounts[1]+1;   //here 1 denotes true where the kyc has verified
            var response = web3.eth.accounts.sign(message, pv);
            var msgHash = response.messageHash;
            var v = parseInt(response.v, 16);
            var r = response.r;
            var s = response.s;
            await mintableToken.claim(msgHash,v,r,s,{ from: accounts[1] })
            // claiming for acocunt2
            var message = accounts[2]+1;   //here 1 denotes true where the kyc has verified
            var response = web3.eth.accounts.sign(message, pv);
            var msgHash = response.messageHash;
            var v = parseInt(response.v, 16);
            var r = response.r;
            var s = response.s;
            await mintableToken.claim(msgHash,v,r,s,{ from: accounts[2] })
            //claiming for acocunt3
            var message = accounts[4]+1;   //here 1 denotes true where the kyc has verified
            var response = web3.eth.accounts.sign(message, pv);
            var msgHash = response.messageHash;
            var v = parseInt(response.v, 16);
            var r = response.r;
            var s = response.s;
            await mintableToken.claim(msgHash,v,r,s,{ from: accounts[4] })
        })
    })

    //Test Scenario :
    //Account1(seller) is trying to deposit 10 fins to Account4(buyer). So first seller should send 10 fins to escrow
    //FinExchange contract will record the data of the user against a UUID and transfers 10 fins to escrow account
    //From escrow account we can transfer the 99% of tokens to the buyer and 1% to the exchange which is account3

    // /EVENTS
    let txDeposit
    let txTransfer
    let txSend

    const buyer = accounts[4]
    const exchange = accounts[5]
    // toBuyer = (99 * (record4/2))/100
    // toExchange = (1 * (record4 / 2)) / 100
    const toBuyer = 9 * 10e18
    const toExchange = 1 * 10e18

    describe('Testing FinExchange Contract', function () {

        before(async function () {
            finexchangeIns = await finExchange.new(mintableTokenIns.address);
        })


        it('Deposit tokens to the escrow contract', async function () {
            txDeposit = await finexchangeIns.deposit("167A", record4 / 2, { from: accounts[1] })
            //testing record details
            let details = await finexchangeIns.getSeller("167A")
            assert.equal(details[0], accounts[1], "seller should be accounts[1]")
            assert.equal(details[1].toNumber(), record4 / 2, "FinAmount should be equal amount(record4 / 2) sent to the escrow")

            //Transferring tokens to escrow wallet
            txTransfer = await mintableTokenIns.transfer(finexchangeIns.address, record4 / 2, { from: accounts[1] })
            balance = await mintableTokenIns.balanceOf.call(finexchangeIns.address)
            assert.equal(balance.toNumber(), record4 / 2, "balance should be record4/2")
            balance = await mintableTokenIns.balanceOf.call(accounts[1])
            result = record1 - (record4 / 2)
            assert.equal(balance.toNumber(), result, "balance should be  record1- record4/2 ")
        })

        it('Should reject if one address is invalid', async function () {
            txSend = await finexchangeIns.sendTokens([buyer, 'exchange'], [toBuyer, toExchange]).should.be.rejected;
        })

        it('Should Send tokens to the buyer and exchange', async function () {
            txSend = await finexchangeIns.sendTokens([buyer, exchange], [toBuyer, toExchange])
            balance = await mintableTokenIns.balanceOf.call(buyer)
            assert.equal(balance.toNumber(), record4 + toBuyer, "balance should be 99% of sent tokens")
            balance = await mintableTokenIns.balanceOf.call(exchange)
            assert.equal(balance.toNumber(), toExchange, "balance should be 1% of sent tokens")

        })

    })

    describe('testing events', async function () {
        it('Should emit DEPOSIT event for finexchange contract', async function () {
            truffleAssert.eventEmitted(txDeposit, 'DEPOSIT', (ev) => {
                return ev.sellerAddress === accounts[1] && ev.tokenDeposit.eq(record4 / 2);
            });
        })

        it('Should emit TRANSFER event for ERC20 Token Contract', async function () {
            truffleAssert.eventEmitted(txTransfer, 'Transfer', (ev) => {
                return ev.from === accounts[1] && ev.to === finexchangeIns.address && ev.value.eq(record4 / 2);
            });
        })
        //Watching Transfer Events
        it('Transfer event', async function () {
            // One way of event watching
            TransferEvent = mintableTokenIns.Transfer({ fromBlock: 0, toBlock: 'latest' });
            TransferEvent.watch((error, log) => {
                // Do whatever you want
                if (!error) {
                    console.log('Watched Log:', log.args);
                }
            });
        })
        //Watching SENT Events
        it('Sent event', async function () {
            // One way of event watching
            SentEvent = finexchangeIns.SENT({ fromBlock: 0, toBlock: 'latest' });
            SentEvent.watch((error, log) => {
                // Do whatever you want
                if (!error) {
                    console.log('Watched Log:', log.args);
                }
            });
        })
    })
})
