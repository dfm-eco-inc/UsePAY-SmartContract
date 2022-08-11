// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import "../../Pack/SubscriptionPack.sol";
import "../../Commander/KLAYTN/KLA_Commander.sol";

contract KLA_SubscriptionCreator is Subscription, KLA_Commander {
    event CreateSubscriptionEvent(address indexed pack, uint256 createNum, PackInfo packInfo);

    function createSubscription(PackInfo calldata _packInfo, uint256 _createNum) external payable {
        require(_packInfo.total <= 1000, "C05 - Limit count over");
        require(
            _packInfo.times0 < _packInfo.times1 &&
                _packInfo.times1 < _packInfo.times3 &&
                _packInfo.times0 < _packInfo.times2 &&
                _packInfo.times2 < _packInfo.times3,
            "Invalid timing structure"
        );

        checkFee(packInfo.total);

        _transfer(100, getAddress(0), msg.value);
        SubscriptionPack pers = new SubscriptionPack(_packInfo, msg.sender);

        emit CreateSubscriptionEvent(address(pers), _createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
