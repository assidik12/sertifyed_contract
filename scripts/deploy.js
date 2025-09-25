const { ethers } = require("hardhat");

async function main() {
  const [owner, issuer, recipient] = await ethers.getSigners();
  const Voter = await ethers.getContractFactory("Sertifyed_v2");
  const contracts = await Voter.deploy(owner.address);
  const contractAddress = await contracts.getAddress();
  // await contracts.deployed();

  // Menghubungkan ke kontrak yang sudah di-deploy dengan signer `owner
  const sertifyEd = await ethers.getContractAt("Sertifyed_v2", contractAddress, owner);

  console.log("Kontrak SertifyEd telah di-deploy di alamat:", contractAddress);

  // 3. KONFIGURASI: Owner mendaftarkan alamat `issuer` sebagai issuer yang sah
  console.log(`Owner (${owner.address.substring(0, 6)}...) mendaftarkan ${issuer.address.substring(0, 6)}... sebagai Issuer.`);
  const txSetIssuer = await sertifyEd.setIssuerStatus(issuer.address, true);
  await txSetIssuer.wait();
  const isIssuer = await sertifyEd.isIssuer(issuer.address);
  console.log(`Status Issuer untuk ${issuer.address} adalah: ${isIssuer}`);
  console.log("");

  // 4. PERSIAPAN TANDA TANGAN (dilakukan di sisi Issuer)
  // console.log("--- SISI ISSUER: MEMPERSIAPKAN TANDA TANGAN ---");
  // const tokenURI = "ipfs://bafkreihgkj3qwdj4q3j4wqg2rqg2rqg2rqg2rqg2rqg2rqg2rqg2rq";

  // const nonce = await sertifyEd.nonces(issuer.address);
  // console.log(`Nonce untuk Issuer saat ini: ${nonce.toString()}`);

  // const domain = {
  //   name: "Sertifyed",
  //   version: "1",
  //   chainId: (await ethers.provider.getNetwork()).chainId,
  //   verifyingContract: contracts.address,
  // };

  // const types = {
  //   CertificateData: [
  //     { name: "recipient", type: "address" },
  //     { name: "tokenURI", type: "string" },
  //     { name: "nonce", type: "uint256" },
  //   ],
  // };

  // const value = {
  //   recipient: recipient.address,
  //   tokenURI: tokenURI,
  //   nonce: nonce,
  // };

  // console.log("Issuer menandatangani data...");
  // const signature = await issuer.signTypedData(domain, types, value);
  // console.log("Tanda tangan (signature) berhasil dibuat:", signature);
  // console.log("");

  // // --- BLOK DEBUGGING BARU ---
  // console.log("--- DEBUGGING: Verifikasi Tanda Tangan di Sisi Klien ---");
  // const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
  // console.log("Alamat yang dipulihkan (klien):", recoveredAddress);
  // console.log("Alamat Issuer (seharusnya)  :", issuer.address);
  // if (recoveredAddress.toLowerCase() === issuer.address.toLowerCase()) {
  //   console.log("✅ Verifikasi klien BERHASIL. Tanda tangan valid.");
  // } else {
  //   console.log("❌ Verifikasi klien GAGAL. Ada masalah pada data yang ditandatangani.");
  //   // Hentikan eksekusi jika tanda tangan salah, karena pasti akan gagal di kontrak.
  //   return;
  // }
  // console.log("----------------------------------------------------------");
  // console.log("");
  // // --- AKHIR BLOK DEBUGGING ---

  // // 5. RELAY TRANSAKSI (dilakukan oleh backend/relayer)
  // console.log("--- SISI RELAYER: MENGIRIM TRANSAKSI ---");
  // console.log("Relayer memanggil 'mintWithSignature' dengan data dan tanda tangan dari Issuer.");

  // // const txMint = await contracts.connect(owner).mintWithSignature(recipient.address, tokenURI, nonce, signature);
  // // const receipt = await txMint.wait();
  // const txMint = await sertifyEd.mintWithSignature(recipient.address, tokenURI, nonce, signature);
  // const receipt = await txMint.wait();

  // const transferEvent = receipt.events.find((event) => event.event === "Transfer");
  // const tokenId = transferEvent.args.tokenId;

  // console.log(`Transaksi Minting sukses! Hash: ${txMint.hash}`);
  // console.log(`Sertifikat NFT dengan Token ID #${tokenId.toString()} telah dibuat.`);
  // console.log("");

  // // 6. VERIFIKASI ON-CHAIN
  // console.log("--- VERIFIKASI HASIL ON-CHAIN ---");
  // const ownerOfToken = await sertifyEd.ownerOf(tokenId);
  // const uriOfToken = await sertifyEd.tokenURI(tokenId);
  // const nextNonce = await sertifyEd.nonces(issuer.address);

  // console.log(`Pemilik Token ID #${tokenId.toString()} adalah: ${ownerOfToken}`);
  // console.log(`          (Seharusnya adalah: ${recipient.address})`);
  // console.log(`Token URI untuk ID #${tokenId.toString()} adalah: ${uriOfToken}`);
  // console.log(`Nonce selanjutnya untuk Issuer adalah: ${nextNonce.toString()}`);

  // if (ownerOfToken === recipient.address && nextNonce.toString() == ethers.BigNumber.from(nonce).add(1).toString()) {
  //   console.log("\n✅ Verifikasi berhasil! Alur kerja berjalan dengan benar.");
  // } else {
  //   console.log("\n❌ Verifikasi GAGAL! Ada masalah dalam alur kerja.");
  // }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
