var finRecord = artifacts.require('./FINPointRecord')
const truffleAssert = require('truffle-assertions');
const assert = require("chai").assert;
require('chai')
    .use(require('chai-as-promised'))
    .should();


contract('FIN Migrate', function (accounts) {
    let finInstance;

    before(async function () {
        finInstance = await finRecord.new()
    })
    const claimRate = 100

    var fin = 5 * 10e18;
    var finWithMigRate = 8 * 10e18;
    var finWithMigRate1 = 9 * 10e18;
    var invalidfin = 100;
    var invalidfin1 = 9 * 10e17;

    //EVENTS
    var txCreate;
    var txUpdate;
    var txMove;

    describe('Record update before setting migration rate', async function(){

        it('Should reject before setting migration rate', async function () {
            await finInstance.recordCreate(accounts[1], finWithMigRate, true, { from: accounts[0] }).should.be.rejected;
        })
    })
    describe('set migration rate',async function(){

        it('Should set the migration rate by owner', async function(){
            await finInstance.setClaimRate(claimRate)
        })
        it('Should reject if migration rate is not set by the owner',async function(){
            finInstance.setClaimRate(claimRate,{from:accounts[1]}).should.be.rejected;
        })
    })
    describe('Fin record Create', function () {

        it('Should update with migration rate true', async function () {
            txCreate = await finInstance.recordCreate(accounts[1], finWithMigRate, true, { from: accounts[0] })
            var balance = await finInstance.recordGet.call(accounts[1])
            assert.equal(balance.toNumber(), finWithMigRate, "balance should be (8 *10e18)")
        })

        it('Should update without migration rate false', async function () {
            await finInstance.recordCreate(accounts[2], fin, false, { from: accounts[0] })
            var balance = await finInstance.recordGet.call(accounts[2])
            assert.equal(balance.toNumber(), fin, "balance should be 8 *10e18")
        })

        it('Should update for the same address different finPoint', async function () {
            txCreate = await finInstance.recordCreate(accounts[1], finWithMigRate1, true, { from: accounts[0] })
            var balance = await finInstance.recordGet.call(accounts[1])
            assert.equal(balance.toNumber(), finWithMigRate+finWithMigRate1, "balance should be (17 *10e18)")
        })

        it('Should be rejected for null address', async function () {
            finInstance.recordCreate("accounts[3]", finWithMigRate, true, { from: accounts[0] }).should.be.rejected;
        })

        it('Should be rejected for finPointAmount >= 100000', async function () {
            finInstance.recordCreate(accounts[3], invalidfin, true, { from: accounts[0] }).should.be.rejected;
        })

        it('Should be updated for finPointAmount less than 18 decimal points', async function () {
            await finInstance.recordCreate(accounts[3], invalidfin1, true, { from: accounts[0] })
        })

        it('it should be called only by the contract owner', async function () {
            finInstance.recordCreate(accounts[1], fin, true, { from: accounts[1] }).should.be.rejected;
        })
    })
    describe('Fin record Update', function () {

        it('Should update the existing record with the new value', async function() {
            await finInstance.recordUpdate(accounts[1], finWithMigRate,true,{from:accounts[0]})
            var balance = await finInstance.recordGet.call(accounts[1])
            assert.equal(balance.toNumber(), finWithMigRate, "balance should be (8 *10e18)")
        })
    })
    describe('Fin record move', function () {

        it('Should move record for an existing "from" address and non-existing "to" address', async function () {
            txMove = await finInstance.recordMove(accounts[2], accounts[4], { from: accounts[0] })
            var balance = await finInstance.recordGet.call(accounts[4])
            assert.equal(balance.toNumber(), fin, "balance should be 8 *10e18")
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

        it('Should emit FINRecordCreate event for account[1]',async function(){
            truffleAssert.eventEmitted(txCreate, 'FINRecordCreate', (ev) => {
                return ev._recordAddress === accounts[1] && ev._finPointAmount.eq(finWithMigRate1) && ev._finERC20Amount.eq(finWithMigRate1+finWithMigRate);
            });
        })

        it('Should emit FINRecordMove event for account[2]',async function(){
            truffleAssert.eventEmitted(txMove, 'FINRecordMove', (ev) => {
                return ev._oldAddress === accounts[2] && ev._newAddress === accounts[4] && ev._finERC20Amount.eq(fin);
            });
        })
    })

})

