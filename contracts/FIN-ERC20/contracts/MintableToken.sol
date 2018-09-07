pragma solidity ^0.4.24;
/**
    The MIT License (MIT)

    Copyright (c) 2016 Smart Contract Solutions, Inc.

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be included
    in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
**/
/**
*  We have adapted the minting functionality to only mint tokens based on the Finterra deployed claim function
*  Thus we have renamed and slightly changed the Ownable.sol depedancy to Claimable.sol which requires a FINClaim.sol contract address during deployment.
*  This means that only FIN ERC20 tokens correlating to FIN point migration records can be minted (migration record contract address defined in FINClaim.sol)
*  We have also inherited StandardToken to implement all Standard Token functionalities
*/
import "./StandardToken.sol";
import "./Claimable.sol";
import "../../FIN-POINT-RECORD/contracts/FINPointRecord.sol";
import "../../FIN-ERC20-MIGRATE/contracts/FINERC20Migrate.sol";
import "../../TIMELOCK/contracts/TimeLock.sol";

/**
* @title Mintable, Claimable, Migratable token
* @dev Simple ERC20 Token example, with mintable token creation, with incoming claiming via records, and with eventual migration to the Gallactic network
* Based on code by TokenMarketNet: https://github.com/TokenMarketNet/ico/blob/master/contracts/MintableToken.sol
*/
contract MintableToken is StandardToken, Claimable {
    event Mint(address indexed to, uint256 amount);
    event MintFinished();
    event SetMigrationAddress(address _finERC20MigrateAddress);
    event SetTimeLockAddress(address _timeLockAddress);
    event MigrationStarted();
    event Migrated(address indexed account, uint256 amount);

    bool public mintingFinished = false;

    // var for storing the the FINERC20Migrate contract deployment address (for migration to the GALLACTIC network)
    FINERC20Migrate finERC20MigrationContract;

    modifier canMint() {
        require(!mintingFinished);
        _;
    }

    /**
     * @dev Modifier allowing only the set FINERC20Migrate.sol deployment to call a function
    */
    modifier onlyMigrate {
        require(msg.sender == address(finERC20MigrationContract));
        _;
    }

    /**
    * @dev Constructor to pass the finPointMigrationContract address to the Claimable constructor
    */
    constructor(FINPointRecord _finPointRecordContract, string _name, string _symbol, uint8 _decimals)

    Claimable(_finPointRecordContract)
    StandardToken(_name, _symbol, _decimals) public {

    }

    /**
    * @dev Allows addresses with FIN migration records to claim thier ERC20 FIN tokens. This is the only way minting can occur.
    * @param _msgHash is the hash of the message
    */
    function claim(bytes32 _msgHash, uint8 v, bytes32 r, bytes32 s) public canClaim {
        address signingAddress = ecrecover(_msgHash, v, r, s);
        require(signingAddress == owner);
        bytes memory prefix = "\x19Ethereum Signed Message:\n";
        require(keccak256(abi.encodePacked(prefix, "21", msg.sender, true)) == _msgHash);
        claimed[msg.sender] = true;
        mint(msg.sender, finPointRecordContract.recordGet(msg.sender));
    }

    /**
    * @dev Function to mint tokens
    * @param _to The address that will receive the minted tokens.
    * @param _amount The amount of tokens to mint.
    * @return A boolean that indicates if the operation was successful.
    */
    function mint(
        address _to,
        uint256 _amount
    )
        canMint
        private
        returns (bool)
    {
        totalSupply_ = totalSupply_.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        emit Mint(_to, _amount);
        emit Transfer(address(0), _to, _amount);
        return true;
    }

    /**
    * @dev Function to stop all minting of new tokens.
    * @return True if the operation was successful.
    */
    function finishMinting() public onlyOwner canMint returns (bool) {
        mintingFinished = true;
        emit MintFinished();
        return true;
    }

   /**
    * @dev Function to set the migration contract address
    * @return True if the operation was successful.
    */
    function setMigrationAddress(FINERC20Migrate _finERC20MigrationContract) public onlyOwner returns (bool) {
        // check that this FIN ERC20 deployment is the migration contract's attached ERC20 token
        require(_finERC20MigrationContract.getERC20() == address(this));

        finERC20MigrationContract = _finERC20MigrationContract;
        emit SetMigrationAddress(_finERC20MigrationContract);
        return true;
    }

   /**
    * @dev Function to set the TimeLock contract address
    * @return True if the operation was successful.
    */
    function setTimeLockAddress(TimeLock _timeLockContract) public onlyOwner returns (bool) {
        // check that this FIN ERC20 deployment is the timelock contract's attached ERC20 token
        require(_timeLockContract.getERC20() == address(this));

        timeLockContract = _timeLockContract;
        emit SetTimeLockAddress(_timeLockContract);
        return true;
    }

   /**
    * @dev Function to start the migration period
    * @return True if the operation was successful.
    */
    function startMigration() onlyOwner public returns (bool) {
        require(migrationStart == false);
        // check that the FIN migration contract address is set
        require(finERC20MigrationContract != address(0));
        // // check that the TimeLock contract address is set
        require(timeLockContract != address(0));

        migrationStart = true;
        emit MigrationStarted();

        return true;
    }

    /**
     * @dev Function to modify the FIN ERC-20 balance in compliance with migration to FIN ERC-777 on the GALLACTIC Network
     *      - called by the FIN-ERC20-MIGRATE FINERC20Migrate.sol Migration Contract to record the amount of tokens to be migrated
     * @dev modifier onlyMigrate - Permissioned only to the deployed FINERC20Migrate.sol Migration Contract
     * @param _account The Ethereum account which holds some FIN ERC20 balance to be migrated to Gallactic
     * @param _amount The amount of FIN ERC20 to be migrated
    */
    function migrateTransfer(address _account, uint256 _amount) onlyMigrate public returns (uint256) {

        require(migrationStart == true);

        uint256 userBalance = balanceOf(_account);
        require(userBalance >= _amount);

        emit Migrated(_account, _amount);

        balances[_account] = balances[_account].sub(_amount);

        return _amount;
    }

}