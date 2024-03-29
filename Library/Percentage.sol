// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import './FullMath.sol';

contract Percentage is FullMath {
    function getTimePercent(uint256 a, uint256 b) external pure returns (uint256) {
        require(a >= b, 'getTimePercent Error');

        uint256 c1 = (b * 1000) / a;
        uint256 c2 = c1 % 10;
        uint256 c3 = (c1 - c2) / 10;

        if (c2 >= 5) {
            return c3 + 1;
        } else {
            return c3;
        }
    }

    function getPercentValue(uint256 amount, uint256 percent) external pure returns (uint256) {
        require(0 <= percent && percent <= 100, 'Wrong percent value');

        if (percent == 100) return amount;
        if (percent == 0) return 0;

        uint256 result = toUInt(mul(div(fromUInt(amount * 10), fromUInt(100)), fromUInt(percent)));
        uint256 restValue = result % 10;

        if (restValue >= 5) {
            return (result / 10) + 1;
        } else {
            return (result / 10);
        }
    }
}