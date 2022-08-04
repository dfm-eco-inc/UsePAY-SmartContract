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

    function changeTotal(uint32 _count) external payable onlyOwner {
        require(packInfo.total - quantity <= _count, "TC01 - Count smaller than before");
        require(_count <= 1000, "C05 - Limit count over");
        if (_count > packInfo.total) {
            checkFee(_count - packInfo.total);
            _swap(101, msg.sender, msg.value);
            quantity = quantity + (_count - packInfo.total);
        } else {
            quantity = quantity - (packInfo.total - _count);
        }
        emit changeTotalEvent(address(this), packInfo.total, _count);
        packInfo.total = _count;
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
