const { ethers } = require("hardhat");

async function main() {
  const Voter = await ethers.getContractFactory("SertifyEd");
  const contracts = await Voter.deploy();

  console.log("Voter deployed to:", await contracts.getAddress());
}

main()
  .then(() => {
    console.log("Success");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
