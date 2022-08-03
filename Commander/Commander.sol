// SPDX-License-Identifier: GNU LGPLv3
pragma solidity ^0.8.0;

import "../Storage/WrapAddresses.sol";

contract Commander is WrapAddresses {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    bool private reEntry = false;

    event giftEvent(address indexed pack, address fromAddr, address[] toAddr); // 0: pack indexed, 1: from, 2: to, 3: count
    event giveEvent(address indexed pack, address fromAddr, address[] toAddr); // 0: pack indexed, 1: from, 2: to, 3: count

    modifier blockReEntry() {
        require(!reEntry, "Not allowed");
        reEntry = true;
        _;
        reEntry = false;
    }

    function getCountFee(uint count) external view returns (uint256) {
        uint8 n = 0;
        if (count > 10) {
            while (count >= 10) {
                count = count / 10;
                n++;
            }
            return getPrice() * n * 5;
        } else {
            return getPrice();
        }
    }

    function getPrice() public view returns (uint) {
        (, bytes memory result0) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", 1201)
        );
        address uniswapFactory = abi.decode(result0, (address));
        (, bytes memory result1) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", 102)
        );
        address USDT = abi.decode(result1, (address));
        (, bytes memory result2) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", 103)
        );
        address WETH = abi.decode(result2, (address));
        (, bytes memory result3) = address(uniswapFactory).staticcall(
            abi.encodeWithSignature("getPool(address,address,uint24)", USDT, WETH, 500)
        );
        address poolAddr = abi.decode(result3, (address));
        (, bytes memory result4) = poolAddr.staticcall(abi.encodeWithSignature("slot0()"));
        uint sqrtPriceX96 = abi.decode(result4, (uint));
        return (sqrtPriceX96 * sqrtPriceX96 * 1e6) >> (96 * 2);
    }

    function _transfer(
        uint16 tokenType,
        address _to,
        uint256 value
    ) internal {
        if (tokenType == 100) {
            payable(_to).transfer(value);
        } else {
            (bool success0, bytes memory tokenResult) = address(iAddresses).staticcall(
                abi.encodeWithSignature("viewAddress(uint16)", uint16(tokenType))
            );
            require(success0, "0");
            (bool success, ) = address(abi.decode(tokenResult, (address))).call(
                abi.encodeWithSignature("transfer(address,uint256)", _to, value)
            );
            require(success, "TOKEN transfer Fail");
        }
    }

    function _getBalance(uint16 tokenType) internal view returns (uint256) {
        uint balance = 0;
        if (tokenType == 100) {
            balance = address(this).balance;
        } else {
            (, bytes memory tokenResult) = address(iAddresses).staticcall(
                abi.encodeWithSignature("viewAddress(uint16)", uint16(tokenType))
            );
            (, bytes memory result) = address(abi.decode(tokenResult, (address))).staticcall(
                abi.encodeWithSignature("balanceOf(address)", address(this))
            );
            balance = abi.decode(result, (uint256));
        }
        return balance;
    }

    function _swap(address _to, uint256 amountIn) internal returns (uint256) {
        (, bytes memory result0) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", 1200)
        );
        address routerAddr = abi.decode(result0, (address));
        (, bytes memory resultDFM) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", 101)
        );
        (bool success, bytes memory result) = address(routerAddr).call{value: amountIn}(
            abi.encodeWithSignature(
                "exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))",
                getExactInputSigleParams(_to, amountIn, abi.decode(resultDFM, (address)))
            )
        );
        require(success, "swap ETH->TOKEN fail");
        uint256 amountOut = abi.decode(result, (uint256));
        return amountOut;
    }

    function getExactInputSigleParams(
        address _to,
        uint256 _amountIn,
        address _tokenAddr
    ) internal view returns (ExactInputSingleParams memory) {
        (, bytes memory result0) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", 103)
        );
        address WETH = abi.decode(result0, (address));
        uint256 deadline = block.timestamp + 15;
        return
            ExactInputSingleParams(
                WETH,
                _tokenAddr,
                500, // fee
                _to,
                deadline,
                _amountIn,
                0, // amountOutMin
                0 // sqrtPriceLimitX96
            );
    }

    function checkFee(uint count) internal {
        uint8 n = 0;
        if (count > 10) {
            while (count >= 10) {
                count = count / 10;
                n++;
            }
            require(msg.value > getPrice() * n * 5, "C01");
        } else {
            require(msg.value > getPrice(), "C01");
        }
    }
}
