const fs = require("fs").promises;
const Web3 = require("web3");

const { abi } = require("../artifacts/contracts/GasSaver.sol/GasSaver.json");
const { NODE_ENV } = process.env;

const { url, accounts } =
  require("../config/networks")[NODE_ENV ? "bscMainnet" : "bscTestnet"];

const web3 = new Web3(url);

//connect wallet
web3.eth.accounts.wallet.add(accounts[0]).address;

const {
  DEFAULT_USE_BNB,
  ChainId,
  WBNB,
  BUSD,
  DEPOSIT_BNB,
} = require("./constants");
const chainId = ChainId[NODE_ENV ? "BSC" : "BSC_TESTNET"];

const {
  depositBNB,
  withdrawBNB,
  getAmountsOut,
  getAmountOutMin,
  transferWBNB,
  callSwap,
  withdrawToken,
  callPancakeSwap,
  approvePancakeRouter,
  createSubContract,
} = require("./module");

const main = async () => {
  const { address } = JSON.parse(
    await fs.readFile("./config/contractAddress.json")
  );

  if (!address) {
    console.log("please create a contract before executing example/index.js .");
    console.log(`
    for node 👇
    npx hardhat run ./scripts/deploy.js
    for bsc mainnet 👇
    npx hardhat run ./scripts/deploy.js --network bscMainnet
    for bsc testnet 👇
    npx hardhat run ./scripts/deploy.js --network bscTestnet
    `);
    return;
  }

  const contract = new web3.eth.Contract(abi, address);

  // create subContract for gas save
  // await createSubContract(web3, contract, 10);
  //deposit bnb
  // await depositBNB(web3, chainId, DEPOSIT_BNB);

  //withdraw bnb
  // await withdrawBNB(web3, chainId, DEPOSIT_BNB);

  //transfer wbnb wallet to contract
  // await transferWBNB(web3, chainId, address, DEPOSIT_BNB);

  //withdraw WBNB contract -> wallet
  // await withdrawToken(web3, contract, WBNB[chainId]);

  /**
   * SWAP SECTION
   */

  // let amountOutMin = 0;
  // const tokenIn = WBNB[chainId];
  // const tokenOut = BUSD[chainId];
  // const amounts = await getAmountsOut(
  //   web3,
  //   chainId,
  //   DEFAULT_USE_BNB,
  //   tokenIn,
  //   tokenOut
  // );

  // amountOutMin = getAmountOutMin(web3, amounts[1]);

  /**
   * PANCAKESWAP SECTION
   */
  // await approvePancakeRouter(web3, chainId, tokenIn);
  // await approvePancakeRouter(web3, chainId, tokenOut);
  // await callPancakeSwap(
  //   web3,
  //   chainId,
  //   [tokenIn, tokenOut],
  //   DEFAULT_USE_BNB,
  //   amountOutMin
  // );

  /**
   * CUSTOM CONTRACT SECTION
   */
  // await callSwap(
  //   web3,
  //   contract,
  //   [tokenIn, tokenOut],
  //   DEFAULT_USE_BNB,
  //   amountOutMin
  // );
};

main();
