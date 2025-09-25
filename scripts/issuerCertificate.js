const { ethers } = require("hardhat");

// Konfigurasi
// =================================================================
// Alamat kontrak akan diisi secara otomatis setelah deployment.
let contractAddress = "";
// Ganti dengan URI metadata sertifikat Anda (misalnya dari Pinata/IPFS)
const TOKEN_URI = "ipfs://sdodsfdosvodsfodsfsdfdsf13";

// Fungsi Helper untuk Logging
// =================================================================
const log = (message) => console.log(message);
const logTitle = (title) => {
  log(`\n┌─ ${title} ${"─".repeat(65 - title.length)}┐`);
};
const logSection = (key, value) => {
  log(`│  ${key.padEnd(20)}: ${value}`);
};
const logEnd = () => {
  log(`└${"─".repeat(70)}┘`);
};
const logSuccess = (message) => log(`✅ ${message}`);
const logError = (message) => log(`❌ ${message}`);

// Fungsi Utama (Main Logic)
// =================================================================
async function main() {
  log("🚀 Memulai Script Penerbitan Sertifikat...");

  // 1. Setup Aktor
  const [owner, issuer, recipient] = await ethers.getSigners();

  logTitle("AKTOR");
  logSection("Owner / Relayer", owner.address);
  logSection("Issuer", issuer.address);
  logSection("Recipient", "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc");
  logEnd();

  // 2. Deploy Kontrak
  logTitle("DEPLOYMENT");
  // const contract = await ethers.getContractAt("Sertifyed_v2", contractAddress); // Gunakan ini jika kontrak sudah di-deploy
  const SertifyedFactory = await ethers.getContractFactory("Sertifyed_v2");
  const contract = await SertifyedFactory.deploy(owner.address);
  contractAddress = await contract.getAddress();
  logSection("Alamat Kontrak", contractAddress);
  logSuccess("Kontrak berhasil di-deploy!");
  logEnd();

  // 3. Konfigurasi: Mendaftarkan Issuer
  logTitle("KONFIGURASI");
  logSection("Aksi", `Owner mendaftarkan ${issuer.address.substring(0, 10)}... sebagai Issuer.`);
  const txSetIssuer = await contract.connect(owner).setIssuerStatus(issuer.address, true);
  await txSetIssuer.wait();
  logSuccess("Status Issuer berhasil diatur menjadi 'true'.");
  logEnd();

  // 4. Sisi Issuer: Menandatangani Pesan
  logTitle("SISI ISSUER (OFF-CHAIN)");
  const nonce = await contract.nonces(issuer.address);
  logSection("Nonce Saat Ini", nonce.toString());

  const domain = {
    name: "Sertifyed",
    version: "1",
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: contractAddress,
  };

  const types = {
    CertificateData: [
      { name: "recipient", type: "address" },
      { name: "tokenURI", type: "string" },
      { name: "nonce", type: "uint256" },
    ],
  };

  const value = {
    recipient: recipient.address,
    tokenURI: TOKEN_URI,
    nonce: nonce,
  };

  const signature = await issuer.signTypedData(domain, types, value);
  logSection("Signature Dihasilkan", `${signature.substring(0, 40)}...`);

  // Verifikasi tanda tangan di sisi klien untuk debugging
  const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
  if (recoveredAddress.toLowerCase() === issuer.address.toLowerCase()) {
    logSuccess("Verifikasi Tanda Tangan (klien) berhasil.");
  } else {
    logError("Verifikasi Tanda Tangan (klien) GAGAL!");
    logEnd();
    return; // Hentikan jika gagal
  }
  logEnd();

  // 5. Sisi Relayer: Mengirim Transaksi
  logTitle("SISI RELAYER (ON-CHAIN)");
  logSection("Aksi", "Relayer mengirim transaksi 'mintWithSignature'...");
  const sertifyEd = await ethers.getContractAt("Sertifyed_v2", contractAddress, owner);
  const txMint = await sertifyEd.mintWithSignature(recipient.address, TOKEN_URI, nonce, signature);
  const receipt = await txMint.wait();
  logSuccess("Transaksi berhasil di-mining!");
  logEnd();

  // 6. Verifikasi Akhir
  logTitle("VERIFIKASI AKHIR");
  const transferEvent = receipt.logs.find((e) => e.eventName === "Transfer");
  const tokenId = transferEvent.args.tokenId;
  logSection("Token ID Dibuat", tokenId.toString());

  const ownerOfToken = await sertifyEd.ownerOf(tokenId);
  const uriOfToken = await sertifyEd.tokenURI(tokenId);
  const nextNonce = await sertifyEd.nonces(issuer.address);

  logSection("Pemilik Token", ownerOfToken);
  logSection("Penerima Seharusnya", recipient.address);
  logSection("Token URI", uriOfToken);
  logSection("Nonce Issuer (Baru)", nextNonce.toString());

  if (ownerOfToken.toLowerCase() === recipient.address.toLowerCase()) {
    logSuccess("Pemilik token sudah sesuai!");
  } else {
    logError("Pemilik token TIDAK SESUAI!");
  }
  logEnd();

  log("\n🎉 Alur kerja selesai dengan sukses!");
}

// Eksekusi Script
// =================================================================
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n💥 Terjadi error pada eksekusi script:");
    console.error(error);
    process.exit(1);
  });
