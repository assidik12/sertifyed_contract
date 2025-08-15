// test/SertifyEd.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

// Helper function untuk membuat hash
function createDataHash(data) {
  const jsonString = JSON.stringify(data);
  return "0x" + crypto.createHash("sha256").update(jsonString).digest("hex");
}

describe("SertifyEd Contract", function () {
  let SertifyEd, sertifyEd, owner, minter, recipient, anotherAccount;
  const sampleHash = createDataHash({ data: "sample" });

  // Deploy kontrak sekali sebelum setiap test case
  beforeEach(async function () {
    [owner, minter, recipient, anotherAccount] = await ethers.getSigners();
    SertifyEd = await ethers.getContractFactory("SertifyEd");
    sertifyEd = await SertifyEd.deploy();
    await sertifyEd.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await sertifyEd.owner()).to.equal(owner.address);
    });

    it("Should set the deployer as an initial minter", async function () {
      expect(await sertifyEd.minters(owner.address)).to.be.true;
    });

    it("Should have correct name and symbol", async function () {
      expect(await sertifyEd.name()).to.equal("SertifyEd");
      expect(await sertifyEd.symbol()).to.equal("SFYED");
    });
  });

  describe("Minter Management", function () {
    it("Owner should be able to add a new minter", async function () {
      await expect(sertifyEd.connect(owner).addMinter(minter.address)).to.emit(sertifyEd, "MinterAdded").withArgs(minter.address);
      expect(await sertifyEd.minters(minter.address)).to.be.true;
    });

    it("Owner should be able to remove a minter", async function () {
      await sertifyEd.connect(owner).addMinter(minter.address);
      await expect(sertifyEd.connect(owner).removeMinter(minter.address)).to.emit(sertifyEd, "MinterRemoved").withArgs(minter.address);
      expect(await sertifyEd.minters(minter.address)).to.be.false;
    });

    it("Non-owner should not be able to add a minter", async function () {
      await expect(sertifyEd.connect(anotherAccount).addMinter(minter.address)).to.be.revertedWithCustomError(sertifyEd, "OwnableUnauthorizedAccount");
    });
  });

  describe("Certificate Issuance", function () {
    beforeEach(async function () {
      // Tambahkan 'minter' sebagai minter resmi untuk tes ini
      await sertifyEd.connect(owner).addMinter(minter.address);
    });

    it("A minter should be able to issue a certificate", async function () {
      await expect(sertifyEd.connect(minter).issueCertificate(recipient.address, sampleHash)).to.emit(sertifyEd, "CertificateIssued").withArgs(1, recipient.address, minter.address, sampleHash);

      expect(await sertifyEd.ownerOf(1)).to.equal(recipient.address);
    });

    it("Non-minter should not be able to issue a certificate", async function () {
      await expect(sertifyEd.connect(anotherAccount).issueCertificate(recipient.address, sampleHash)).to.be.revertedWith("SertifyEd: Caller is not a minter");
    });

    it("Should store correct certificate details on-chain", async function () {
      await sertifyEd.connect(minter).issueCertificate(recipient.address, sampleHash);
      const details = await sertifyEd.getCertificateDetails(1);
      expect(details.issuerAddress).to.equal(minter.address);
      expect(details.dataHash).to.equal(sampleHash);
    });
  });

  describe("Token URI Management", function () {
    const baseURI = "https://api.example.com/";

    beforeEach(async function () {
      await sertifyEd.connect(owner).addMinter(minter.address);
      await sertifyEd.connect(minter).issueCertificate(recipient.address, sampleHash);
    });

    it("Owner should be able to set the base URI", async function () {
      await sertifyEd.connect(owner).setBaseURI(baseURI);
      expect(await sertifyEd.tokenURI(1)).to.equal(baseURI + "1");
    });

    it("Non-owner should not be able to set the base URI", async function () {
      await expect(sertifyEd.connect(anotherAccount).setBaseURI(baseURI)).to.be.revertedWithCustomError(sertifyEd, "OwnableUnauthorizedAccount");
    });

    it("Should return an empty string if base URI is not set", async function () {
      expect(await sertifyEd.tokenURI(1)).to.equal("");
    });

    it("Should revert for non-existent token", async function () {
      await expect(sertifyEd.tokenURI(999)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
    });
  });

  describe("Ownership and Enumeration", function () {
    beforeEach(async function () {
      await sertifyEd.connect(owner).addMinter(minter.address);
      // Terbitkan 2 sertifikat untuk 'recipient'
      await sertifyEd.connect(minter).issueCertificate(recipient.address, "hash1"); // tokenId 1
      await sertifyEd.connect(minter).issueCertificate(recipient.address, "hash2"); // tokenId 2
    });

    it("getCertificatesByOwner should return all tokens for an owner", async function () {
      const tokens = await sertifyEd.getCertificatesByOwner(recipient.address);
      expect(tokens).to.have.lengthOf(2);
      expect(tokens[0]).to.equal(1);
      expect(tokens[1]).to.equal(2);
    });

    it("Should update ownership enumeration after a transfer", async function () {
      // 'recipient' mentransfer tokenId 1 ke 'anotherAccount'
      await sertifyEd.connect(recipient).transferFrom(recipient.address, anotherAccount.address, 1);

      const recipientTokens = await sertifyEd.getCertificatesByOwner(recipient.address);
      expect(recipientTokens).to.have.lengthOf(1);
      expect(recipientTokens[0]).to.equal(2);

      const newOwnerTokens = await sertifyEd.getCertificatesByOwner(anotherAccount.address);
      expect(newOwnerTokens).to.have.lengthOf(1);
      expect(newOwnerTokens[0]).to.equal(1);
    });
  });
});
