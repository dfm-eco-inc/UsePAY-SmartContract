// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import "../../Pack/CouponPack.sol";
import "./KLA_Commander.sol";

contract KLA_CouponCommander is KLA_Commander, Coupon {
    event ChangeTotalEvent(address indexed, uint256 _before, uint256 _after);

    modifier onlyOwner() {
        require(msg.sender == owner, "O01 - Only for issuer");
        _;
    }

    function changeTotal(uint32 count) external payable onlyOwner {
        require(packInfo.total - quantity <= count, "TC01 - Less than the remaining quantity");
        require(count <= 3000, "C05 - Limit count over");

        if (count > packInfo.total) {
            checkFee(count - packInfo.total);
            _transfer(100, getAddress(0), msg.value);
        }

        quantity = quantity - (packInfo.total - count);
        packInfo.total = count;

        emit ChangeTotalEvent(address(this), packInfo.total, count);
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
