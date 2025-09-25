// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";

contract Sertifyed_v2 is ERC721URIStorage, ERC721Enumerable, EIP712, Ownable, Nonces {

    uint256 private _tokenIdCounter;
    bytes32 private constant CERTIFICATE_TYPEHASH =
        keccak256("CertificateData(address recipient,string tokenURI,uint256 nonce)");

    mapping(address => bool) public isIssuer;
    event IssuerStatusChanged(address indexed issuer, bool status);

    constructor(address initialOwner)
        ERC721("Sertifyed", "CERT")
        EIP712("Sertifyed", "1")
        Ownable(initialOwner)
    {}

    function setIssuerStatus(address _issuer, bool _status) public onlyOwner {
        isIssuer[_issuer] = _status;
        emit IssuerStatusChanged(_issuer, _status);
    }

    function mintWithSignature(address recipient, string calldata _tokenURI, uint256 nonce, bytes calldata signature) public returns (uint256) {
        address signer = _verifySignature(recipient, _tokenURI, nonce, signature);
        require(isIssuer[signer], "Sertifyed: Signer is not a registered issuer");
        _useNonce(signer);

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);

        return newTokenId;
    }

    // Override required by Solidity for multiple inheritance
    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Override required by Solidity for multiple inheritance
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
 

    function _verifySignature(address recipient, string memory _tokenURI, uint256 nonce, bytes memory signature) internal view returns (address) {
        // 1. Buat structHash dari data yang ditandatangani
        bytes32 structHash = keccak256(abi.encode(
            CERTIFICATE_TYPEHASH,
            recipient,
            keccak256(bytes(_tokenURI)),
            nonce
        ));

        // 2. Gunakan _hashTypedDataV4 yang akan menggabungkan
        //    structHash dengan domain separator kontrak.
        bytes32 digest = _hashTypedDataV4(structHash);

        // 3. Pulihkan alamatnya
        return ECDSA.recover(digest, signature);
        }

    // Fungsi ini untuk keperluan testing saja.
    function getCertificatesByOwner(address owner) public view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokenIds;
        }

        function getCertificatesById(uint256 tokenId) public view returns (string memory) {
            require(_ownerOf(tokenId) != address(0), "Sertifyed: Token ID does not exist");
            return tokenURI(tokenId);
        }

    }
