// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import '../Pack/CouponPack.sol';
import '../Commander/Commander.sol';

contract CouponCreator is Commander, Coupon {
    event CreateCouponEvent(address indexed packAddress, uint256 txUniqueNumber, PackInfo packInfo);

    function createCoupon(PackInfo calldata packInfo, uint256 txUniqueNumber) external {
        require(msg.sender != address(0), 'Invalid account');
        require(packInfo.total <= MAX_TICKET_QTY && packInfo.total > 0, 'C05 - Wrong total count');
        require(
            packInfo.times0 < packInfo.times1 &&
                packInfo.times1 < packInfo.times3 &&
                packInfo.times0 < packInfo.times2 &&
                packInfo.times2 < packInfo.times3,
            'Invalid timing structure'
        );

        CouponPack pack = new CouponPack(packInfo, msg.sender);

        emit CreateCouponEvent(address(pack), txUniqueNumber, packInfo);
    }

    function viewVersion() external pure returns (uint8) {
        return ver;
    }
}
