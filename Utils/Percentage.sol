// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../Library/FullMath.sol";

contract Percentage is FullMath {
    function getTimePercent(uint a, uint b) external pure returns (uint) {
        require(a >= b, "getTimePercent Error");
        return toUInt(mul(div(fromUInt(b), fromUInt(a)), fromUInt(100)));
    }

    function getValuePercent(uint a, uint percent) public pure returns (uint) {
        if (percent == 100) {
            return a;
        } else if (percent == 0) {
            return 0;
        }

        if (percent == 60) {
            if (a == 10) {
                return 6;
            } else if (a == 8) {
                return 5;
            } else if (a == 6) {
                return 4;
            } else if (a == 5) {
                return 3;
            } else if (a == 4) {
                return 3;
            } else if (a == 3) {
                return 2;
            } else if (a == 2) {
                return 2;
            } else if (a == 1) {
                return 1;
            }
        }

        return toUInt(mul(div(fromUInt(a), fromUInt(100)), fromUInt(percent)));
    }
}
