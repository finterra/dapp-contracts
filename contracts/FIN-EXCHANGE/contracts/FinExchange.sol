pragma solidity ^0.4.24;

import "../../FIN-ERC20/contracts/StandardToken.sol";
import "../../FIN-ERC20/contracts/MintableToken.sol";
import "../../OWNABLE/Ownable.sol";

/**
 * @title FinExchange
 * @dev The FinExchange contract has an ERC20Token contract address which
 * utilises transfer functions to tranfer tokens to the exchange escrow address
 */

contract FinExchange is Ownable{
    //A struct to store the seller details
    struct Seller {
        address sellerAddress;
        uint256 tokenDeposit;
    }
    mapping (bytes32 => Seller) sellers;
    event DEPOSIT(bytes32 indexed uuid,address indexed sellerAddress, uint256 tokenDeposit);
    event SENT(address[] receivers,uint256[] tokens);

    MintableToken mintableToken;

    /**
    * @dev The FinExchange constructor sets the ERC20 token contract address
    * account.
    */
    constructor(MintableToken _mintableToken) public {
        mintableToken = _mintableToken;
    }

    /**
     * @dev Map a seller details to a uuid
     * @param _uuid is the unique identifer of a account
     * @param _tokens is the number of tokens the seller wants to sell
     */
    function deposit(bytes32 _uuid, uint256 _tokens) public returns(bool){
        require(_uuid != "" && _tokens >0 , "Not valid parameters");
        sellers[_uuid] = Seller(msg.sender,_tokens);
        emit DEPOSIT(_uuid,msg.sender,_tokens);
        return true;
    }

    /**
     * @dev sends tokens to multiple address
     * @param _to array of addresss to send tokens
     * @param _tokens array of tokens to be sent
    */
    function sendTokens(address[] _to,uint256[] _tokens) public onlyOwner{
        bool success;
        for(uint256 i=0; i<_to.length; i++) {
            success = mintableToken.transfer(_to[i],_tokens[i]);
            require(success, "The tokens was not sent this address");
        }
        emit SENT(_to,_tokens);
    }

    /**
     * @dev disaplys the seller details by UUID
     * @param _uuid is the unique identifer of a account
    */
    function getSeller(bytes32 _uuid) public view returns(address,uint256){
        return (sellers[_uuid].sellerAddress,sellers[_uuid].tokenDeposit);
    }

}