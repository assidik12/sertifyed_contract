const { ethers } = require("hardhat");
const crypto = require("crypto");

// Fungsi untuk membuat hash SHA-256 dari data.
// Fungsi ini harus sama persis di backend Anda.
function createDataHash(data) {
  const dataString = JSON.stringify(data);
  return crypto.createHash("sha256").update(dataString).digest("hex");
}

async function main_v1() {
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
async function main_v2() {
  try {
    const [owner, issuer, recipient] = await ethers.getSigners();
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    const sertifyEd = await ethers.getContractAt("Sertifyed_v2", contractAddress, owner);

    // 4. PERSIAPAN TANDA TANGAN (dilakukan di sisi Issuer)
    console.log("--- SISI ISSUER: MEMPERSIAPKAN TANDA TANGAN ---");
    const tokenURI = "ipfs://bafkreihgkj3qwdj4q3j4wqg2rqg2rqg2rqg2rqg2rqg2rqg2rqg2rq";

    const nonce = await sertifyEd.nonces(issuer.address);
    console.log(`Nonce untuk Issuer saat ini: ${nonce.toString()}`);

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
      tokenURI: tokenURI,
      nonce: nonce,
    };

    console.log("Issuer menandatangani data...");
    const signature = await issuer.signTypedData(domain, types, value);
    console.log("Tanda tangan (signature) berhasil dibuat:", signature);
    console.log("");

    // --- BLOK DEBUGGING BARU ---
    console.log("--- DEBUGGING: Verifikasi Tanda Tangan di Sisi Klien ---");
    const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
    console.log("Alamat yang dipulihkan (klien):", recoveredAddress);
    console.log("Alamat Issuer (seharusnya)  :", issuer.address);
    if (recoveredAddress.toLowerCase() === issuer.address.toLowerCase()) {
      console.log("Verifikasi klien BERHASIL. Tanda tangan valid.");
    } else {
      console.log("Verifikasi klien GAGAL. Ada masalah pada data yang ditandatangani.");
      // Hentikan eksekusi jika tanda tangan salah, karena pasti akan gagal di kontrak.
      return;
    }
    console.log("----------------------------------------------------------");
    console.log("");
    // --- AKHIR BLOK DEBUGGING ---

    // 5. RELAY TRANSAKSI (dilakukan oleh backend/relayer)
    console.log("--- SISI RELAYER: MENGIRIM TRANSAKSI ---");
    console.log("Relayer memanggil 'mintWithSignature' dengan data dan tanda tangan dari Issuer.");

    const txMint = await sertifyEd.mintWithSignature(recipient.address, tokenURI, nonce, signature);
    const receipt = await txMint.wait();

    // Cara terbaik untuk mendapatkan tokenId adalah dari event yang di-emit oleh kontrak
    const issuedEvent = receipt.logs.find((e) => e.eventName === "Transfer");
    if (!issuedEvent) {
      throw new Error("Tidak dapat menemukan event CertificateIssued dalam transaksi.");
    }
    const tokenId = issuedEvent.args.tokenId;
    console.log(`Sertifikat baru telah dibuat dengan Token ID: ${tokenId.toString()}`);

    // 7. VERIFIKASI OFF-CHAIN
    console.log("\n--- VERIFIKASI OFF-CHAIN ---");
    const recipientWalletAddress = recipient.address;

    console.log("Memulai proses verifikasi sertifikat...");
    console.log(`Alamat wallet penerima sertifikat: ${recipientWalletAddress}`);
    console.log(`Alamat kontrak Sertifyed: ${contractAddress}`);
    const verify = await getAllCertificates(sertifyEd, recipientWalletAddress);
    // const verify = await getCertificateDetails(sertifyEd, tokenId);
    console.log(`Detail sertifikat yang diambil dari blockchain dengan Token ID ${tokenId} : ${JSON.stringify(verify)}`);
    console.log("Proses verifikasi sertifikat selesai.");
    console.log("");
  } catch (error) {
    console.log(`Terjadi kesalahan dalam eksekusi: ${error.message}`);
  }
}

async function getCertificateDetails(sertifyEd, tokenId) {
  console.log("\n1. Mengambil data dari Blockchain...");
  const onChainDetails = await sertifyEd.getCertificatesById(tokenId);
  return onChainDetails;
}

async function getAllCertificates(sertifyEd, userAddress) {
  const allCertificates = await sertifyEd.getCertificatesByOwner(userAddress);
  console.log(`\n1. Mengambil semua sertifikat ${userAddress} dari blockchain...`);
  console.log(`   -> Jumlah sertifikat: ${allCertificates}`);
  console.log("   -> Sertifikat:" + allCertificates.map((certificate, index) => `\n${index + 1}. ${certificate}`));
}

main_v2()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
