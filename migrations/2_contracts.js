var FINPointRecord = artifacts.require("./FINPointRecord");
var GTXSwap = artifacts.require("./GTXSwap");
var ERC20 = artifacts.require("./MintableToken");
var FinMigrate = artifacts.require("./FINERC20Migrate");
var TimeLock = artifacts.require("./TimeLock");
var SafeMath = artifacts.require("./SafeMath");


module.exports = function(deployer) {
  //deploy library
  deployer.deploy(SafeMath);
  //link library
  deployer.link(SafeMath, GTXSwap);
  deployer.link(SafeMath, FINPointRecord);
  deployer.link(SafeMath, ERC20);

  //Deploy GTX Swap Contract
  deployer.deploy(GTXSwap);
  //Deploy FinMigrate Contract
  deployer.deploy(FINPointRecord).then(function() {
    // console.log("FINPointRecord.address", FINPointRecord.address);
    //Deploy ERC20 Contract
    deployer
      .deploy(ERC20, FINPointRecord.address, "Fin Token", "FIN", 18)
      .then(function() {
        // console.log("ERC20 contract address", ERC20.address);
      })
      .then(function() {
        deployer.deploy(FinMigrate, ERC20.address).then(function(){
            // console.log("FinMigrate address", FinMigrate.address);
        });
        deployer.deploy(TimeLock, ERC20.address).then(function() {
          // console.log("TimeLock contract address", TimeLock.address);
        });
      });
  });
};
