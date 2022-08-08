// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../Library/FullMath.sol";

contract Percentage is FullMath {
    function getTimePercent(uint a, uint b) external pure returns (uint) {
        require(a >= b, "getTimePercent Error");

        uint c1 = (b * 1000) / a;
        uint c2 = c1 % 10;
        uint c3 = (c1 - c2) / 10;

        // Rounding check
        if (c2 >= 5) {
            return c3 + 1;
        } else {
            return c3;
        }
    }

    function getPercentValue(uint amount, uint percent) external pure returns (uint) {
        if (percent == 100) return amount;
        if (percent == 0) return 0;

        uint result = toUInt(mul(div(fromUInt(amount), fromUInt(100)), fromUInt(percent)));

        if (amount % 100 > 0) result++;
        return result;
    }
}
