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
 * @title FINPointRecord
 * @author Terry Wilkinson <terry.wilkinson@finterra.org> & Toniya Sundaram <toniya.sundaram@finterra.org>
 * @dev The FINPointRecord contract is used for current FIN point holders
 * to move thier held FIN points to ERC-20 FIN tokens which will be claimable
 * after the audit period. This contract in particular is for onboarding and
 * storing the resulting FIN ERc20 amount records.
 * These records will be used as reference for claiming ERC20 FINs on the Ethereum network.
 */

contract FINPointRecord is Ownable {
    using SafeMath for uint256;

    // claimRate is the multiplier to calculate the number of FIN ERC20 claimable per FIN points reorded
    // e.g., 100 = 1:1 claim ratio
    // this claim rate can be seen as a kind of airdrop for exsisting FIN point holders at the time of claiming
    uint256 claimRate;

    // an address map used to store the per account claimable FIN ERC20 record
    // as a result of swapped FIN points
    mapping (address => uint256) public claimableFIN;

    event FINRecordCreate(
        address indexed _recordAddress,
        uint256 _finPointAmount,
        uint256 _finERC20Amount
    );

    event FINRecordUpdate(
        address indexed _recordAddress,
        uint256 _finPointAmount,
        uint256 _finERC20Amount
    );

    event FINRecordMove(
        address indexed _oldAddress,
        address indexed _newAddress,
        uint256 _finERC20Amount
    );

    /**
     * Throws if claim rate is not set
    */
    modifier canRecord() {
        require(claimRate > 0);
        _;
    }
    /**
     * @dev sets the claim rate for FIN ERC20
     * @param _claimRate is the claim rate applied during record creation
    */
    function setClaimRate(uint256 _claimRate) public onlyOwner{
        require(_claimRate <= 1000); // maximum 10x migration rate
        require(_claimRate >= 100); // minimum 1x migration rate
        claimRate = _claimRate;
    }

    /**
    * @dev Used to calculate and store the amount of claimable FIN ERC20 from existing FIN point balances
    * @param _recordAddress - the registered address assigned to FIN ERC20 claiming
    * @param _finPointAmount - the original amount of FIN points to be moved, this param should always be entered as base units
    * i.e., 1 FIN = 10**18 base units
    * @param _applyClaimRate - flag to apply the claim rate or not, any Finterra Technologies company FIN point allocations
    * are strictly moved at one to one and do not recive the claim (airdrop) bonus applied to FIN point user balances
    */
    function recordCreate(address _recordAddress, uint256 _finPointAmount, bool _applyClaimRate) public onlyOwner canRecord {
        require(_finPointAmount >= 100000); // minimum allowed FIN 0.000000000001 (in base units) to avoid large rounding errors

        uint256 finERC20Amount;

        if(_applyClaimRate == true) {
            finERC20Amount = _finPointAmount.mul(claimRate).div(100);
        } else {
            finERC20Amount = _finPointAmount;
        }

        claimableFIN[_recordAddress] = claimableFIN[_recordAddress].add(finERC20Amount);

        emit FINRecordCreate(_recordAddress, _finPointAmount, claimableFIN[_recordAddress]);
    }

    /**
    * @dev Used to calculate and update the amount of claimable FIN ERC20 from existing FIN point balances
    * @param _recordAddress - the registered address assigned to FIN ERC20 claiming
    * @param _finPointAmount - the original amount of FIN points to be migrated, this param should always be entered as base units
    * i.e., 1 FIN = 10**18 base units
    * @param _applyClaimRate - flag to apply claim rate or not, any Finterra Technologies company FIN point allocations
    * are strictly migrated at one to one and do not recive the claim (airdrop) bonus applied to FIN point user balances
    */
    function recordUpdate(address _recordAddress, uint256 _finPointAmount, bool _applyClaimRate) public onlyOwner canRecord {
        require(_finPointAmount >= 100000); // minimum allowed FIN 0.000000000001 (in base units) to avoid large rounding errors

        uint256 finERC20Amount;

        if(_applyClaimRate == true) {
            finERC20Amount = _finPointAmount.mul(claimRate).div(100);
        } else {
            finERC20Amount = _finPointAmount;
        }

        claimableFIN[_recordAddress] = finERC20Amount;

        emit FINRecordUpdate(_recordAddress, _finPointAmount, claimableFIN[_recordAddress]);
    }

    /**
    * @dev Used to move FIN ERC20 records from one address to another, primarily in case a user has lost access to their originally registered account
    * @param _oldAddress - the original registered address
    * @param _newAddress - the new registerd address
    */
    function recordMove(address _oldAddress, address _newAddress) public onlyOwner canRecord {
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