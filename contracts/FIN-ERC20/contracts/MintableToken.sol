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
import "../../FIN-MIGRATE/contracts/FINMigrate.sol";

    /**
    * @title Mintable token
    * @dev Simple ERC20 Token example, with mintable token creation
    * Based on code by TokenMarketNet: https://github.com/TokenMarketNet/ico/blob/master/contracts/MintableToken.sol
    */
contract MintableToken is StandardToken, Claimable {
    event Mint(address indexed to, uint256 amount);
    event MintFinished();

    bool public mintingFinished = false;

    modifier canMint() {
        require(!mintingFinished);
        _;
    }

    /**
    * @dev Constructor to pass the finMigrationContract address to the Claimable constructor
    */
    constructor(FINMigrate _finMigrationContract,string _name, string _symbol, uint8 _decimals)
    Claimable(_finMigrationContract)
    StandardToken(_name,_symbol,_decimals)public {

    }

    /**
    * @dev Allows addresses with FIN migration records to claim thier ERC20 FIN tokens. This is the only way minting can occur.
    */
    function claim() public canClaim {
        claimed[msg.sender] = true;
        mint(msg.sender,finMigrationContract.recordGet(msg.sender));
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
    function finishMinting() onlyOwner canMint public returns (bool) {
        mintingFinished = true;
        emit MintFinished();
        return true;
    }
}