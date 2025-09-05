// Import library yang diperlukan
const { ethers } = require("hardhat");
const crypto = require("crypto");

// Fungsi untuk membuat hash SHA-256 dari data.
// Fungsi ini harus sama persis di backend Anda.
function createDataHash(data) {
  const dataString = JSON.stringify(data);
  return crypto.createHash("sha256").update(dataString).digest("hex");
}

async function main() {
  console.log("Mempersiapkan penerbitan sertifikat...");

  // GANTI DENGAN ALAMAT KONTRAK ANDA YANG SUDAH DI-DEPLOY
  const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

  // GANTI DENGAN ALAMAT WALLET MAHASISWA YANG AKAN MENERIMA SERTIFIKAT
  const studentWalletAddress = "0xf567B8302d56b154fF6C4B2B851E433f3039edb0"; // A/n Ahmad Sofi Sidik

  // --- PERBAIKAN DIMULAI DI SINI ---
  // Mengambil Signer Object dari Hardhat, bukan string alamat.
  // Hardhat secara otomatis menggunakan private key dari file .env Anda.
  const [minterSigner] = await ethers.getSigners();
  // --- PERBAIKAN SELESAI ---

  console.log(`Menerbitkan menggunakan akun minter: ${minterSigner.address}`);

  // Menghubungkan ke smart contract yang sudah ada di blockchain
  // Sekarang kita memberikan Signer Object yang valid
  const sertifyEd = await ethers.getContractAt("SertifyEd", contractAddress, minterSigner);

  // Langkah 1: Siapkan data sertifikat (ini biasanya dari database Anda)
  const certificateData = {
    studentName: "Ahmad Sofi Sidik",
    courseTitle: "Pengembangan Aplikasi Blockchain",
    issueDate: "2025-08-03",
    issuerName: "Universitas Bina Sarana Informatika",
    recipientWallet: "0xf567B8302d56b154fF6C4B2B851E433f3039edb0",
    certificateDescription: "Pengembangan Aplikasi Blockchain dengan Solidity dan Hardhat",
    visualAssetUrl: "https://sertifyed.com/receipt/12345",
    grade: "A",
  };

  // Langkah 2: Buat hash dari data di atas
  const dataHash = createDataHash(certificateData);
  console.log("\nData Sertifikat (Off-Chain):");
  console.log(certificateData);
  console.log(`\nHash yang akan dikirim ke Blockchain (On-Chain): ${dataHash}`);

  // Langkah 3: Panggil fungsi 'issueCertificate' di smart contract
  console.log(`\nMengirim transaksi untuk menerbitkan sertifikat ke alamat: ${studentWalletAddress}...`);
  const tx = await sertifyEd.issueCertificate(studentWalletAddress, dataHash);

  // Menunggu transaksi selesai dan mendapatkan detailnya
  const receipt = await tx.wait();

  // Cara terbaik untuk mendapatkan tokenId adalah dari event yang di-emit oleh kontrak
  const issuedEvent = receipt.logs.find((e) => e.eventName === "CertificateIssued");
  if (!issuedEvent) {
    throw new Error("Tidak dapat menemukan event CertificateIssued dalam transaksi.");
  }
  const tokenId = issuedEvent.args.tokenId;

  console.log("\n✅ --- PENERBITAN BERHASIL! --- ✅");
  console.log(`Sertifikat baru telah dibuat dengan Token ID: ${tokenId.toString()}`);
  console.log(`Lihat transaksi di Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
}

main().catch((error) => {
  console.error("❌ Terjadi kesalahan:", error);
  process.exitCode = 1;
});
