pragma solidity ^0.4.24;
/**
    The MIT License (MIT)

    Copyright (c) 2018 Finterra Technologies Sdn. Bhd.

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

import "../../FIN-ERC20/contracts/MintableToken.sol";
import "../../MATH/SafeMath.sol";

/**
* @title Time Lock for ERC20 tokens
* @dev Provides a simple locking mechanism following the approve and transferFrom pattern
*/

contract TimeLock {
    //FINERC20 var definition
    MintableToken ERC20Contract;
    // custom data structure to hold locked funds and time
    struct accountData {
        uint256 balance;
        uint256 releaseTime;
    }

    event Lock(address indexed _tokenLockAccount, uint256 _lockBalance, uint256 _releaseTime);
    event UnLock(address indexed _tokenUnLockAccount, uint256 _unLockBalance, uint256 _unLockTime);

    // only one locked account per address
    mapping (address => accountData) accounts;

    /**
    * @dev Constructor in which we pass the ERC20Contract address for reference and method calls
    */

    constructor(MintableToken _ERC20Contract) public {
        ERC20Contract = _ERC20Contract;
    }

    function timeLockTokens(uint256 _lockTimeS) public {

        uint256 lockAmount = ERC20Contract.allowance(msg.sender, this); // get this time lock contract's approved amount of tokens


        require(lockAmount != 0); // check that this time lock contract has been approved to lock an amount of tokens on the msg.sender's behalf

        if (accounts[msg.sender].balance > 0) { // if locked balance already exists, add new amount to the old balance and retain the same release time
            accounts[msg.sender].balance = SafeMath.add(accounts[msg.sender].balance, lockAmount);
      } else { // else populate the balance and set the release time for the newly locked balance
            accounts[msg.sender].balance = lockAmount;
            accounts[msg.sender].releaseTime = SafeMath.add(now, _lockTimeS);
        }

        emit Lock(msg.sender, lockAmount, accounts[msg.sender].releaseTime);

        ERC20Contract.transferFrom(msg.sender, this, lockAmount);

    }

    function tokenRelease() public {
        // check if user has funds due for pay out because lock time is over
        require (accounts[msg.sender].balance != 0 && accounts[msg.sender].releaseTime <= now);
        accounts[msg.sender].balance = 0;
        accounts[msg.sender].releaseTime = 0;
        emit UnLock(msg.sender, accounts[msg.sender].balance, now);
        ERC20Contract.transfer(msg.sender, accounts[msg.sender].balance);

    }

    // some helper functions for demo purposes (not required)
    function getLockedFunds(address _account) view public returns (uint _lockedBalance) {
        return accounts[_account].balance;
    }

    function getReleaseTime(address _account) view public returns (uint _releaseTime) {
        return accounts[_account].releaseTime;
    }

    /**
    * @dev Used to retrieve the ERC20 contract address that this deployment is attatched to
    * @return address - the ERC20 contract address that this deployment is attatched to
    */
    function getERC20() public view returns (address) {
        return ERC20Contract;
    }
}