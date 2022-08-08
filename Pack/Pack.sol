// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import "../Storage/WrapAddresses.sol";

contract Ticket is WrapAddresses {
    struct pack {
        uint32 hasCount;
        uint32 useCount;
    }

    struct PackInfo {
        uint8 noshowValue;
        uint16 tokenType;
        uint32 total;
        uint32 times0;
        uint32 times1;
        uint32 times2;
        uint32 times3;
        uint32 maxCount;
        uint256 price;
    }

    bool internal isCalculated = false;
    uint8 internal immutable ver = 1;
    uint32 internal totalUsedCount = 0;
    uint32 internal quantity;
    address internal owner;

    PackInfo internal packInfo;
    mapping(address => pack) internal buyList;
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

    uint8 internal immutable ver = 1;
    uint32 internal quantity;
    address internal owner;

    PackInfo internal packInfo;
    mapping(address => pack) internal buyList;
}

contract Subscription is WrapAddresses {
    struct pack {
        uint32 hasCount;
    }

    struct PackInfo {
        uint16 tokenType;
        uint32 total;
        uint32 times0;
        uint32 times1;
        uint32 times2;
        uint32 times3;
        uint256 price;
    }

    uint8 internal immutable ver = 1;
    uint32 internal quantity;
    address internal owner;

    PackInfo internal packInfo;
    mapping(address => pack) internal buyList;
}
