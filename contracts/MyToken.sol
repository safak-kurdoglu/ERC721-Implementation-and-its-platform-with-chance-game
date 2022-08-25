// SPDX-License-Identifier: non
pragma solidity ^0.8.0;

import "./MyERC721.sol";

contract MyToken is MyERC721 {
    
    uint256 tokenId = 0;
    mapping(uint256 => address) tokensInSale;
    mapping(uint256 => uint256) tokensPrice;

    constructor(string memory name, string memory symbol) MyERC721(name, symbol) {  

    }

    function mint() public{
        require(tokenId < 50, "Minting procedure is finished.");
        _mint(msg.sender, tokenId);
        tokenId++;
    }


    function startSale(uint256 tokenId_, uint256 tokenPrice) public {
        require(MyERC721.ownerOf(tokenId_) == _msgSender(), "ERC721: You are not the owner of the token");
        
        tokensInSale[tokenId_] = _msgSender();
        tokensPrice[tokenId_] = tokenPrice;
        _takeNFT(tokenId_);
    }    

    function finishSale(uint256 tokenId_) public payable{
        require(_msgValue() == tokensPrice[tokenId_], "Amount is wrong");

        payable(tokensInSale[tokenId_]).transfer(_msgValue());
        delete tokensPrice[tokenId_];
        delete tokensInSale[tokenId_];
        _sendTokenTo(_msgSender(), tokenId_);
    }

    function cancelSale(uint256 tokenId_) public{
        require(tokensInSale[tokenId_] == _msgSender(), "ERC721: You are not the owner of the token");
        
        delete tokensPrice[tokenId_];
        delete tokensInSale[tokenId_];
        _sendTokenTo(_msgSender(), tokenId_);
    }

    function transfer(address to, uint256 tokenID) public {

        _transfer(to, tokenID);
    }

    function takeNFT(uint256 tokenId_) external payable {
        require(MyERC721.ownerOf(tokenId_) == _msgSender(), "ERC721: You are not the owner of the token");
        require(msg.value == 100000000000000000, "You must pay 100000000000000000 wei to attend");
        
        _takeNFT(tokenId_);
    }

    function sendNFTsToWinner(uint256 tokenIdF, uint256 tokenIdS, address to) public{
        require(_owner == _msgSender(), "ERC721: You are not the owner of the contract");   
        
        _sendNFTsToWinner(tokenIdF, tokenIdS, to);
    }

}