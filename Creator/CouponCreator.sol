// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.8.0;

import "../Pack/CouponPack.sol";
import "../Commander/Commander.sol";

contract CouponCreator is Commander, Coupon {
    event createCouponEvent(address indexed pack, uint256 createNum, PackInfo packInfo); // 0: pack indexed, 2: reference value, 3: PackInfo

    function createCoupon(PackInfo calldata _packInfo, uint256 createNum) external payable {
        require(_packInfo.total <= 3000, "C05");
        checkFee(packInfo.total);
        _swap(msg.sender, msg.value);
        CouponPack pers = new CouponPack(_packInfo, msg.sender);
        emit createCouponEvent(address(pers), createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
