pragma solidity ^0.4.24;

import "../../FIN-POINT-RECORD/contracts/FINPointRecord.sol";
import "../../OWNABLE/Ownable.sol";

/**
 * @title Claimable
 * @dev The Claimable contract has an claim contract address, and provides basic authorization control
 * for the minting functions, this simplifies the implementation of "minting permissions".
 */


contract Claimable is Ownable {
    // FINPointRecord var definition
    FINPointRecord finPointRecordContract;

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
    constructor(FINPointRecord _finPointRecordContract) public {
        finPointRecordContract = _finPointRecordContract;
    }

    /**
    * @dev Throws if called by any account other than the claimContract.
    */
    modifier canClaim() {
        require(finPointRecordContract.recordGet(msg.sender) != 0);
        require(claimed[msg.sender] == false);
        _;
    }

    /**
    * @dev Allows to change the migration information source contract.
    * @param _newMigrationContract The address of the new migration contract
    */
    function transferMigrationSource(FINPointRecord _newMigrationContract) public onlyOwner {
        _transferMigrationSource(_newMigrationContract);
    }

    /**
    * @dev Transfers the reference of the recorded migrations contract to a newMigrationContract.
    * @param _newMigrationContract The address of the new migration contract
    */
    function _transferMigrationSource(FINPointRecord _newMigrationContract) internal {
        require(_newMigrationContract != address(0));
        emit MigrationSourceTransferred(finPointRecordContract, _newMigrationContract);
        finPointRecordContract = _newMigrationContract;
    }
}