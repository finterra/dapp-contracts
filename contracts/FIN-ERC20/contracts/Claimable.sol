pragma solidity ^0.4.24;

import "../../FIN-MIGRATE/contracts/FINMigrate.sol";
import "../../OWNABLE/Ownable.sol";

/**
 * @title Claimable
 * @dev The Claimable contract has an claim contract address, and provides basic authorization control
 * for the minting functions, this simplifies the implementation of "minting permissions".
 */


contract Claimable is Ownable {
    //FINMigrate var definition
    FINMigrate finMigrationContract;

    // an address map used to store the cliamed flag, so accounts cannot claim more than once
    mapping (address => bool) public claimed;

    event MigrationSourceTransferred(
        address indexed previousMigrationContract,
        address indexed newMigrationContract
    );


    /**
    * @dev The Claimable constructor sets the original `claim contract` to the provided _claimContract
    * account.
    */
    constructor(FINMigrate _finMigrationContract) public {
        finMigrationContract = _finMigrationContract;
    }

    /**
    * @dev Throws if called by any account other than the claimContract.
    */
    modifier canClaim() {
        require(finMigrationContract.recordGet(msg.sender) != 0);
        require(claimed[msg.sender] == false);
        _;
    }

    /**
    * @dev Allows to change the migration information source contract.
    * @param _newMigrationContract The address of the new migration contract
    */
    function transferMigrationSource(FINMigrate _newMigrationContract) public onlyOwner {
        _transferMigrationSource(_newMigrationContract);
    }

    /**
    * @dev Transfers the reference of the recorded migrations contract to a newMigrationContract.
    * @param _newMigrationContract The address of the new migration contract
    */
    function _transferMigrationSource(FINMigrate _newMigrationContract) internal {
        require(_newMigrationContract != address(0));
        emit MigrationSourceTransferred(finMigrationContract, _newMigrationContract);
        finMigrationContract = _newMigrationContract;
    }
}