// SPDX-License-Identifier: MIT
pragma solidity >= 0.7.0;
pragma experimental ABIEncoderV2;

import "../Storage/WrapAddresses.sol";

contract Ticket is WrapAddresses {

    struct pack {
        uint32 hasCount;
        uint32 useCount;
    }
    
    address owner;
    uint256 quantity;
    uint256 refundCount = 0;
    
    struct PackInfo {
        uint32 total;
        uint32 times0;
        uint32 times1;
        uint32 times2;
        uint32 times3;
        uint256 price;
        uint8 tokenType;
        uint8 noshowValue;
        uint8 maxCount;
    }
    
    mapping(address=>pack) buyList;
    
    PackInfo packInfo;
}

contract Coupon is WrapAddresses {
    
    struct pack {
        uint32 hasCount;
        uint32 useCount;
    }
    
    uint256 quantity;
    
    mapping(address=>pack) buyList;
    
    struct PackInfo {
        uint32 total;
        uint32 maxCount;
        uint32 times0;
        uint32 times1;
        uint32 times2;
        uint32 times3;
    }
    address owner;
    PackInfo packInfo;
}

contract Subscription is WrapAddresses {
    struct pack {
        uint32 hasCount;
    }
    
    uint256 refundCount = 0;
    uint256 noshowCount = 0;
    uint256 noshowLimit;
    uint256 quantity;
    uint256 isLive = 0;
    address owner;
    
    struct PackInfo {
        uint32 total;
        uint32 times0;
        uint32 times1;
        uint32 times2;
        uint32 times3;
        uint256 price;
        uint8 tokenType;
    }
    
    mapping(address=>pack) buyList;
    
    PackInfo packInfo;
}