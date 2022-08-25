// SPDX-License-Identifier: non
pragma solidity ^0.8.0;

import "./IERC721Events.sol";
import "./utils/Context.sol";


contract MyERC721 is IERC721Events, Context {

    // Token name
    string private _name;

    // Token symbol
    string private _symbol;

    //owner of the deployed contract
    address public _owner;

    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;

    // Mapping owner address to token count
    mapping(address => uint256) private _balances;


    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    constructor(string memory name_, string memory symbol_) {        
        _name = name_;        
        _symbol = symbol_;    
        _owner = _msgSender();
    }

    function balanceOf(address owner) public view virtual  returns (uint256) {
        require(owner != address(0), "ERC721: address zero is not a valid owner");
        return _balances[owner];
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: invalid token ID");
        return owner;
    }


    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() public view virtual  returns (string memory) {
        return _name;
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() public view virtual  returns (string memory) {
        return _symbol;
    }


    /**
     * @dev Returns whether `tokenId` exists.
     *
     * Tokens can be managed by their owner or approved accounts via {approve} or {setApprovalForAll}.
     *
     * Tokens start existing when they are minted (`_mint`),
     * and stop existing when they are burned (`_burn`).
     */
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _owners[tokenId] != address(0);
    }

    /**
     * @dev Mints `tokenId` and transfers it to `to`.
     *
     * WARNING: Usage of this method is discouraged, use {_safeMint} whenever possible
     *
     * Requirements:
     *
     * - `tokenId` must not exist.
     * - `to` cannot be the zero address.
     *
     * Emits a {Transfer} event.
     */
    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");

        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(address(0), to, tokenId);
    }

    
    function _transfer(address to, uint256 tokenId) internal virtual {
        require(MyERC721.ownerOf(tokenId) == _msgSender(), "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");

        _balances[_msgSender()] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(_msgSender(), to, tokenId);

    }


    //takeNFT function is for taking nft for sale or game.
    function _takeNFT(uint256 tokenId) internal {

        delete _owners[tokenId];
        _balances[_msgSender()] -= 1;

        emit TakeNFT(_msgSender(), tokenId);
    }


    //_sendNFTsToWinner function is to send nfts and amounts to winner.
    //_sendNFTsToWinner function can only be called by contract owner.
    function _sendNFTsToWinner(uint256 tokenIdF, uint256 tokenIdS, address to) internal {
        _balances[to] += 2;
        _owners[tokenIdF] = to;   
        _owners[tokenIdS] = to;  

        payable(to).transfer((100000000000000000)*19/10);  //This amount is sent to game winner.
        payable(_msgSender()).transfer((100000000000000000)*1/10);  //This amount is sent to transaction owner.

        emit sendRewardNFTs(tokenIdF, tokenIdS, to);
    }


    function _sendTokenTo(address to, uint256 tokenId_) internal {
        _balances[to] += 1;
        _owners[tokenId_] = to;   
    }

}