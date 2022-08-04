// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.8.0;

import "../../Pack/CouponPack.sol";
import "./BSC_Commander.sol";

contract BSC_CouponCommander is Commander, Coupon {
    event changeTotalEvent(address indexed, uint256 _before, uint256 _after);

    modifier onlyOwner() {
        require(msg.sender == owner, "O01 - Only for issuer");
        _;
    }

    function changeTotal(uint32 count) external payable onlyOwner {
        require(packInfo.total - quantity <= count, "TC01 - Less than the remaining quantity");
        require(count <= 1000, "C05 - Limit count over");

        if (count > packInfo.total) {
            checkFee(count - packInfo.total);
            _swap(101, msg.sender, msg.value);
        }

        quantity = quantity - (packInfo.total - count);
        packInfo.total = count;

        emit changeTotalEvent(address(this), packInfo.total, count);
    }

    function viewInfo() external view returns (PackInfo memory) {
        return packInfo;
    }

    function viewUser(address _addr) external view returns (pack memory) {
        return buyList[_addr];
    }

    function viewQuantity() external view returns (uint256) {
        return quantity;
    }

    function viewOwner() external view returns (address) {
        return owner;
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
