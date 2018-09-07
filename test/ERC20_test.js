var MintableToken = artifacts.require("./MintableToken");
var FINPointRecord = artifacts.require("./FINPointRecord");
var FinMigrate = artifacts.require("./FINERC20Migrate");
var TimeLock = artifacts.require("./TimeLock");

var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const assert = require("chai").assert;
require("chai")
  .use(require("chai-as-promised"))
  .should();
const pv = "0x6929676b180d25d2182516811adda52e8b0a18b7052abb8c66fd08608c58990f";

contract("Mintable Token", function(accounts) {
  //Global variables
  var finInstance;
  var mintableToken;
  var finERCMigrate;
  var timeLockIns;

  //Fin Record Balance
  record1 = 80 * 10e18;
  record2 = 50 * 10e18;
  record3 = 30 * 10e18;
  record4 = 20 * 10e18;

  describe("Testing Mintable contract", function() {
    before(
      "Should return FINPointRecord instance and deploy mintable contract",
      async function() {
        finInstance = await FINPointRecord.deployed();
        await finInstance.setClaimRate(100);
        mintableToken = await MintableToken.new(
          finInstance.address,
          "Fin Token",
          "FIN",
          18,
          { from: accounts[0] }
        );
        console.log("mintableToken",mintableToken.address)
        finERCMigrate = await FinMigrate.new(mintableToken.address)
        timeLockIns = await TimeLock.new(mintableToken.address)
      }
    );

    /*********
     * Creating Fin Point Record in Contract
     * First 4 accounts in ganache has been created
     * ************/

    it("Should update FinMigrate Records", async function() {
      await finInstance.recordUpdate(accounts[1], record1, true, {
        from: accounts[0]
      });
      await finInstance.recordUpdate(accounts[2], record2, true, {
        from: accounts[0]
      });
      await finInstance.recordUpdate(accounts[3], record3, true, {
        from: accounts[0]
      });
      await finInstance.recordUpdate(accounts[4], record4, true, {
        from: accounts[0]
      });
    });

    /***********
     * Claiming fins for all 4 accounts
     *************/
    it("Claim Should mint and transfer tokens for successfull kyc", async function() {
      //claiming for acocunt1
      //creating message hash including the address and kyc value
      var message = accounts[1] + 1; //here 1 denotes true where the kyc has verified
      var response = web3.eth.accounts.sign(message, pv);
      var msgHash = response.messageHash;
      var v = parseInt(response.v, 16);
      var r = response.r;
      var s = response.s;
      await mintableToken.claim(msgHash, v, r, s, { from: accounts[1] });
      balance = await mintableToken.balanceOf.call(accounts[1]);
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
      await mintableToken.claim(msgHash, v, r, s, { from: accounts[2] });
      balance = await mintableToken.balanceOf.call(accounts[2]);
      assert.equal(
        balance.toNumber(),
        record2,
        "Claimed Balance should be updated"
      );

      //claiming for acocunt3
      var message = accounts[3] + 1; //here 1 denotes true where the kyc has verified
      var response = web3.eth.accounts.sign(message, pv);
      var msgHash = response.messageHash;
      var v = parseInt(response.v, 16);
      var r = response.r;
      var s = response.s;
      await mintableToken.claim(msgHash, v, r, s, { from: accounts[3] });
      balance = await mintableToken.balanceOf.call(accounts[3]);
      assert.equal(
        balance.toNumber(),
        record3,
        "Claimed Balance should be updated"
      );
    });

    it("Claim should be rejected for unsuccessful kyc", async function() {
      //claiming for acocunt4
      var message = accounts[4] + 0; //here 0 denotes true where the kyc is not verified
      var response = web3.eth.accounts.sign(message, pv);
      var msgHash = response.messageHash;
      var v = parseInt(response.v, 16);
      var r = response.r;
      var s = response.s;
      await mintableToken.claim(msgHash, v, r, s, {
        from: accounts[4]
      }).should.be.rejected;
    });

    it("Claim Should not mint for non Existing record", async function() {
      //claiming for acocunt5
      var message = accounts[5] + 1; //here 0 denotes true where the kyc is not verified
      var response = web3.eth.accounts.sign(message, pv);
      var msgHash = response.messageHash;
      var v = parseInt(response.v, 16);
      var r = response.r;
      var s = response.s;
      await mintableToken.claim(msgHash, v, r, s, {
        from: accounts[5]
      }).should.be.rejected;
    });

    it("Claim should reject if its already claimed", async function() {
      var message = accounts[3] + 1; //here 1 denotes true where the kyc has verified
      var response = web3.eth.accounts.sign(message, pv);
      var msgHash = response.messageHash;
      var v = parseInt(response.v, 16);
      var r = response.r;
      var s = response.s;
      await mintableToken.claim(msgHash, v, r, s, {
        from: accounts[3]
      }).should.be.rejected;
    });

    it("Total supply should be equal to the minted tokens", async function() {
      var expectedTotal = record1 + record2 + record3;
      totalSupply = await mintableToken.totalSupply.call();
      assert.equal(
        totalSupply.toNumber(),
        expectedTotal,
        "Total supply should be equal to total record balance"
      );
    });

    it("Mint should be not possible directly", async function() {
      try {
        await mintableToken.mint(accounts[4], record1).should.be.rejected;
      } catch (error) {
        console.log("mintableToken.mint is not a function");
      }
    });
  });
  /*******
   * Updating TimeLock and FinERC0 Mihgrate address in ERC20 contract
   * **********/
  describe("Updating TimeLock Address and Fin Migrate address", async function(){

    it("should setMigrationAddress", async function() {
        await mintableToken.setMigrationAddress(finERCMigrate.address)
    })
    it("should timeLockAddress", async function() {
        await mintableToken.setTimeLockAddress(timeLockIns.address)
    })
  })

  /*****
   * Testing all standard token functions before migration
   */
  describe("Testing Standard Token", function() {
    it("Should transfer tokens to account5", async function() {
      await mintableToken.transfer(accounts[5], record1 / 2, {
        from: accounts[1]
      });
      balance = await mintableToken.balanceOf.call(accounts[5]);
      assert.equal(
        balance.toNumber(),
        record1 / 2,
        "Transferred balance should be updated"
      );
    });

    it(" approve function- account3 Should get approval from account2 to spend 25 Fins", async function() {
      await mintableToken.approve(accounts[3], record2 / 2, {
        from: accounts[2]
      });
    });

    it("Should update the allowance for account3", async function() {
      var allowance = await mintableToken.allowance.call(
        accounts[2],
        accounts[3]
      );
      assert.equal(allowance.toNumber(), record2 / 2, "Update allowance");
    });

    it("trasnferFrom function- Should trasnfer 25fins from acocunt3 to account 4", async function() {
      await mintableToken.transferFrom(accounts[2], accounts[4], record2 / 2, {
        from: accounts[3]
      });
      balance = await mintableToken.balanceOf.call(accounts[4]);
      assert.equal(
        balance.toNumber(),
        record2 / 2,
        "Transferred balance should be updated"
      );
      var allowance = await mintableToken.allowance.call(
        accounts[2],
        accounts[3]
      );
      assert.equal(allowance.toNumber(), 0, "Update allowance");
    });

    it("Should increase approval", async function() {
      await mintableToken.increaseApproval(accounts[3], record4 / 2, {
        from: accounts[2]
      });
      var allowance = await mintableToken.allowance.call(
        accounts[2],
        accounts[3]
      );
      assert.equal(allowance.toNumber(), record4 / 2, "Update allowance");
    });

    it("Should decrease approval", async function() {
      await mintableToken.decreaseApproval(accounts[3], record4 / 2, {
        from: accounts[2]
      });
      var allowance = await mintableToken.allowance.call(
        accounts[2],
        accounts[3]
      );
      assert.equal(allowance.toNumber(), 0, "Update allowance");
    });

    it("transferFrom should be rejected for nill allowance", async function() {
      await mintableToken.transferFrom(accounts[2], accounts[4], record2 / 2, {
        from: accounts[3]
      }).should.be.rejected;
    });

    it("transferFrom should be rejected before approval", async function() {
      await mintableToken.transferFrom(accounts[3], accounts[4], record2 / 2, {
        from: accounts[4]
      }).should.be.rejected;
    });
  });

  /*****
   * startMigration to migrate all tokens to gallactic network
   */
  describe('Migration of Fin points to gallactic network', function(){
    it('should start migration by the owner', async function(){
      await mintableToken.startMigration({from:accounts[1]}).should.be.rejected;
     })

    it('should start migration by the owner', async function(){
     await mintableToken.startMigration();
    })

    it('transfer should not be possible after migration directly', async function() {
      balance = await mintableToken.balanceOf.call(accounts[1]);
      if(balance.toNumber() >= record1 / 4) {
        await mintableToken.transfer(accounts[5], record1 / 4, {
          from: accounts[1]
        }).should.be.rejected;
      }
    })

    it("Should approve timelock contract to transfer tokens", async function() {
      var balance = await mintableToken.balanceOf.call(accounts[2])
      if (balance >= record2/2 ) {
        await mintableToken.approve(timeLockIns.address, record2 /2, {
          from: accounts[2]
        });
      }
    })

    it(" Should lock tokens in timelock contract", async function() {
      var allowance = await mintableToken.allowance.call(
        accounts[2],
        timeLockIns.address
      );
      if (allowance > 0 ) {
        await timeLockIns.timeLockTokens(10,{from:accounts[2]}) //locking tokens for 10 seconds
      }
      balance = await mintableToken.balanceOf.call(timeLockIns.address);
      assert.equal(balance.toNumber(),record2 / 2,"Transferred balance should be updated");
    })

    it("Should return locked token balance ", async function() {
        var lockedtokens = await timeLockIns.getLockedFunds(accounts[2])
        assert.equal(lockedtokens.toNumber(),record2/2,"locked funds should be equal to record2/2")
    })
    it("Should return getReleaseTime ", async function() {
      var start = Date.now();
      var releaseTime = await timeLockIns.getReleaseTime(accounts[2])
    })
    it(" Should reject timelock release before 10 seconds", async function() {
      await timeLockIns.tokenRelease({from:accounts[2]}).should.be.rejected;
    })
  })

  describe("Testing Claimable contract", async function() {
    it("Should update transferMigrationSource contract address", async function() {
      finContract = await FINPointRecord.new(100);
      await mintableToken.transferMigrationSource(finContract.address, {
        from: accounts[0]
      });
    });

    it("Should get rejected as there are no records in the new FIn migration contract", async function() {
      await mintableToken.claim({ from: accounts[1] }).should.be.rejected;
    });
  });

  describe("Update finishMint", async function() {
    it("Should finishMint by owner", async function() {
      await mintableToken.finishMinting();
    });

    it("Should reject finishMint not by the owner", async function() {
      await mintableToken.finishMinting({
        from: accounts[1]
      }).should.be.rejected;
    });

    it("Should reject claim after finishMint", async function() {
      await mintableToken.claim({ from: accounts[1] }).should.be.rejected;
    });
  });

});
