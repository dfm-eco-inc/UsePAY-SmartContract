// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import '../../Pack/CouponPack.sol';
import '../../Commander/BSC/BSC_Commander.sol';

contract BSC_CouponCreator is Commander, Coupon {
    uint8 private swapCount;
    uint16[2] private tokenIdx = [550, 101];
    uint8 private nowSwap;

    event createCouponEvent(address indexed pack, uint256 createNum, PackInfo packInfo); // 0: pack indexed, 2: createTime, 3: PackInfo

    function createCoupon(PackInfo calldata _packInfo, uint256 _createNum) external payable {
        require(_packInfo.total <= 3000, 'C05');
        CouponPack pers = new CouponPack(_packInfo, msg.sender);
        emit createCouponEvent(address(pers), _createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
