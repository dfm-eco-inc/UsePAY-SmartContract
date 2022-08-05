// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.8.0;

import "../../Pack/CouponPack.sol";
import "../../Commander/BSC/BSC_Commander.sol";

contract BSC_CouponCreator is Commander, Coupon {
    event createCouponEvent(address indexed pack, uint256 createNum, PackInfo packInfo); // 0: pack indexed, 1: reference value, 2: PackInfo

    function createCoupon(PackInfo calldata _packInfo, uint256 _createNum) external {
        require(_packInfo.total <= 3000, "C05 - Limit count over");

        CouponPack pers = new CouponPack(_packInfo, msg.sender);

        emit createCouponEvent(address(pers), _createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
