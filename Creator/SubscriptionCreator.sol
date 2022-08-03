// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.8.0;

import "../Pack/SubscriptionPack.sol";
import "../Commander/Commander.sol";

contract SubscriptionCreator is Subscription, Commander {
    event createSubscriptionEvent(address indexed pack, uint256 createNum, PackInfo packInfo); // 0: pack indexed, 1 : reference value , 2 : packInfo

    function createSubscription(PackInfo calldata _packInfo, uint256 createNum) external payable {
        require(_packInfo.total <= 1000, "C05");
        checkFee(packInfo.total);
        _swap(msg.sender, msg.value);
        SubscriptionPack pers = new SubscriptionPack(_packInfo, msg.sender);
        emit createSubscriptionEvent(address(pers), createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
