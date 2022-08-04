// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.8.0;

import "./Pack.sol";

contract SubscriptionPack is Subscription {
    constructor(PackInfo memory _packInfo, address _owner) {
        require(_owner != address(0), "AD01");
        packInfo = _packInfo;
        quantity = _packInfo.total;
        owner = _owner;
    }

    fallback() external payable {
        (bool success, bytes memory packBytes) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", 10002)
        );
        require(success, "SubscriptionPack address Fail");
        address subscription_commander = abi.decode(packBytes, (address));
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())
            let result := delegatecall(gas(), subscription_commander, ptr, calldatasize(), 0, 0)
            returndatacopy(ptr, 0, returndatasize())
            switch result
            case 0 {
                revert(ptr, returndatasize()) //fail
            }
            default {
                return(ptr, returndatasize()) //success
            }
        }
    }
}
