//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./libraries/SafeMath.sol";
import "./libraries/PancakeLibrary.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IPancakePair.sol";

contract GasSaver is Ownable {
    using SafeMath for uint;

    bytes private subContractBytesCode;
    address private factory;
    uint256 totalMinted;
    uint256 totalBurned;

    constructor(address _factory) {
        bytes4 bytes4Address = bytes4(abi.encodePacked(address(this)));
        bytes memory _subContractBytesCode = abi.encodePacked(hex"6d3360801c63", bytes4Address, hex"18585733ff600052600e6012f3");
        subContractBytesCode = _subContractBytesCode;
        factory = _factory;
    }

    receive() external payable {}
    fallback() external payable {}

    modifier gasRefund {
        uint256 gasStart = gasleft();
        _;
        uint256 gasSpent = 21000 + gasStart - gasleft() + 16 * msg.data.length;
        destroy((gasSpent + 14154) / 41947);
    }

   function activeSubContractAmount() external view returns (uint256) {
        return totalMinted - totalBurned;
    }

    function _create(uint256 value) internal {
        uint256 offset = totalMinted;
        bytes memory code = subContractBytesCode;
         assembly {
            let end := add(value, offset)
            for { } lt(offset, end) { offset := add(offset, 1) } {
                let t := create2(0, add(code, 0x20), mload(code), offset)
            }
        } 
        totalMinted = offset;
    }

   function _destroyChildren(uint256 value) internal {
        uint256 offset = totalBurned;
        uint256 _minted = totalMinted;
        uint256 end = offset + value;
        bytes memory code = subContractBytesCode;
        for(uint256 i = offset; i < end; i++) {
            if (i >= _minted) {
                end = i;
                break;
            }
            address k = address(
                uint160(                      // downcast to match the address type.
                    uint256(                    // convert to uint to truncate upper digits.
                        keccak256(                // compute the CREATE2 hash using 4 inputs.
                            abi.encodePacked(       // pack all inputs to the hash together.
                            hex"ff",              // start with 0xff to distinguish from RLP.
                            address(this),        // this contract will be the caller.
                            i,                 // pass in the supplied salt value.
                            keccak256(            // pass in the hash of initialization code.
                                abi.encodePacked(
                                    code
                                )
                            )
                            )
                        )
                    )
                )   
            );
            assembly {
                pop(call(gas(), k, 0, 0, 0, 0, 0))
            }
        }
        totalBurned = end;
    }

    function destroy(uint256 value) public onlyOwner returns (bool) {
        if (value > 0) {
            _destroyChildren(value);
            return true;
        }
        return false;
    }

    function create(uint256 amount) external {
        _create(amount);
    }

    function computeAddress(uint256 salt) public view returns (address child) {
        bytes memory _code = subContractBytesCode;
        assembly {
            let data := mload(0x40)
            mstore(data,
                add(
                    0xff00000000000000000000000000000000000000000000000000000000000000,
                    shl(0x58, address())
                )
            )
            mstore(add(data, 21), salt)
            mstore(add(data, 53), _code)
            mstore(add(data, 53), keccak256(add(data, 53), 30))
            child := and(keccak256(data, 85), 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
        }
    }

    function withDraw(uint256 amount) public onlyOwner {
        if (amount == 0) {
            amount = address(this).balance;
        }

        address _owner = owner();

        require(amount != 0);

        (bool success, ) = _owner.call{value: amount}("");

        require(success);
    }

    function withDrawToken(address token, uint256 amount) public onlyOwner {
        IERC20 _token = IERC20(token);

        if (amount == 0) {
            amount = _token.balanceOf(address(this));
        }

        require(amount != 0);

        address _owner = owner();

        assert(_token.transfer(_owner, amount));
    }

    function _swap(address[] memory path, address _to) internal {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = PancakeLibrary.sortTokens(input, output);
            IPancakePair pair = IPancakePair(PancakeLibrary.pairFor(factory, input, output));
            uint amountInput;
            uint amountOutput;
            { // scope to avoid stack too deep errors
            (uint reserve0, uint reserve1,) = pair.getReserves();
            (uint reserveInput, uint reserveOutput) = input == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
            amountInput = IERC20(input).balanceOf(address(pair)).sub(reserveInput);
            amountOutput = PancakeLibrary.getAmountOut(amountInput, reserveInput, reserveOutput);
            }
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOutput) : (amountOutput, uint(0));
            address to = i < path.length - 2 ? PancakeLibrary.pairFor(factory, output, path[i + 2]) : _to;
            pair.swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }

    function swap(address[] memory path, uint256 amountIn, uint256 amountOutMin) external onlyOwner gasRefund {
        IERC20 inTokenERC = IERC20(path[0]);
        address to = address(this);
        
        address pairAddress = PancakeLibrary.pairFor(factory, path[0], path[1]);

        assert(inTokenERC.transfer(pairAddress, amountIn));

        uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        _swap(path, to);
        require(
            IERC20(path[path.length - 1]).balanceOf(to).sub(balanceBefore) >= amountOutMin,
            'INSUFFICIENT_OUTPUT_AMOUNT'
        );
    }
}
