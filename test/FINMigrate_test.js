var FINPointRecord = artifacts.require("./FINPointRecord");
var MintableToken = artifacts.require("./MintableToken");
var FinMigrate = artifacts.require("./FINERC20Migrate");
var TimeLock = artifacts.require("./TimeLock");

var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const assert = require("chai").assert;
require("chai")
  .use(require("chai-as-promised"))
  .should();
const pv = "0x6929676b180d25d2182516811adda52e8b0a18b7052abb8c66fd08608c58990f";

contract("FIN Migrate ", function(accounts) {
  //Global variables
  let finRecordIns;
  let mintableTokenIns;
  let finMigrateIns;
  var timeLockIns;

  //Fin Record Balance
  record1 = 80 * 10e18;
  record2 = 50 * 10e18;

  describe("Update sample records and claim fins", function() {
    before(
      "Should return Fin Migrate, ERC20 and TimeLock instance",
      async function() {
        finRecordIns = await FINPointRecord.deployed();
        await finRecordIns.setClaimRate(100);
        mintableTokenIns = await MintableToken.new(
          finRecordIns.address,
          "Fin Token",
          "FIN",
          18
        );
        finMigrateIns = await FinMigrate.new(mintableTokenIns.address);
        timeLockIns = await TimeLock.new(mintableTokenIns.address)
      }
    );

    it("Should update FinMigrate Records", async function() {
      await finRecordIns.recordUpdate(accounts[1], record1, true, {
        from: accounts[0]
      });
      await finRecordIns.recordUpdate(accounts[2], record2, true, {
        from: accounts[0]
      });
    });

    it("Claim Should mint and transfer tokens to the finMigrate record", async function() {
      //claiming for acocunt1
      //creating message hash including the address and kyc value
      var message = accounts[1] + 1; //here 1 denotes true where the kyc has verified
      var response = web3.eth.accounts.sign(message, pv);
      var msgHash = response.messageHash;
      var v = parseInt(response.v, 16);
      var r = response.r;
      var s = response.s;
      await mintableTokenIns.claim(msgHash, v, r, s, { from: accounts[1] });
      balance = await mintableTokenIns.balanceOf.call(accounts[1]);
      assert.equal(
        balance.toNumber(),
        record1,
        "Claimed Balance should be updated"
      );

      // claiming for acocunt2
      var message = accounts[2] + 1; //here 1 denotes true where the kyc has verified
      var response = web3.eth.accounts.sign(message, pv);
      var msgHash = response.messageHash;
      var v = parseInt(response.v, 16);
      var r = response.r;
      var s = response.s;
      await mintableTokenIns.claim(msgHash, v, r, s, { from: accounts[2] });
      balance = await mintableTokenIns.balanceOf.call(accounts[2]);
      assert.equal(
        balance.toNumber(),
        record2,
        "Claimed Balance should be updated"
      );
    });
  });

  /*******
   * Updating TimeLock and FinERC0 Mihgrate address in ERC20 contract
   * **********/
  describe("Updating TimeLock Address and Fin Migrate address", async function(){
    it("should setMigrationAddress", async function() {
        await mintableTokenIns.setMigrationAddress(finMigrateIns.address)
    })
    it("should timeLockAddress", async function() {
        await mintableTokenIns.setTimeLockAddress(timeLockIns.address)
    })
  })

  describe("Start migrtation and migrate fins to galalctic", function() {
    it("should start migration by the owner", async function() {
      await mintableTokenIns.startMigration();
    });
  });

  describe("Migrate fin balance to gallactic network", function() {
        it("Should initiate migration for the account1 fins to gtx", async function() {
            balance = await mintableTokenIns.balanceOf.call(accounts[1]);
            await finMigrateIns.initiateMigration(record1,{from:accounts[1]})
            var migratableFins= await finMigrateIns.getFINMigrationRecord.call(accounts[1])
            assert.equal(migratableFins.toNumber(),balance.toNumber(),"Migratable fins should be equal to the balance of account1")
        })
  })

});
