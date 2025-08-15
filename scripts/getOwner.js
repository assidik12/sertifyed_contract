const { ethers } = require("hardhat");
async function main() {
  try {
    const contractAddress = "0x32D60801c5B0a07d0b0586428222ab43953f85B7";
    const sertifyEd = await ethers.getContractAt("SertifyEd", contractAddress);

    // Memanggil fungsi owner()
    const contractOwner = await sertifyEd.owner();

    console.log(`Pemilik utama dari Kontrak SertifyEd adalah: ${contractOwner}`);
  } catch (error) {
    console.error("Terjadi kesalahan:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
