// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import "../Pack/SubscriptionPack.sol";
import "../Commander/Commander.sol";

contract SubscriptionCreator is Subscription, Commander {
    event CreateSubscriptionEvent(address indexed pack, uint256 createNum, PackInfo packInfo);

    function createSubscription(PackInfo calldata _packInfo, uint256 createNum) external payable {
        require(_packInfo.total <= 1000, "C05 - Limit count over");
        require(
            _packInfo.times0 < _packInfo.times1 &&
                _packInfo.times1 < _packInfo.times3 &&
                _packInfo.times0 < _packInfo.times2 &&
                _packInfo.times2 < _packInfo.times3,
            "Invalid timing structure"
        );

        checkFee(packInfo.total);

        _swap(msg.sender, msg.value);
        SubscriptionPack pers = new SubscriptionPack(_packInfo, msg.sender);

        emit CreateSubscriptionEvent(address(pers), createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
