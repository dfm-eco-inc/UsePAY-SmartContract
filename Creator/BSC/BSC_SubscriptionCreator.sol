// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.8.0;
pragma experimental ABIEncoderV2;

import "../../Pack/SubscriptionPack.sol";
import "../../Commander/BSC/BSC_Commander.sol";

contract BSC_SubscriptionCreator is Subscription, Commander {
    event createSubscriptionEvent(address indexed pack, uint256 createNum, PackInfo packInfo); // 0: pack indexed, 1: unique number, 2: PackInfo

    function createSubscription(PackInfo calldata _packInfo, uint256 _createNum) external payable {
        require(_packInfo.total <= 1000, "C05");
        checkFee(packInfo.total);
        _swap(101, msg.sender, msg.value);
        SubscriptionPack pers = new SubscriptionPack(_packInfo, msg.sender);
        emit createSubscriptionEvent(address(pers), _createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
