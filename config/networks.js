require("dotenv").config();

const { PRIVATE_KEY } = process.env;

module.exports = {
  bscTestnet: {
    url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    chainId: 97,
    accounts: [PRIVATE_KEY],
  },
  bscMainnet: {
    url: "https://bsc-dataseed.binance.org/",
    chainId: 56,
    accounts: [PRIVATE_KEY],
  },
};
