pragma solidity ^0.4.24;
/**
    The MIT License (MIT)

    Copyright (c) 2018 Finterra Technologies Sdn Bhd.

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

import "../../OWNABLE/Ownable.sol";
import "../../MATH/SafeMath.sol";

/**
 * @title FINMigrate
 * @author Terry Wilkinson <terry.wilkinson@finterra.org>
 * @dev The FINMigrate contract is used for current FIN point holders
 * to move thier held FIN points to ERC-20 FIN tokens which will be claimable
 * after the audit period. This contract in particular is for onboarding and
 * storing the resulting FIN ERc20 amount records.
 * These records will be used as reference for claiming ERC20 FINs on the Ethereum network.
 */

contract FINMigrate is Ownable {
    using SafeMath for uint256;

    // migrationRate is the multiplier to calculate the number of FIN ERC20 claimable per FIN point migrated
    // e.g., 100 = 1:1 migration ratio
    // this migration rate can be seen as a kind of airdrop for exsisting FIN point holders at the time of migration
    uint256 migrationRate;

    // an address map used to store the per account claimable FIN ERC20 record
    // as a result of swapped FIN points
    mapping (address => uint256) public claimableFIN;

    event FINRecordUpdate(
        address indexed _recordAddress,
        uint256 _finPointAmount,
        uint256 _finAmount
    );

    event FINRecordMove(
        address indexed _oldAddress,
        address indexed _newAddress,
        uint256 _finAmount
    );

    /**
     * Throws if migration rate is not set
    */
    modifier canMigrate() {
        require(migrationRate >0);
        _;
    }
    /**
     * @dev sets the migration rate for fins
     * @param _migrationRate is the migration rate applied during record creation
    */
    function setMigrationRate(uint256 _migrationRate) public onlyOwner{
        require(_migrationRate <= 1000); // maximum 10x migration rate
        require(_migrationRate >= 100); // minimum 1x migration rate
        migrationRate = _migrationRate;
    }

    /**
    * @dev Used to calculate and store the amount of claimable FIN ERC20 from existing FIN point balances
    * @param _recordAddress - the registered address assigned to FIN ERC20 claiming
    * @param _finPointAmount - the original amount of FIN points to be migrated, this param should always be entered as base units
    * i.e., 1 FIN = 10**18 base units
    * @param _applyMigrationRate - flag to apply migration rate or not, any Finterra Technologies company FIN point allocations
    * are strictly migrated at one to one and do not recive the migration (airdrop) bonus applied to FIN point user balances
    */
    function recordUpdate(address _recordAddress, uint256 _finPointAmount, bool _applyMigrationRate) public onlyOwner canMigrate{
        require(_finPointAmount >= 100000); // minimum allowed FIN 0.000000000001 (in base units) to avoid large rounding errors

        uint afterMigrationFIN;

        if(_applyMigrationRate == true) {
            afterMigrationFIN = _finPointAmount.mul(migrationRate).div(100);
        } else {
            afterMigrationFIN = _finPointAmount;
        }

        claimableFIN[_recordAddress] = claimableFIN[_recordAddress].add(afterMigrationFIN);

        emit FINRecordUpdate(_recordAddress, _finPointAmount, claimableFIN[_recordAddress]);
    }

    /**
    * @dev Used to move FIN ERC20 records from one address to another, primarily in case a user has lost access to their originally registered account
    * @param _oldAddress - the original registered address
    * @param _newAddress - the new registerd address
    */
    function recordMove(address _oldAddress, address _newAddress) public onlyOwner canMigrate{
        require(claimableFIN[_oldAddress] != 0);
        require(claimableFIN[_newAddress] == 0);

        claimableFIN[_newAddress] = claimableFIN[_oldAddress];
        claimableFIN[_oldAddress] = 0;

        emit FINRecordMove(_oldAddress, _newAddress, claimableFIN[_newAddress]);
    }

    /**
    * @dev Used to retrieve the FIN ERC20 migration records for an address, for FIN ERC20 claiming
    * @param _recordAddress - the registered address where FIN ERC20 tokens can be claimed
    * @return uint256 - the amount of recorded FIN ERC20 after FIN point migration
    */
    function recordGet(address _recordAddress) view public returns (uint256) {
        return claimableFIN[_recordAddress];
    }
}