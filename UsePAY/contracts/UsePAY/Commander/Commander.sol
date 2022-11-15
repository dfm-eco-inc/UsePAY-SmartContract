// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import '../Storage/WrapAddresses.sol';
import '../Library/AggregatorV3Interface.sol';
import '../Library/IUniswapV2Router01.sol';
import './EmergencyStop.sol';
import '../Library/IERC20.sol';

contract Commander is WrapAddresses {
    event GiveEvent(address indexed packAddress, address senderAddress, address[] receiverAddress);

    modifier blockReEntry() {
        require(!isReEntry, 'Not allowed');
        isReEntry = true;
        _;
        isReEntry = false;
    }

    modifier haltInEmergency() {
        require(!isHalted(), 'function not allowed');
        _;
    }

    modifier requestLimit(uint limitTimestamp) {
        require(block.timestamp >= requestTime, 'Too many request');
        requestTime = block.timestamp + limitTimestamp;
        _;
    }

    function getCountFee(uint count) public view returns (uint256) {
        uint256 price = getPrice();
        if (count <= 10) {
            return price;
        } else if (count <= 100) {
            return price * 5;
        } else {
            return price * 10;
        }
    }

    function getPrice() public view returns (uint256) {
        address targetAddress = getAddress(ADR_CHAINLINK_DATAFEED);
        if (targetAddress == address(0)) return 1000000000000000000; // For local testing, 1 ETH

        AggregatorV3Interface priceFeed = AggregatorV3Interface(targetAddress);
        (, int price, , , ) = priceFeed.latestRoundData(); // Get USD price per 1 Native token
        uint256 totalDecimal = 10 ** (18 + priceFeed.decimals());

        return totalDecimal / uint256(price); // Return the wei price of native token per 1 USD
    }

    function getAddress(uint16 index) internal view returns (address) {
        (bool success, bytes memory addressBytes) = address(ADR_ADDRESSES).staticcall(
            abi.encodeWithSignature('viewAddress(uint16)', uint16(index))
        );
        return success ? abi.decode(addressBytes, (address)) : address(0);
    }

    function isHalted() internal view returns (bool) {
        address target = getAddress(ADR_EMERGENCY_STOP);
        require(target != address(0), 'EmergencyStop is not available');

        EmergencyStop halt = EmergencyStop(target);

        return halt.getContractStopped();
    }

    function checkFee(uint count) internal {
        require(msg.value >= getCountFee(count), 'C01 - Not enough fee');
    }

    function _getBalance(address addr) internal view returns (uint256) {
        (bool success, bytes memory balanceBytes) = addr.staticcall(
            abi.encodeWithSignature('balanceOf(address)', address(this))
        );
        require(success, 'Failed to call balanceOf() method');

        return abi.decode(balanceBytes, (uint256));
    }

    function _transfer(uint16 tokenType, address to, uint256 amount) internal {
        if (tokenType == ADR_NATIVE_TOKEN) {
            payable(to).transfer(amount);
        } else {
            IERC20 token = IERC20(getAddress(tokenType));
            token.transfer(to, amount);
        }
    }

    function _swap(uint16 index, address to, uint256 amount) internal returns (uint) {
        address routerAddr = getAddress(ADR_UNISWAP_ROUTER);
        address[] memory path = new address[](2);
        path[1] = getAddress(index);

        require(path[1] != address(0) && routerAddr != address(0), 'The token swap is not available');

        IUniswapV2Router01 router = IUniswapV2Router01(routerAddr);
        path[0] = router.WETH();

        uint[] memory amounts = router.swapExactETHForTokens{ value: amount }(
            0,
            path,
            to,
            block.timestamp + 15 minutes
        );

        require(amounts[1] > 0, 'Failed to swap native tokens for ERC-20 tokens');

        return amounts[1];
    }
}
