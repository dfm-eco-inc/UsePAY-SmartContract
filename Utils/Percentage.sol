// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;
pragma experimental ABIEncoderV2;

import "../Library/FullMath.sol";

contract Percentage is FullMath {
    
    function getValue(uint a, uint percent) external view returns (uint) {
        require(percent != 0 && percent != 100,"getValue Error : percent == 0 || percent == 100");
        return toUInt ( mul( div( fromUInt(a), fromUInt(100) ), fromUInt(percent) ) );
    }
    
    function getPercent(uint a, uint b) external view returns (uint) {
        require(a>=b,"getPercent Error : a<b");
        return toUInt ( mul ( div ( fromUInt (b), fromUInt (a)  ), fromUInt (100) ) );
    }
}