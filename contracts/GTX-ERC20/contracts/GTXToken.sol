pragma solidity ^0.4.24;
/**
    The MIT License (MIT)

    Copyright (c) 2018 Gallactic

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
 * This is an ERC-20 standard contract used for the Gallactic ICO and Gallactic Network token migration
 * GTXSwap is used here to fetch the total claimable GTX Tokens as per the FIN points swapped for GTX Tokens
*/
import "./StandardToken.sol";
import "../../FIN-GTX-SWAP/contracts/GTXSwap.sol";

    /**
     * @title GTXToken
     * @author Ankur Daharwal <ankur.daharwal@finterra.org>
     * @dev An ERC20 Token Contract based on the ERC20 StandardToken
     * with permissions given to Migration and ICO contracts for certain methods
     * This ERC20 Token is used for the GTX Blockchain ICO and token migration.
    */
contract GTXToken is StandardToken {
    
    /**
     * @dev Constructor to pass the GTX ERC20 Total Supply and 
     * @param _totalSupply To set the Token Total Supply (Initial Proposal is 1,000,000,000)
     *        i.e. _totalSupply = 1000000000
     * @param _name ERC20 Token Name (Gallactic Token)
     * @param _symbol ERC20 Token Symbol (GTX)
     * @param _decimals ERC20 Token Decimal precision value (18)
    */
    constructor(uint256 _totalSupply, string _name, string _symbol, uint8 _decimals) 
        
        StandardToken(_name,_symbol,_decimals) public { 
        
            totalSupply_ = _totalSupply * 10 ** uint(_decimals);
            balances[owner] = totalSupply_;
            emit Transfer(address(0), owner, totalSupply_);           
    
    }

    /**
     * @dev totalGTXSwap is used to store the total GTX Swap amount from the GTXSwap Contract
     *      icoAllocation is used to set the Gallactic ICO Allocation amount (Initial Proposal is 400,000,000)
    */
    uint256 totalGTXSwap;
    uint256 icoAllocation;

    /**
     * @dev gtxMigrateAddress is used to set the GTX Migration Contract Address
     *      icoAddress is used to set the Gallactic ICO Contract Address
    */
    address gtxMigrateAddress;
    address icoAddress;

    /**
     * @dev Modifier for Only GTX Migration Contract Address
    */
    modifier onlyMigrate {

        require(gtxMigrateAddress != address(0))
        require(msg.sender == gtxMigrateAddress);
        _;

    }

    /**
     * @dev Modifier for Only Gallactic ICO Contract Address
    */
    modifier onlyICO {

        require(icoAddress != address(0))
        require(msg.sender == icoAddress);
        _;

    }

    /**
     * @dev Function to set the GTX Migration Contract Address
     * @param _gtxMigrateAddress The address parameter to set the Migration Contract Address
    */

    function setMigrateAddress(address _gtxMigrateAddress) onlyOwner public {
        
        gtxMigrateAddress = _gtxMigrateAddress;
    
    }

    /**
     * @dev Function to retrieve the GTX Migration Contract Address
     * @return MigrateAddress The GTX Migration Contract Address is returned
    */

    function getMigrateAddress() public {
        
        return gtxMigrateAddress;
    
    }

    /**
     * @dev Function to set the Gallactic ICO Contract Address
     * @param _icoAddress The address parameter to set the Gallactic ICO Contract Address
    */

    function setICOAddress(address _icoAddress) onlyOwner public {
        
        icoAddress = _icoAddress;
    
    }

    /**
     * @dev Function to retrieve the Gallactic ICO Contract Address
     * @return icoAddress The Gallactic ICO Contract Address is returned
    */

    function getICOAddress() public {
        
        return icoAddress;
    
    }

    /**
     * @dev Function to pass the ICO Allocation to the ICO Contract Address
     * @modifier onlyICO Permissioned only to the Gallactic ICO Contract Owner
     * @param _gtxSwap The address parameter to set the GTX Swap Contract Address
     * @param _icoAllocation The GTX ICO Allocation Amount (Initial Proposal 400,000,000 tokens)
     * @param _isICOComplete Boolean to check whether the Gallactic ICO is completed or not
    */

    function passICOAllocation(GTXSwap _gtxSwap, uint256 _icoAllocation, bool _isICOComplete) onlyICO public {
        
        if (_isICOComplete){
        
            totalGTXSwap = GTXSwap.getTotal();        
            transfer(icoAddress, totalGTXSwap);
            emit Transfer(this, icoAddress, totalGTXSwap);
            
            icoAllocation = _icoAllocation * 10 ** uint(decimals);
            transfer(icoAddress, icoAllocation);
            emit Transfer(this, icoAddress, totalGTXSwap);
        }
        
        revert();
    }

    /**
     * @dev Function to initiate the GTX ERC-20 to GTX Network Token Migration
     *      and store user Balance records on the GTX Migration Contract
     * @modifier onlyMigrate Permissioned only to the GTX Migration Contract Owner
     * @param _lockTimeBlockNumber The Blocknumber defined for the Migration Lock Time
     * @param _userAddress The user's Ethereum address which is to be migrated to Gallactic
    */
    function migrateTransfer(uint256 _lockTimeBlockNumber, address _userAddress) onlyMigrate public {
        
        require(block.number >= _lockTimeBlockNumber);
        
        uint256 userBal_ = balanceOf(_userAddress);
        balanceOf(_userAddress) = 0;
        return userBal_;
    
    }
}
