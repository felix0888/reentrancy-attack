const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account: ", deployer.address
  );

  console.log("Account balance: ", (await deployer.getBalance()).toString());

  const Reentrance = await ethers.getContractFactory("Reentrance");
  const reentrance = await Reentrance.deploy();
  console.log("Reentrance address: ", await reentrance.address);
  console.log("Account balance after Reentrance deploy: ", (await deployer.getBalance()).toString());

  const ReentrancyAttack = await ethers.getContractFactory("ReentrancyAttack");
  const reentrancyAttack = await ReentrancyAttack.deploy();
  console.log("ReentrancyAttack address: ", await reentrancyAttack.address);
  console.log("Account balance after ReentrancyAttack deploy: ", (await deployer.getBalance()).toString());
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
