const { ethers } = require("hardhat");
const crypto = require("crypto");

// Fungsi untuk membuat hash SHA-256 dari data.
// Fungsi ini harus sama persis dengan saat menerbitkan.
function createDataHash(data) {
  const dataString = JSON.stringify(data);
  return crypto.createHash("sha256").update(dataString).digest("hex");
}

async function main() {
  console.log("Mempersiapkan verifikasi sertifikat...");

  // GANTI DENGAN ALAMAT KONTRAK ANDA
  const contractAddress = "0x32D60801c5B0a07d0b0586428222ab43953f85B7";

  // wallet penerima sertifikat
  const recipientWalletAddress = "0xf567B8302d56b154fF6C4B2B851E433f3039edb0";

  // GANTI DENGAN TOKEN ID YANG INGIN ANDA VERIFIKASI
  const tokenIdToVerify = 1;

  // Menghubungkan ke smart contract
  const sertifyEd = await ethers.getContractAt("SertifyEd", contractAddress);
  console.log(`Memverifikasi Token ID #${tokenIdToVerify} pada kontrak di alamat ${contractAddress}`);

  try {
    // Implementasi untuk mengambil detail sertifikat
    // Langkah 2: Ambil detail dari blockchain

    const { onChainHash, issuerAddress } = await getCertificateDetails(sertifyEd, tokenIdToVerify);
    await getAllCertificates(sertifyEd, recipientWalletAddress);

    console.log("\n1. Mengambil data dari Blockchain...");
    console.log(`   -> Alamat Penerbit (On-Chain): ${issuerAddress}`);
    console.log(`   -> Hash Data (On-Chain):      ${onChainHash}`);

    // Langkah 3: Siapkan data yang diterima oleh verifikator (off-chain)
    // Data ini HARUS SAMA PERSIS dengan data saat sertifikat diterbitkan.
    const receivedCertificateData = {
      studentName: "Ahmad Sofi Sidik",
      courseTitle: "Pengembangan Aplikasi Blockchain",
      issueDate: "2025-08-03",
      issuerName: "Universitas Bina Sarana Informatika",
      recipientWallet: "0xf567B8302d56b154fF6C4B2B851E433f3039edb0",
      certificateDescription: "Pengembangan Aplikasi Blockchain dengan Solidity dan Hardhat",
      visualAssetUrl: "https://sertifyed.com/receipt/12345",
      grade: "A",
    };

    // Buat hash dari data yang diterima
    const offChainHash = createDataHash(receivedCertificateData);
    console.log("\n2. Memproses data yang diterima (Off-Chain)...");
    console.log(`   -> Hash Data (Off-Chain):     ${offChainHash}`);

    // Langkah 4: Bandingkan kedua hash
    console.log("\n3. Membandingkan kedua hash...");
    console.log("\n--- HASIL VERIFIKASI ---");
    if (onChainHash === offChainHash) {
      console.log("✅ SERTIFIKAT DIKONFIRMASI ASLI DAN VALID.");
      console.log("   Hash data cocok dengan yang tercatat di blockchain.");
    } else {
      console.log("❌ PERINGATAN! SERTIFIKAT TIDAK VALID.");
      console.log("   Hash data tidak cocok. Data mungkin telah diubah atau sertifikat ini palsu.");
    }
  } catch (error) {
    // Menangani jika Token ID tidak ada
    if (error.message.includes("Certificate with this ID does not exist")) {
      console.error(`\n❌ GAGAL: Sertifikat dengan Token ID ${tokenIdToVerify} tidak ditemukan di blockchain.`);
    } else {
      console.error("❌ Terjadi kesalahan tak terduga:", error);
    }
  }
}

// ambil semua sertifikat dari user
async function getAllCertificates(sertifyEd, userAddress) {
  const allCertificates = await sertifyEd.getCertificatesByOwner(userAddress);
  console.log(`\n1. Mengambil semua sertifikat ${userAddress} dari blockchain...`);
  console.log(`   -> Jumlah sertifikat: ${allCertificates}`);
  console.log("   -> Sertifikat:" + allCertificates.map((certificate, index) => `\n${index + 1}. ${certificate}`));
}

async function getCertificateDetails(sertifyEd, tokenId) {
  console.log("\n1. Mengambil data dari Blockchain...");
  const onChainDetails = await sertifyEd.getCertificateDetails(tokenId);
  const onChainHash = onChainDetails.dataHash;
  const issuerAddress = onChainDetails.issuerAddress;

  console.log(`   -> Alamat Penerbit (On-Chain): ${issuerAddress}`);
  console.log(`   -> Hash Data (On-Chain):      ${onChainHash}`);

  return { onChainHash, issuerAddress };
}

main().catch((error) => {
  console.error("❌ Terjadi kesalahan:", error);
  process.exitCode = 1;
});
