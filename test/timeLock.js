var FINPointRecord = artifacts.require("./FINPointRecord");
let TimeLock = artifacts.require("./TimeLock");
let MintableToken = artifacts.require("./MintableToken");
var FinMigrate = artifacts.require("./FINERC20Migrate");

var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const truffleAssert = require("truffle-assertions");
const assert = require("chai").assert;
require("chai")
  .use(require("chai-as-promised"))
  .should();

const pv = "0x6929676b180d25d2182516811adda52e8b0a18b7052abb8c66fd08608c58990f";

contract("Fin TimeLock Contract", function(accounts) {
  //Global variables
  let finRecordIns;
  let mintableTokenIns;
  let timeLockIns;
  let finMigrateIns;

  //Fin Record Balance
  record1 = 80 * 10e18;
  record2 = 50 * 10e18;

  describe("Creating sample FIN records and claiming fins", async function() {
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
        finMigrateIns = await FinMigrate.new(mintableTokenIns.address)
        timeLockIns = await TimeLock.new(mintableTokenIns.address);
      }
    );

    it("Should update FinMigrate Records", async function() {
      await finRecordIns.recordCreate(accounts[1], record1, true, {
        from: accounts[0]
      });
      await finRecordIns.recordCreate(accounts[2], record2, true, {
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
      // claiming for acocunt2
      var message = accounts[2] + 1; //here 1 denotes true where the kyc has verified
      var response = web3.eth.accounts.sign(message, pv);
      var msgHash = response.messageHash;
      var v = parseInt(response.v, 16);
      var r = response.r;
      var s = response.s;
      await mintableTokenIns.claim(msgHash, v, r, s, { from: accounts[2] });
    });
  });

  /*******
   * Updating TimeLock and FinERC0 Mihgrate address in ERC20 contract
   * **********/
  describe("Updating TimeLock Address and Fin Migrate address", async function() {
    it("should setMigrationAddress", async function() {
      await mintableTokenIns.setMigrationAddress(finMigrateIns.address);
    });
    it("should timeLockAddress", async function() {
      await mintableTokenIns.setTimeLockAddress(timeLockIns.address);
    });
  });

  /*****
   * startMigration to migrate all tokens to gallactic network
   */
  describe('Migration of Fin points to gallactic network', function(){
    it('should start migration by the owner', async function(){
      await mintableTokenIns.startMigration({from:accounts[1]}).should.be.rejected;
     })

    it('should start migration by the owner', async function(){
     await mintableTokenIns.startMigration();
    })

    it("Should approve timelock contract to transfer tokens", async function() {
      var balance = await mintableTokenIns.balanceOf.call(accounts[2])
      if (balance >= record2/2 ) {
        await mintableTokenIns.approve(timeLockIns.address, record2 /2, {
          from: accounts[2]
        });
      }
    })

    it(" Should lock tokens in timelock contract", async function() {
      var allowance = await mintableTokenIns.allowance.call(
        accounts[2],
        timeLockIns.address
      );
      if (allowance > 0 ) {
        await timeLockIns.timeLockTokens(10,{from:accounts[2]}) //locking tokens for 10 seconds
      }
      balance = await mintableTokenIns.balanceOf.call(timeLockIns.address);
      assert.equal(balance.toNumber(),record2 / 2,"Transferred balance should be updated");
    })

    it("Should return locked token balance ", async function() {
        var lockedtokens = await timeLockIns.getLockedFunds(accounts[2])
        assert.equal(lockedtokens.toNumber(),record2/2,"locked funds should be equal to record2/2")
    })

    it(" Should reject timelock release before 10 seconds", async function() {
      await timeLockIns.tokenRelease({from:accounts[2]}).should.be.rejected;
    })

    it(" Should release tokens after 10 seconds", async function() {
      await timeout(10000);
      await timeLockIns.tokenRelease({from:accounts[2]})
      var balance = await mintableTokenIns.balanceOf.call(accounts[2])
      assert.equal(balance.toNumber(),record2/2,"balance should be equal to record2/2")
    })

  })

});


function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
