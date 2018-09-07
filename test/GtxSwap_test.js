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

    var fin = 70 * 10e18;
    var finWithSwap = 900 * 10e18;
    var finWithSwap1 = 1000 * 10e18;
    var invalidfin = 100;
    var swapRate = 200 //2.00 swap rate should be set in 2 decimal points

    //EVENTS
    var txUpdate;
    var txMove;

    describe('Record update before setting swap rate', async function(){

        it('Should be rejected before swap rate is set', async function () {
            await gtxInstance.recordCreate(accounts[1], finWithSwap, true, { from: accounts[0] }).should.be.rejected;
        })
    })
    describe('set gtx swap rate',async function(){

        it('Should set the swap rate by owner', async function(){
            await gtxInstance.setSwapRate(swapRate)
        })
        it('Should reject if swap rate is not set by the owner',async function(){
            gtxInstance.setSwapRate(swapRate,{from:accounts[1]}).should.be.rejected;
        })
    })
    describe('record create', function () {

        it('Should update with swap rate', async function () {
            await gtxInstance.recordCreate(accounts[1], finWithSwap, true, { from: accounts[0] })
            var balance = await gtxInstance.recordGet.call(accounts[1])
            assert.equal(balance.toNumber(), (finWithSwap *swapRate)/100 , "balance should be 18.5")
        })

        it('Should update without swap rate', async function () {
            await gtxInstance.recordCreate(accounts[2], fin, false, { from: accounts[0] })
            var balance = await gtxInstance.recordGet.call(accounts[2])
            assert.equal(balance.toNumber(), fin, "balance should be 70 *10e18")
        })

        it('Should add finpoints for the same record', async function () {
            await gtxInstance.recordCreate(accounts[1], finWithSwap, true, { from: accounts[0] })
            var balance = await gtxInstance.recordGet.call(accounts[1])
            assert.equal(balance.toNumber(), (finWithSwap*2)*swapRate/100, "balance should be (18 *10e18)")
        })

        it('Should return the total gtx', async function(){
            var total = await gtxInstance.getTotal.call()
            assert.equal(total.toNumber(), ((finWithSwap*2*swapRate)/100)+fin , "balance should be 18.5")
        })

        it('Should be rejected for finPointAmount >= 100000', async function () {
            gtxInstance.recordCreate(accounts[3], invalidfin, true, { from: accounts[0] }).should.be.rejected;
        })

        it('it should be called only by the contract owner', async function () {
            gtxInstance.recordCreate(accounts[1], 5000000000000000000, true, { from: accounts[1] }).should.be.rejected;
        })
    })

    describe('record update', function(){

        it('Should update for existing record', async function() {
            txUpdate = await gtxInstance.recordUpdate(accounts[1],finWithSwap1,true,{from: accounts[0]})
            var balance = await gtxInstance.recordGet.call(accounts[1]);
            assert.equal(balance.toNumber(),finWithSwap1*swapRate/100,"balance should be equal to 10 *10e18")
        })
        it('Should reject for non existing record', async function() {
            await gtxInstance.recordUpdate(accounts[4],finWithSwap1,true,{from: accounts[0]}).should.be.rejected;
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
    describe('total gtx swapped ', function(){

        it('Should return the total gtx', async function(){
            var total = await gtxInstance.getTotal.call()
            var computedTotal = fin+finWithSwap1*swapRate/100;
            assert.equal(computedTotal,total.toNumber(),"balance should be equal")
        })
    })
    describe('Testing Events',function(){

        it('Should emit record update event for account[1]',async function(){
            truffleAssert.eventEmitted(txUpdate, 'GTXRecordUpdate', (ev) => {
                return ev._recordAddress === accounts[1] && ev._gtxAmount.eq(finWithSwap1*swapRate / 100);
            });
        })

        it('Should emit record move event for account[1]',async function(){
            truffleAssert.eventEmitted(txMove, 'GTXRecordMove', (ev) => {
                return ev._oldAddress === accounts[2] && ev._newAddress === accounts[4] && ev._gtxAmount.eq(fin);
            });
        })
    })
})