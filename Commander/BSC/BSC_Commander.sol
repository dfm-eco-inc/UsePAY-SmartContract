// SPDX-License-Identifier: GNU LGPLv3
pragma solidity ^0.8.7;

import "../../Storage/WrapAddresses.sol";
import "../../Library/AggregatorV3Interface.sol";

contract Commander is WrapAddresses {
    AggregatorV3Interface internal priceFeed;
    bool private reEntry = false;

    event giftEvent(address indexed pack, address fromAddr, address[] toAddr);
    event giveEvent(address indexed pack, address fromAddr, address[] toAddr);
    event getChainlinkDataFeedAddressEvent(address dataFeed);

    modifier blockReEntry() {
        require(!reEntry, "Not allowed");
        reEntry = true;
        _;
        reEntry = false;
    }

    constructor() {
        // Data Feeds Addresses : https://docs.chain.link/docs/reference-contracts
        address dataFeedAddress = 0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526;
        priceFeed = AggregatorV3Interface(dataFeedAddress);
        emit getChainlinkDataFeedAddressEvent(dataFeedAddress);
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

    // Returning value of WEI of the native token
    function getPrice() public view returns (uint256) {
        (, int price, , , ) = priceFeed.latestRoundData();
        uint256 totalDecimal = 10**(18 + priceFeed.decimals());
        return totalDecimal / uint256(price);
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

    function _swap(
        uint16 _index,
        address _to,
        uint256 amountIn
    ) internal returns (uint256) {
        (, bytes memory result0) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", 1200)
        );
        address routerAddr = abi.decode(result0, (address));
        (, bytes memory resultDFM) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", _index)
        );
        // if ( _fromToken == address(0) ) {
        uint deadline = block.timestamp + 1000;
        address[] memory path = new address[](2);
        (, bytes memory resultWETH) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", uint16(103))
        );
        path[0] = abi.decode(resultWETH, (address));
        path[1] = abi.decode(resultDFM, (address));
        (bool success, bytes memory result) = address(routerAddr).call{value: amountIn}(
            abi.encodeWithSignature(
                "swapExactETHForTokens(uint256,address[],address,uint256)",
                0,
                path,
                _to,
                deadline
            )
        );
        uint256[] memory amountOut = abi.decode(result, (uint256[]));
        require(success, "swap ETH->TOKEN fail");
        return amountOut[1];
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
