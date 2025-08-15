// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SertifyEd (Versi 2.0)
 * @author ahmad sofi sidik
 * @dev Smart contract yang telah disempurnakan untuk menerbitkan dan memverifikasi sertifikat.
 * - Alur Minting disesuaikan dengan API: Hanya menyimpan hash data untuk efisiensi gas dan verifikasi yang kuat.
 * - Penambahan fungsi getCertificatesByOwner untuk mendukung fitur galeri sertifikat.
 * - Base URI yang fleksibel dan dapat diatur oleh owner untuk metadata.
 */
contract SertifyEd is ERC721, Ownable {
    // Menggunakan library dari OpenZeppelin untuk konversi uint256 ke string.
    using Strings for uint256;

    // --- State Variables ---
    
    uint256 private _tokenIdCounter;
    string private _baseTokenURI;

    // Struct disederhanakan. Hanya data penting untuk verifikasi on-chain yang disimpan.
    // Data lengkap (nama, judul, dll.) disimpan off-chain (PostgreSQL) dan di-hash.
    struct CertificateOnChainData {
        address issuerAddress; // Alamat wallet institusi penerbit.
        string dataHash;       // Hash dari metadata sertifikat (misal: SHA-256 dari JSON).
    }

    // Mapping dari tokenId ke data sertifikat on-chain.
    mapping(uint256 => CertificateOnChainData) private _certificateDetails;
    
    // Mapping untuk melacak semua token ID yang dimiliki oleh suatu alamat.
    // Diperlukan untuk fungsi getCertificatesByOwner.
    mapping(address => uint256[]) private _ownedTokens;

    // Mapping untuk mengelola alamat mana saja yang diizinkan untuk menerbitkan (minter).
    mapping(address => bool) public minters;

    // --- Events ---

    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed to,
        address indexed issuer,
        string dataHash
    );
    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);

    // --- Modifier ---

    modifier onlyMinter() {
        require(minters[msg.sender], "SertifyEd: Caller is not a minter");
        _;
    }

    // --- Constructor ---

    constructor() ERC721("SertifyEd", "SFYED") Ownable(msg.sender) {
        // Secara default, deployer kontrak adalah minter pertama.
        minters[msg.sender] = true;
        emit MinterAdded(msg.sender);
    }

    // --- Core Functions ---

    /**
     * @dev Menerbitkan sertifikat baru. Sesuai dengan alur API yang diinginkan.
     * Backend bertanggung jawab untuk membuat 'dataHash' dari detail sertifikat.
     * @param to Alamat wallet penerima sertifikat.
     * @param dataHash Hash (misal: SHA-256) dari metadata sertifikat yang disimpan off-chain.
     */
    function issueCertificate(address to, string memory dataHash) public onlyMinter {
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(to, newTokenId);

        _certificateDetails[newTokenId] = CertificateOnChainData({
            issuerAddress: msg.sender,
            dataHash: dataHash
        });

        emit CertificateIssued(newTokenId, to, msg.sender, dataHash);
    }

    // --- View Functions (Public) ---

    /**
     * @dev Mengambil data on-chain sebuah sertifikat berdasarkan Token ID.
     * Fungsi ini adalah kunci untuk proses verifikasi oleh backend.
     */
    function getCertificateDetails(uint256 tokenId) public view returns (CertificateOnChainData memory) {
        // PERBAIKAN: Memeriksa langsung ke mapping kita, bukan menggunakan _exists.
        // Jika issuerAddress bukan alamat kosong, berarti token itu ada.
        require(_certificateDetails[tokenId].issuerAddress != address(0), "SertifyEd: Certificate with this ID does not exist");
        return _certificateDetails[tokenId];
    }
    
    /**
     * @dev [FUNGSI BARU] Mengambil semua Token ID yang dimiliki oleh sebuah alamat.
     * Digunakan oleh backend untuk membangun galeri sertifikat pengguna.
     */
    function getCertificatesByOwner(address owner) public view returns (uint256[] memory) {
        require(owner != address(0), "SertifyEd: Owner query for the zero address");
        return _ownedTokens[owner];
    }

    // --- Internal Functions (Overrides) ---

    /**
     * @dev Override fungsi _update untuk secara otomatis melacak token milik setiap alamat.
     * Ini adalah mesin di balik fungsi getCertificatesByOwner.
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Hapus token dari daftar pemilik lama (jika token sedang ditransfer, bukan di-mint).
        if (from != address(0)) {
            _removeTokenFromOwnerEnumeration(from, tokenId);
        }

        // Tambahkan token ke daftar pemilik baru (jika token sedang di-mint atau ditransfer).
        if (to != address(0)) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }

        return super._update(to, tokenId, auth);
    }

    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        _ownedTokens[to].push(tokenId);
    }

    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        uint256[] storage owned = _ownedTokens[from];
        uint256 lastIndex = owned.length - 1;
        for (uint256 i = 0; i < owned.length; i++) {
            if (owned[i] == tokenId) {
                // Ganti elemen yang akan dihapus dengan elemen terakhir, lalu hapus elemen terakhir.
                // Ini adalah trik O(1) untuk penghapusan dari array.
                owned[i] = owned[lastIndex];
                owned.pop();
                break;
            }
        }
    }

    // --- URI Management (Owner-only) ---
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev [FUNGSI BARU] Mengatur Base URI untuk metadata. Hanya bisa dipanggil oleh Owner.
     * Contoh: "https://api.sertifyed.com/metadata/"
     */
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Mengembalikan URI metadata untuk sebuah token, sesuai standar ERC721.
     * Formatnya akan menjadi: {baseURI}{tokenId}
     * Contoh: "https://api.sertifyed.com/metadata/1"
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // PERBAIKAN: Memeriksa langsung ke mapping kita, bukan menggunakan _exists.
        require(_certificateDetails[tokenId].issuerAddress != address(0), "ERC721Metadata: URI query for nonexistent token");
        
        string memory baseURI = _baseURI();
        // Jika baseURI kosong, kembalikan string kosong. Jika tidak, gabungkan.
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }

    // --- Minter Management Functions (Owner-only) ---

    function addMinter(address _minter) public onlyOwner {
        require(!minters[_minter], "SertifyEd: Account is already a minter");
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }

    function removeMinter(address _minter) public onlyOwner {
        require(minters[_minter], "SertifyEd: Account is not a minter");
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }
}
