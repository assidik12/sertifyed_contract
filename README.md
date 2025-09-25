# SertifyEd - Digital Certificate Verification System

<div align="center">
  <h3>🎓 Blockchain-Based Certificate Authentication Platform</h3>
  <p>A decentralized solution for issuing, verifying, and managing digital certificates using NFT technology</p>
  
  ![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity&logoColor=white)
  ![Hardhat](https://img.shields.io/badge/Hardhat-2.26.1-FFF04D?style=for-the-badge&logo=hardhat&logoColor=black)
  ![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.4.0-4E5EE4?style=for-the-badge&logo=openzeppelin&logoColor=white)
  ![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Scripts](#scripts)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🔍 Overview

SertifyEd is a blockchain-based digital certificate verification system that leverages NFT technology to create tamper-proof, verifiable certificates. The platform uses EIP-712 signature standards for gasless minting and implements role-based access control for secure certificate issuance.

### Key Benefits

- **Immutable Records**: Certificates stored on blockchain cannot be forged or tampered with
- **Gasless Minting**: Recipients don't pay gas fees for certificate issuance
- **Role-based Security**: Only authorized issuers can create certificates
- **Easy Verification**: Instant verification through wallet addresses
- **Decentralized**: No single point of failure

## ✨ Features

### Core Functionality

- 🎯 **EIP-712 Signature Verification**: Secure off-chain signing with on-chain verification
- 🔐 **Role-based Access Control**: Owner-managed issuer authorization system
- 💰 **Gasless Minting**: Meta-transaction support for cost-effective certificate issuance
- 🔍 **Certificate Verification**: Easy lookup and verification of certificates
- 📱 **Web Interface**: User-friendly frontend for interaction
- 🏷️ **NFT Standards**: Full ERC-721 compliance with URI storage and enumeration

### Technical Features

- Multiple inheritance with OpenZeppelin contracts
- ERC721URIStorage for metadata management
- ERC721Enumerable for efficient certificate querying
- Nonce-based replay attack prevention
- Event logging for transparency

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   (Web DApp)    │◄──►│   (Relayer)     │◄──►│   (Smart       │
│                 │    │                 │    │   Contract)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐            ┌─────▼──────┐       ┌───────▼────────┐
    │MetaMask │            │EIP-712     │       │Sertifyed_v2    │
    │Wallet   │            │Signatures  │       │Contract        │
    └─────────┘            └────────────┘       └────────────────┘
```

## 📄 Smart Contracts

### Sertifyed_v2

The main contract implementing the certificate system with the following features:

- **Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (Local)
- **Network**: Ethereum Compatible
- **Standards**: ERC-721, EIP-712, ERC-165

#### Key Functions

- `mintWithSignature()`: Issues certificates using verified signatures
- `setIssuerStatus()`: Manages issuer authorization (Owner only)
- `getCertificatesByOwner()`: Retrieves all certificates for an address
- `tokenURI()`: Gets certificate details by token ID

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- MetaMask wallet
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/assidik12/sertifyed_contract.git
   cd sertifyed_contract
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Compile contracts**
   ```bash
   npx hardhat compile
   ```

## 💼 Usage

### Development Workflow

1. **Start local blockchain**

   ```bash
   npm run node
   ```

2. **Deploy contracts**

   ```bash
   npm run deploy
   ```

3. **Issue a certificate**
   ```bash
   npm run addCertificate
   ```

### Web Interface

1. Open `view/index.html` in your browser
2. Connect your MetaMask wallet
3. Enter the contract address
4. Interact with the smart contract functions

## 📜 Scripts

| Script          | Command                  | Description                             |
| --------------- | ------------------------ | --------------------------------------- |
| Local Node      | `npm run node`           | Start Hardhat local blockchain          |
| Deploy          | `npm run deploy`         | Deploy smart contracts to local network |
| Add Certificate | `npm run addCertificate` | Issue a new certificate                 |

### Custom Scripts

- **`scripts/deploy.js`**: Deploys the Sertifyed_v2 contract and sets up issuer roles
- **`scripts/addCertificate.js`**: Complete certificate issuance workflow with verification
- **`scripts/issuerCertificate.js`**: Professional certificate issuance with detailed logging

## 🔧 API Reference

### Contract Methods

#### Write Methods

```solidity
function mintWithSignature(
    address recipient,
    string calldata tokenURI,
    uint256 nonce,
    bytes calldata signature
) external returns (uint256)

function setIssuerStatus(address issuer, bool status) external onlyOwner
```

#### Read Methods

```solidity
function getCertificatesByOwner(address owner) external view returns (uint256[])
function getCertificatesById(uint256 tokenId) external view returns (string memory)
function isIssuer(address account) external view returns (bool)
function nonces(address account) external view returns (uint256)
```

### Events

```solidity
event IssuerStatusChanged(address indexed issuer, bool status)
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npx hardhat test

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/Lock.js
```

## 🚀 Deployment

### Local Development

```bash
# Terminal 1: Start local node
npm run node

# Terminal 2: Deploy contracts
npm run deploy
```

### Testnet Deployment

```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

### Mainnet Deployment

```bash
# Deploy to Ethereum mainnet
npx hardhat run scripts/deploy.js --network mainnet
```

## 📁 Project Structure

```
sertifyed_contract/
├── contracts/
│   ├── sertify_v2.sol          # Main certificate contract
│   └── SertivyEd.sol           # Legacy contract
├── scripts/
│   ├── deploy.js               # Deployment script
│   ├── addCertificate.js       # Certificate issuance
│   └── issuerCertificate.js    # Professional issuance
├── test/
│   └── Lock.js                 # Test files
├── view/
│   ├── index.html              # Web interface
│   └── abi.js                  # Contract ABI
├── artifacts/                  # Compiled contracts
├── cache/                      # Hardhat cache
├── hardhat.config.js           # Hardhat configuration
└── package.json                # Dependencies
```

## 🔒 Security Considerations

- **Signature Verification**: All certificates require valid EIP-712 signatures
- **Role-based Access**: Only authorized issuers can create certificates
- **Nonce Protection**: Prevents replay attacks
- **Owner Controls**: Contract owner manages issuer permissions
- **Immutable Records**: Certificates cannot be modified after issuance

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Solidity best practices
- Add tests for new features
- Update documentation
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [Hardhat](https://hardhat.org/) for development framework
- [Ethers.js](https://docs.ethers.io/) for Ethereum interaction

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Contact: [Your Contact Information]
- Documentation: [Your Documentation URL]

---

<div align="center">
  <p>Built with ❤️ for secure digital credentialing</p>
  <p>© 2025 SertifyEd Team. All rights reserved.</p>
</div>
