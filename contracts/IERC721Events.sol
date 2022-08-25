// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (token/ERC721/IERC721.sol)

pragma solidity ^0.8.0;


/**
 * @dev Required interface of an ERC721 compliant contract.
 */

interface IERC721Events {
    /**
     * @dev Emitted when `tokenId` token is transferred from `from` to `to`.
     */
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
 

    //Emitted when `tokenId` token is sent to smart contract from `from`.
    event TakeNFT(address indexed from, uint256 indexed tokenId);

    //Emitted when `tokenId` token is sent to smart contract from `from`.
    event sendRewardNFTs(uint256 indexed tokenIdF, uint256 indexed tokenIdS, address indexed to);


}
