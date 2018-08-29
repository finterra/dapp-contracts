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
 * @title GTXSwap
 * @author Terry Wilkinson <terry.wilkinson@finterra.org>
 * @dev The GTXSwap contract is used for current FIN point holders
 * to swap a portion of thier held points to GTX tokens which will be
 * claimable after the GALLACTIC sale. This contract in particular is for onboarding and
 * storing the resulting GTX amount records.
 * These records will be used as reference during the claiming period of the GALLACTIC sale.
 */

contract GTXSwap is Ownable {
    using SafeMath for uint256;

    // swapRate is the multiplier to calculate the number of GTX claimable per FIN swapped
    // e.g., 100 = 1:1 swap ratio
    uint swapRate;

    // Total number of claimable GTX swapped by FIN
    uint256 totalGTXSwap;

    // an address map used to store the per account claimable GTX
    // as a result of swapped FIN points
    mapping (address => uint256) public claimableGTX;

    event GTXRecordUpdate(
        address indexed _recordAddress,
        uint256 _finPointAmount,
        uint256 _gtxAmount
    );
    event GTXRecordMove(
        address indexed _oldAddress,
        address indexed _newAddress,
        uint256 _gtxAmount
    );

    /**
     * Throws if swapRate is not set
    */
    modifier canSwap() {
        require(swapRate >0);
        _;
    }

    /**
     * @dev sets the GTX Swap rate
     * @param _swapRate is the swap rate applied during FIN to GTX Swap
    */
    function setSwapRate(uint256 _swapRate) public onlyOwner{
        require(_swapRate <= 1000); // maximum 10x swap rate
        require(_swapRate > 0); // minimum .01x swap rate
        swapRate = _swapRate;
    }

    /**
    * @dev Used to calculate and store the amount of claimable GTX for those exsisting FIN point holders
    * who opt to swap FIN points for GTX
    * @param _recordAddress - the registered address where GTX can be claimed from
    * @param _finPointAmount - the amount of FINs to be swapped for GTX, this param should always be entered as base units
    * i.e., 1 FIN = 10**18 base units
    * @param _applySwapRate - flag to apply swap rate or do one for one swap, any Finterra Technologies company FIN point allocations
    * are strictly swapped at one to one and do not recive the swap bonus applied to FIN point user balances
    */
    function recordUpdate(address _recordAddress, uint256 _finPointAmount, bool _applySwapRate) public onlyOwner canSwap {
        require(_finPointAmount >= 100000); // minimum allowed FIN 0.000000000001 (in base units) to avoid large rounding errors
        uint256 afterSwapGTX;
        if(_applySwapRate == true) {
            afterSwapGTX = _finPointAmount.mul(swapRate).div(100);
        } else {
            afterSwapGTX = _finPointAmount;
        }
        claimableGTX[_recordAddress] = claimableGTX[_recordAddress].add(afterSwapGTX);
        totalGTXSwap += claimableGTX[_recordAddress];
        emit GTXRecordUpdate(_recordAddress, _finPointAmount, claimableGTX[_recordAddress]);
    }

    /**
    * @dev Used to move GTX records from one address to another, primarily in case a user has lost access to their originally registered account
    * @param _oldAddress - the original registered address
    * @param _newAddress - the new registerd address
    */
    function recordMove(address _oldAddress, address _newAddress) public onlyOwner canSwap {
        require(claimableGTX[_oldAddress] != 0);
        require(claimableGTX[_newAddress] == 0);

        claimableGTX[_newAddress] = claimableGTX[_oldAddress];
        claimableGTX[_oldAddress] = 0;

        emit GTXRecordMove(_oldAddress, _newAddress, claimableGTX[_newAddress]);
    }

    /**
    * @dev Used to retrieve the GTX swap records for an address, for GTX claiming after the GTX ICO
    * @param _recordAddress - the registered address where GTX can be claimed from
    * @return uint256 - the amount of recorded GTX after FIN point swapping
    */
    function recordGet(address _recordAddress) view public returns (uint256) {
        return claimableGTX[_recordAddress];
    }

    /**
    * @dev Used to retrieve the total GTX swap amount for GTX claiming after the GTX ICO
    * @return uint256 - the sum total of recorded GTX after FIN point swapping
    */
    function getTotal() view public returns (uint256) {
        return totalGTXSwap;
    }
}