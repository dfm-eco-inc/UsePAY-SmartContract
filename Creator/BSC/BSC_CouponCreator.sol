// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import "../../Pack/CouponPack.sol";
import "../../Commander/BSC/BSC_Commander.sol";

contract BSC_CouponCreator is Commander, Coupon {
    event CreateCouponEvent(address indexed pack, uint256 createNum, PackInfo packInfo);

    function createCoupon(PackInfo calldata _packInfo, uint256 _createNum) external {
        require(_packInfo.total <= 3000, "C05 - Limit count over");
        require(
            _packInfo.times0 < _packInfo.times1 &&
                _packInfo.times1 < _packInfo.times3 &&
                _packInfo.times0 < _packInfo.times2 &&
                _packInfo.times2 < _packInfo.times3,
            "Invalid timing structure"
        );

        CouponPack pers = new CouponPack(_packInfo, msg.sender);

        emit CreateCouponEvent(address(pers), _createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
