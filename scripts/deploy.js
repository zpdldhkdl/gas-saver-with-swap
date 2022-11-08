// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs = require("fs").promises;

async function main() {
  // deploy for bsc mainnet
  const PANCAKE_FACTORY_ADDRESS = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
  const GasSaver = await hre.ethers.getContractFactory("GasSaver");
  const gasSaver = await GasSaver.deploy(PANCAKE_FACTORY_ADDRESS);

  await gasSaver.deployed();

  const { address } = gasSaver;
  await fs.writeFile(
    "./config/contractAddress.json",
    JSON.stringify({ address })
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
