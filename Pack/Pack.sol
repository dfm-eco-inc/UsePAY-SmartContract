// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >= 0.7.0;
pragma experimental ABIEncoderV2;

import "../Storage/WrapAddresses.sol";

contract Ticket is WrapAddresses {

    uint8 ver = 1;

    struct pack {
        uint32 hasCount;
        uint32 useCount;
    }
    
    address internal owner;
    uint256 internal quantity;
    uint256 internal refundCount = 0;
    
    struct PackInfo {
        uint32 total;
        uint32 times0;
        uint32 times1;
        uint32 times2;
        uint32 times3;
        uint256 price;
        uint16 tokenType;
        uint8 noshowValue;
        uint32 maxCount;
    }
    
    mapping(address=>pack) internal buyList;
    
    PackInfo internal packInfo;
    uint8 internal isCalculated = 0;
    uint32 internal totalUsedCount = 0;
}

contract Coupon is WrapAddresses {
    
    uint8 ver = 1;

    struct pack {
        uint32 hasCount;
        uint32 useCount;
    }
    
    uint256 internal quantity;
    
    mapping(address=>pack) internal buyList;
    
    struct PackInfo {
        uint32 total;
        uint32 maxCount;
        uint32 times0;
        uint32 times1;
        uint32 times2;
        uint32 times3;
    }
    address internal owner;
    PackInfo internal packInfo;
}

contract Subscription is WrapAddresses {

    uint8 ver = 1;

    struct pack {
        uint32 hasCount;
    }
    
    uint256 internal refundCount = 0;
    uint256 internal noshowCount = 0;
    uint256 internal noshowLimit = 0;
    uint256 internal quantity;
    uint256 internal isLive = 0;
    uint256 internal noShowTime = 0;
    address internal owner;
    
    struct PackInfo {
        uint32 total;
        uint32 times0;
        uint32 times1;
        uint32 times2;
        uint32 times3;
        uint256 price;
        uint16 tokenType;
    }
    
    mapping(address=>pack) internal buyList;
    
    PackInfo packInfo;
}