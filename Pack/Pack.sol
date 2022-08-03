// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.8.0;

import "../Storage/WrapAddresses.sol";

contract Ticket is WrapAddresses {
    struct pack {
        uint32 hasCount;
        uint32 useCount;
    }

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

    uint32 internal totalUsedCount = 0;
    uint256 internal refundCount = 0;
    uint8 internal isCalculated = 0;
    uint256 internal quantity;
    address internal owner;
    uint8 internal ver = 1;

    mapping(address => pack) internal buyList;
    PackInfo internal packInfo;
}

contract Coupon is WrapAddresses {
    struct pack {
        uint32 hasCount;
        uint32 useCount;
    }

    struct PackInfo {
        uint32 total;
        uint32 maxCount;
        uint32 times0;
        uint32 times1;
        uint32 times2;
        uint32 times3;
    }

    uint256 internal quantity;
    address internal owner;
    uint8 internal ver = 1;

    mapping(address => pack) internal buyList;
    PackInfo internal packInfo;
}

contract Subscription is WrapAddresses {
    struct pack {
        uint32 hasCount;
    }

    struct PackInfo {
        uint32 total;
        uint32 times0;
        uint32 times1;
        uint32 times2;
        uint32 times3;
        uint256 price;
        uint16 tokenType;
    }

    uint256 internal refundCount = 0;
    uint256 internal noshowCount = 0;
    uint256 internal noshowLimit = 0;
    uint256 internal quantity;
    uint256 internal isLive = 0;
    uint256 internal noShowTime = 0;
    address internal owner;
    uint8 internal ver = 1;

    mapping(address => pack) internal buyList;
    PackInfo internal packInfo;
}
