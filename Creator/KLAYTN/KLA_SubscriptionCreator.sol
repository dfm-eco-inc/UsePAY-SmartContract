// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.8.0;
pragma experimental ABIEncoderV2;

import "../../Pack/SubscriptionPack.sol";
import "../../Commander/KLAYTN/KLA_Commander.sol";

contract KLA_SubscriptionCreator is Subscription, KLA_Commander {
    event createSubscriptionEvent(address indexed pack, uint256 createNum, PackInfo packInfo); // 0: pack indexed, 1 : craeteTime , 2 : packInfo

    function createSubscription(PackInfo calldata _packInfo, uint256 _createNum) external payable {
        require(_packInfo.total <= 1000, "C05");
        checkFee(packInfo.total);
        (, bytes memory managerAddress) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", 0)
        );
        _transfer(100, abi.decode(managerAddress, (address)), msg.value);
        SubscriptionPack pers = new SubscriptionPack(_packInfo, msg.sender);
        emit createSubscriptionEvent(address(pers), _createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
