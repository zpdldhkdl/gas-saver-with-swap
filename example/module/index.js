const {
  GAS_SETTING: { gasLimit, gasPrice },
  WBNB,
  PANCAKE_SWAP_ROUTER,
  SLIPPAGE,
  MAX_UINT256,
  DEPOSIT_BNB,
} = require("../constants");

const IWBNB = require("../abis/IWBNB.json");
const IPancakeRouter = require("../abis/IPancakeRouter.json");
const IERC20 = require("../abis/IERC20.json");

module.exports.getAmountOutMin = (web3, amountOut) => {
  amountOut = web3.utils.toBN(amountOut);

  return amountOut
    .mul(new web3.utils.BN("100").sub(new web3.utils.BN(SLIPPAGE)))
    .div(new web3.utils.BN("100"));
};

module.exports.getAmountsOut = async (
  web3,
  chainId,
  amountIn,
  tokenIn,
  tokenOut
) => {
  const contract = new web3.eth.Contract(
    IPancakeRouter,
    PANCAKE_SWAP_ROUTER[chainId]
  );

  amountIn = web3.utils.toWei(amountIn);
  return await contract.methods
    .getAmountsOut(amountIn, [tokenIn, tokenOut])
    .call();
};

module.exports.depositBNB = async (web3, chainId, amountIn) => {
  amountIn = web3.utils.toWei(amountIn);
  const contract = new web3.eth.Contract(IWBNB, WBNB[chainId]);

  const { address } = web3.eth.accounts.wallet[0];
  await contract.methods.deposit().send({
    from: address,
    value: amountIn,
    gasLimit,
    gasPrice: web3.utils.toWei(gasPrice, "gwei"),
  });
};

module.exports.approvePancakeRouter = async (web3, chainId, tokenAddress) => {
  const { address } = web3.eth.accounts.wallet[0];

  const contract = new web3.eth.Contract(IERC20, tokenAddress);

  await contract.methods
    .approve(PANCAKE_SWAP_ROUTER[chainId], MAX_UINT256)
    .send({
      from: address,
      gasLimit,
      gasPrice: web3.utils.toWei(gasPrice, "gwei"),
    });
};

module.exports.callPancakeSwap = async (
  web3,
  chainId,
  path,
  amountIn,
  amountOutMin
) => {
  const contract = new web3.eth.Contract(
    IPancakeRouter,
    PANCAKE_SWAP_ROUTER[chainId]
  );

  const { address } = web3.eth.accounts.wallet[0];
  amountIn = web3.utils.toWei(amountIn);

  await contract.methods
    .swapExactTokensForTokensSupportingFeeOnTransferTokens(
      amountIn,
      amountOutMin,
      path,
      address,
      web3.utils.toHex(Math.round(Date.now() / 1000) + 60 * 20)
    )
    .send({
      from: address,
      gasLimit,
      gasPrice: web3.utils.toWei(gasPrice, "gwei"),
    });
};

module.exports.createSubContract = async (web3, swapContract, amount) => {
  const { address } = web3.eth.accounts.wallet[0];
  await swapContract.methods.create(amount).send({
    from: address,
    gasLimit,
    gasPrice: web3.utils.toWei(gasPrice, "gwei"),
  });
};

module.exports.callSwap = async (
  web3,
  swapContract,
  path,
  amountIn,
  amountOutMin
) => {
  const { address } = web3.eth.accounts.wallet[0];
  amountIn = web3.utils.toWei(amountIn);

  await swapContract.methods.swap(path, amountIn, amountOutMin).send({
    from: address,
    gasLimit,
    gasPrice: web3.utils.toWei(gasPrice, "gwei"),
  });
};

module.exports.withdrawToken = async (web3, swapContract, tokenAddress) => {
  const { address } = web3.eth.accounts.wallet[0];
  const tokenContract = new web3.eth.Contract(IERC20, tokenAddress);

  const tokenBalanceInContract = await tokenContract.methods
    .balanceOf(swapContract._address)
    .call();

  if (tokenBalanceInContract === "0") {
    console.log("token isnt in smart contract");
    return;
  }

  await swapContract.methods
    .withDrawToken(tokenAddress, tokenBalanceInContract)
    .send({
      from: address,
      gasLimit,
      gasPrice: web3.utils.toWei(gasPrice, "gwei"),
    });
};

module.exports.withdrawBNB = async (web3, chainId, amountIn) => {
  amountIn = web3.utils.toWei(amountIn);
  const contract = new web3.eth.Contract(IWBNB, WBNB[chainId]);

  const { address } = web3.eth.accounts.wallet[0];
  await contract.methods.withdraw(amountIn).send({
    from: address,
    gasLimit,
    gasPrice: web3.utils.toWei(gasPrice, "gwei"),
  });
};

module.exports.transferWBNB = async (web3, chainId, to, amount) => {
  amount = web3.utils.toWei(amount);

  const { address } = web3.eth.accounts.wallet[0];
  const contract = new web3.eth.Contract(IWBNB, WBNB[chainId]);

  await contract.methods.transfer(to, amount).send({
    from: address,
    gasLimit,
    gasPrice: web3.utils.toWei(gasPrice, "gwei"),
  });
};
