// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import "../Pack/CouponPack.sol";
import "../Commander/Commander.sol";

contract CouponCreator is Commander, Coupon {
    event CreateCouponEvent(address indexed pack, uint256 createNum, PackInfo packInfo);

    function createCoupon(PackInfo calldata _packInfo, uint256 createNum) external payable {
        require(_packInfo.total <= 3000, "C05 - Limit count over");
        require(
            _packInfo.times0 < _packInfo.times1 &&
                _packInfo.times1 < _packInfo.times3 &&
                _packInfo.times0 < _packInfo.times2 &&
                _packInfo.times2 < _packInfo.times3,
            "Invalid timing structure"
        );

        checkFee(packInfo.total);

        _swap(msg.sender, msg.value);
        CouponPack pers = new CouponPack(_packInfo, msg.sender);

        emit CreateCouponEvent(address(pers), createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
