var gtxSwap = artifacts.require('./GTXSwap')
const truffleAssert = require('truffle-assertions');
const assert = require("chai").assert;
require('chai')
    .use(require('chai-as-promised'))
    .should();


contract('GTX SWAP', function (accounts) {
    let gtxInstance;

    before(async function () {
        gtxInstance = await gtxSwap.deployed();
    })

    var fin = 7 * 10e18;
    var finWithSwap = 7 * 10e18;
    var invalidfin = 100;

    //EVENTS
    var txUpdate;
    var txMove;

    describe('record update', function () {

        it('Should update with swap rate 1', async function () {
            txUpdate = await gtxInstance.recordUpdate(accounts[1], finWithSwap, true, { from: accounts[0] })
            var balance = await gtxInstance.recordGet.call(accounts[1])
            assert.equal(balance.toNumber(), finWithSwap / 100, "balance should be (7 *10e18)/100")
        })

        it('Should update without swap rate', async function () {
            await gtxInstance.recordUpdate(accounts[2], fin, false, { from: accounts[0] })
            var balance = await gtxInstance.recordGet.call(accounts[2])
            assert.equal(balance.toNumber(), fin, "balance should be 7 *10e18")
        })

        it('Should be rejected for finPointAmount >= 100000', async function () {
            gtxInstance.recordUpdate(accounts[3], invalidfin, true, { from: accounts[0] }).should.be.rejected;
        })

        it('it should be called only by the contract owner', async function () {
            gtxInstance.recordUpdate(accounts[1], 5000000000000000000, true, { from: accounts[1] }).should.be.rejected;
        })
    })

    describe('record move', function () {

        it('Should move record for an existing "from" address and non-existing "to" address', async function () {
            txMove = await gtxInstance.recordMove(accounts[2], accounts[4], { from: accounts[0] })
            var balance = await gtxInstance.recordGet.call(accounts[4])
            assert.equal(balance.toNumber(), fin, "balance should be 7 *10e18")
            var balance = await gtxInstance.recordGet.call(accounts[2])
            assert.equal(balance.toNumber(), 0, "balance should be 0")
        })

        it('Should reject for non existing "from" address', async function () {
            gtxInstance.recordMove(accounts[2], accounts[3],{ from: accounts[0] }).should.be.rejected;
        })

        it('Should reject for existing "to" address', async function () {
            gtxInstance.recordMove(accounts[1], accounts[4],{ from: accounts[0] }).should.be.rejected;
        })

        it('Should reject for an invalid new address ', async function () {
            gtxInstance.recordMove(accounts[1], " ",{ from: accounts[0] }).should.be.rejected;
        })

        it('it should be called only by the contract owner', async function () {
            gtxInstance.recordMove(accounts[1], accounts[3], { from: accounts[1] }).should.be.rejected;
        })
    })

    describe('Testing Events',function(){

        it('Should emit record update event for account[1]',async function(){
            truffleAssert.eventEmitted(txUpdate, 'GTXRecordUpdate', (ev) => {
                return ev._recordAddress === accounts[1] && ev._gtxAmount.eq(finWithSwap / 100);
            });
        })

        it('Should emit record move event for account[1]',async function(){
            truffleAssert.eventEmitted(txMove, 'GTXRecordMove', (ev) => {
                return ev._oldAddress === accounts[2] && ev._newAddress === accounts[4] && ev._gtxAmount.eq(fin);
            });
        })
    })

})

