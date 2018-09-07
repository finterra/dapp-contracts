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
import "../../FIN-ERC20/contracts/MintableToken.sol";

/**
 * @title FINERC20Migrate
 * @author Ankur Daharwal <ankur.daharwal@finterra.org> & Terry Wilkinson <terry.wilkinson@finterra.org>
 * @dev The FIN ERC20 Migrate Contract is used for initializing the migration of Ethereum based FIN balances
 * to the Gallactic network once it goes live
 * This contract stores all migratable account balances in a map for reference & validation
 */

contract FINERC20Migrate is Ownable {
    using SafeMath for uint256;

    // Address map used to store the per account migratable FIN balances
    // as per the account's FIN ERC20 tokens on the Ethereum Network

    mapping (address => uint256) public migratableFIN;
    
    MintableToken finErc20;

    constructor(MintableToken _finErc20) public {
        finErc20 = _finErc20;
    }   

    // Note: _totalMigratableFIN is a running total of FIN claimed as migratable in this contract, 
    // but does not represent the actual amount of FIN migrated to the Gallactic network
    event FINMigrateRecordUpdate(
        address indexed _account,
        uint256 _totalMigratableFIN
    ); 

    /**
    * @dev Used to calculate and store the amount of FIN ERC20 token balances to be migrated to the Gallactic network
    * 
    * @param _balanceToMigrate - the requested balance to reserve for migration (in most cases this should be the account's total balance)
    *    - primarily included as a parameter for simple validation on the Gallactic side of the migration
    */
    function initiateMigration(uint256 _balanceToMigrate) public {
        uint256 migratable = finErc20.migrateTransfer(msg.sender, _balanceToMigrate);
        migratableFIN[msg.sender] = migratableFIN[msg.sender].add(migratable);
        emit FINMigrateRecordUpdate(msg.sender, migratableFIN[msg.sender]);
    }

    /**
    * @dev Used to retrieve the FIN ERC20 total migration records for an Etheruem account
    * @param _account - the account to be checked for a migratable balance
    * @return uint256 - the running total amount of migratable FIN ERC20 tokens
    */
    function getFINMigrationRecord(address _account) public view returns (uint256) {
        return migratableFIN[_account];
    }

    /**
    * @dev Used to retrieve FIN ERC20 contract address that this deployment is attatched to
    * @return address - the FIN ERC20 contract address that this deployment is attatched to
    */
    function getERC20() public view returns (address) {
        return finErc20;
    }
}
