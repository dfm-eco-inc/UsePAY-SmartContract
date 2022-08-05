// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../Library/FullMath.sol";

contract Percentage is FullMath {
    function getTimePercent(uint a, uint b) external pure returns (uint) {
        require(a >= b, "getTimePercent Error");
        return toUInt(mul(div(fromUInt(b), fromUInt(a)), fromUInt(100)));
    }

    function getPercentValue(uint amount, uint percent) external pure returns (uint) {
        if (percent == 100) return amount;
        if (percent == 0) return 0;

        uint result = toUInt(mul(div(fromUInt(amount), fromUInt(100)), fromUInt(percent)));

        if (amount % 100 > 0) result++;
        return result;
    }
}
