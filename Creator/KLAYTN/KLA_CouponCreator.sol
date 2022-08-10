// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import "../../Pack/CouponPack.sol";
import "../../Commander/KLAYTN/KLA_Commander.sol";

contract KLA_CouponCreator is KLA_Commander, Coupon {
    event CreateCouponEvent(address indexed pack, uint256 createNum, PackInfo packInfo);

    function createCoupon(PackInfo calldata _packInfo, uint256 _createNum) external payable {
        require(_packInfo.total <= 3000, "C05 - Limit count over");

        checkFee(packInfo.total);

        _transfer(100, getAddress(0), msg.value);
        CouponPack pers = new CouponPack(_packInfo, msg.sender);

        emit CreateCouponEvent(address(pers), _createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
