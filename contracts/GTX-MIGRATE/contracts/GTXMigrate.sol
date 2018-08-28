pragma solidity 0.4.24;
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
import "../../GTX-ERC20/contracts/GTXToken.sol";

/**
 * @title GTXMigrate
 * @author Ankur Daharwal <ankur.daharwal@finterra.org>
 * @dev The GTXMigrate contract is used for storing records of ERC-20 GTX
 * token holders to migrate thier held GTX ERC-20 tokens to GTX Network Tokens.
 * These records will be used as reference for claiming GTX Network Tokens on
 * the Gallactic network.
 */

contract GTXMigrate is Ownable {
    using SafeMath for uint256;

    // Address map used to store the per account claimable GTX Network Tokens
    // as per the user's GTX ERC20 on the Ethereum Network

    mapping (address => uint256) public migratableGTX;
    GTXToken gtxErc20_;

    constructor(GTXToken _gtxErc20) public {
        gtxErc20_ = _gtxErc20;
    }

    event GTXRecordUpdate(
        address indexed _recordAddress,
        uint256 _gtxErc20Amount,
        uint256 _gtxNetworkAmount
    );

    event GTXRecordMove(
        address indexed _oldAddress,
        address indexed _newAddress,
        uint256 _gtxNetworkAmount
    );

    /**
    * @dev Used to calculate and store the amount of GTX Network Tokens from existing GTX ERC20 balances
    * 
    * @param _recordAddress - Ethereum Address of the user 
    * i.e., 1 GTX = 10**18 base units
    */
    function initiateGTXMigration() public {
        _gtxErc20Amount = gtxErc20_.migrateTransfer(msg.sender);
        migratableGTX[msg.sender] = migratableGTX[msg.sender].add(_gtxErc20Amount);
        emit GTXRecordUpdate(msg.sender, _gtxErc20Amount, migratableGTX[msg.sender]);
    }

    /**
    * @dev Used to move GTX ERC20 records from one address to another, primarily in case a user has lost access to their originally registered account
    * @param _oldAddress - Original Registered Address
    * @param _newAddress - New Registered Address
    */
    function moveGTXMigrationRecord(address _oldAddress, address _newAddress) public onlyOwner {
        
        require(migratableGTX[_oldAddress] != 0);
        require(migratableGTX[_newAddress] == 0);

        migratableGTX[_newAddress] = migratableGTX[_oldAddress];
        migratableGTX[_oldAddress] = 0;

        emit GTXRecordMove (_oldAddress, _newAddress, migratableGTX[_newAddress]);

    }

    /**
    * @dev Used to retrieve the GTX ERC20 migration records for an address, for GTX ERC20 claiming
    * @param _recordAddress - the registered address where GTX ERC20 tokens can be claimed
    * @return uint256 - the amount of recorded GTX ERC20 after GTX point migration
    */
    function getGTXMigrationRecord(address _recordAddress) view public returns (uint256) {
        return migratableGTX[_recordAddress];
    }
}
