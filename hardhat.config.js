require("@nomicfoundation/hardhat-toolbox");
const { bscMainnet, bscTestnet } = require("./config/networks");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: { bscMainnet, bscTestnet },
};
