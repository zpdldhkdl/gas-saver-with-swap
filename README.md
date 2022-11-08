# GAS-SAVER-WITH-SWAP

save gas by using refund.
for more information about refund, check the [link](https://ethereum.stackexchange.com/questions/594/how-do-gas-refunds-work)

## deploy

```shell
npx hardhat run scripts/deploy.js # for node
npx hardhat run scripts/deploy.js --network bscMainnet # for bsc mainnet
npx hardhat run scripts/deploy.js --network bscTestnet # for bsctestnet
```

## run node

```shell
npx hardhat node
```

## test

```shell
npx hardhat test
```

## execute example

```shell
npm run start:mainnet # for mainnet
npm run start:testnet # for testnet
```

---

## comparison with normal swap function

- swapExactTokensForTokensSupportingFeeOnTransferTokens 👇
  ![pancakeswap](https://user-images.githubusercontent.com/49149450/200552155-9e3e8c5c-1fb7-44c0-a767-12694bec5484.png)

- custom swap function 👇
  ![customswap](https://user-images.githubusercontent.com/49149450/200552406-97b2344d-f057-4473-8bb7-428f5871c9c2.png)

- added minor functionality to [\_destroyChildren](https://github.com/zpdldhkdl/gas-saver-with-swap/blob/master/contracts/GasSaver.sol#L51) for convenience.
- optimize the \_destroyChildren function yourself for more gas savings.
- lighter the function, the better.

---

### Example

- destroy by taking an address without receiving a uint as a parameter
  address -> sub contract address
- optimize [this](https://github.com/zpdldhkdl/gas-saver-with-swap/blob/master/contracts/GasSaver.sol#L57) part

---

### Description (subcontract bytecode)

```solidity
bytes memory _subContractBytesCode = abi.encodePacked(hex"6d3360801c63", bytes4Address, hex"18585733ff600052600e6012f3");
```

the code above determines the bytecode of the subcontract.

taking my already published contract as an example,
contract address is
`0xb09E3af7915b00c8a2CafcdeE858E7d985023134`
and the byte code is
`6d3360801c63` + `b09E3af7` + `18585733ff600052600e6012f3`

`b09E3af7` is the first 4 bytes of the swap contract.

_Ethereum Virtual Machine Opcodes_: [link](https://ethervm.io/)

convert the bytecode to opcode, the result is as follows.

```assembly
label_0000:
	// Inputs[1] { @0016  memory[0x12:0x20] }
	0000    6D  PUSH14 0x3360801c63b09E3af718585733ff
	000F    60  PUSH1 0x00
	0011    52  MSTORE
	0012    60  PUSH1 0x0e // hex length
	0014    60  PUSH1 0x12
	0016    F3  *RETURN
	// Stack delta = +0
	// Outputs[2]
	// {
	//     @0011  memory[0x00:0x20] = 0x3360801c63f02d964918585733ff
	//     @0016  return memory[0x12:0x20];
	// }
	// Block terminates
```

- byte code of the subcontract we want is `3360801c63b09E3af718585733ff` and its length is `14(0x0e)`

```solidity
bytes32 c;
assembly {
    mstore(0, 0x3360801c63b09E3af718585733ff)
    c := mload(0)
}

console.logBytes32(c);

result: 0x0000000000000000000000000000000000003360801c63b09E3af718585733ff
```

see from the code above, `0x3360801c63b09E3af718585733ff` is equivalent to `0x0000000000000000000000000000000000003360801c63b09E3af718585733ff`.

preceding bytes are omitted through the corresponding `0014 60 PUSH1 0x12`.

like this 👇

```solidity
assembly {
    shl(0x12, 0x0000000000000000000000000000000000003360801c63b09E3af718585733ff)
}
```

now, looking at the byte code of the subcontract to be issued, it is as follows.
`0x3360801c63b09E3af718585733ff`

opcode

```assembly
label_0000:
	// Inputs[1] { @0000  msg.sender }
	0000    33  CALLER
	0001    60  PUSH1 0x80
	0003    1C  SHR
	0004    63  PUSH4 0xb09E3af7
	0009    18  XOR
	000A    58  PC
	// Stack delta = +1
	// Outputs[1] { @0009  stack[0] = 0xb09E3af7 ~ (msg.sender >> 0x80) }
	// Block terminates

	000B    57    *JUMPI
	000C    33    CALLER
	000D    FF    *SELFDESTRUCT
```

after getting the address of the caller, `shr` as much as `0x80`, and if the result of xor with `0xb09E3af7` is `0x00`, execute `selfdestruct`.

like this 👇

```solidity
JUMPI PCResult | xor(0xb09E3af7, shr(0x80, caller()))
    selfdestruct(caller())
```
