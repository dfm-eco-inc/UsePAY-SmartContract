// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import '../Pack/SubscriptionPack.sol';
import '../Commander/Commander.sol';

contract SubscriptionCreator is Commander, Subscription {
    event CreateSubscriptionEvent(
        address indexed packAddress,
        uint256 txUniqueNumber,
        PackInfo packInfo,
        uint256 feePrice,
        uint swappedAmount
    );

    function createSubscription(PackInfo calldata packInfo, uint256 txUniqueNumber) external payable {
        require(msg.sender != address(0), 'Invalid account');
        require(packInfo.total <= MAX_SUBSCRIPTION_QTY && packInfo.total > 0, 'C05 - Wrong total count');
        require(
            packInfo.times0 < packInfo.times1 &&
                packInfo.times1 < packInfo.times3 &&
                packInfo.times0 < packInfo.times2 &&
                packInfo.times2 < packInfo.times3,
            'Invalid timing structure'
        );

        checkFee(packInfo.total);
        uint swapAmount = _swap(ADR_PAC_TOKEN, msg.sender, msg.value);
        SubscriptionPack pack = new SubscriptionPack(packInfo, msg.sender);

        emit CreateSubscriptionEvent(address(pack), txUniqueNumber, packInfo, msg.value, swapAmount);
    }

    function viewVersion() external pure returns (uint8) {
        return ver;
    }
}
