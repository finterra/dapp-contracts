var finMigrate = artifacts.require('./FINMigrate')
const truffleAssert = require('truffle-assertions');
const assert = require("chai").assert;
require('chai')
    .use(require('chai-as-promised'))
    .should();


contract('FIN Migrate', function (accounts) {
    let finInstance;

    before(async function () {
        finInstance = await finMigrate.new()
    })

    var fin = 5 * 10e18;
    var finWithMigRate = 8 * 10e18;
    var invalidfin = 100;

    //EVENTS
    var txUpdate;
    var txMove;

    describe('Record update before setting migration rate', async function(){

        it('Should update with migration rate true', async function () {
            await finInstance.recordUpdate(accounts[1], finWithMigRate, true, { from: accounts[0] }).should.be.rejected;
        })
    })
    describe('set migration rate',async function(){

        it('Should set the migration rate by owner', async function(){
            await finInstance.setMigrationRate(100)
        })
        it('Should reject if migration rate is not set by the owner',async function(){
            finInstance.setMigrationRate(100,{from:accounts[1]}).should.be.rejected;
        })
    })
    describe('Fin record update', function () {

        it('Should update with migration rate true', async function () {
            txUpdate = await finInstance.recordUpdate(accounts[1], finWithMigRate, true, { from: accounts[0] })
            var balance = await finInstance.recordGet.call(accounts[1])
            assert.equal(balance.toNumber(), finWithMigRate, "balance should be (7 *10e18)/100")
        })

        it('Should update without migration rate false', async function () {
            await finInstance.recordUpdate(accounts[2], fin, false, { from: accounts[0] })
            var balance = await finInstance.recordGet.call(accounts[2])
            assert.equal(balance.toNumber(), fin, "balance should be 7 *10e18")
        })

        it('Should be rejected for finPointAmount >= 100000', async function () {
            finInstance.recordUpdate(accounts[3], invalidfin, true, { from: accounts[0] }).should.be.rejected;
        })

        it('it should be called only by the contract owner', async function () {
            finInstance.recordUpdate(accounts[1], fin, true, { from: accounts[1] }).should.be.rejected;
        })
    })

    describe('Fin record move', function () {

        it('Should move record for an existing "from" address and non-existing "to" address', async function () {
            txMove = await finInstance.recordMove(accounts[2], accounts[4], { from: accounts[0] })
            var balance = await finInstance.recordGet.call(accounts[4])
            assert.equal(balance.toNumber(), fin, "balance should be 7 *10e18")
            var balance = await finInstance.recordGet.call(accounts[2])
            assert.equal(balance.toNumber(), 0, "balance should be 0")
        })

        it('Should reject for non existing "from" address', async function () {
            finInstance.recordMove(accounts[2], accounts[3],{ from: accounts[0] }).should.be.rejected;
        })

        it('Should reject for existing "to" address', async function () {
            finInstance.recordMove(accounts[1], accounts[4],{ from: accounts[0] }).should.be.rejected;
        })

        it('Should reject for an invalid new address ', async function () {
            finInstance.recordMove(accounts[1], " ",{ from: accounts[0] }).should.be.rejected;
        })

        it('it should be called only by the contract owner', async function () {
            finInstance.recordMove(accounts[1], accounts[3], { from: accounts[1] }).should.be.rejected;
        })
    })

    describe('Testing Events',function(){

        it('Should emit FINRecordUpdate event for account[1]',async function(){
            truffleAssert.eventEmitted(txUpdate, 'FINRecordUpdate', (ev) => {
                return ev._recordAddress === accounts[1] && ev._finPointAmount.eq(finWithMigRate) && ev._finAmount.eq(finWithMigRate);
            });
        })

        it('Should emit FINRecordMove event for account[2]',async function(){
            truffleAssert.eventEmitted(txMove, 'FINRecordMove', (ev) => {
                return ev._oldAddress === accounts[2] && ev._newAddress === accounts[4] && ev._finAmount.eq(fin);
            });
        })
    })

})

