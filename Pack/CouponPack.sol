// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import '../Storage/Pack.sol';
import '../Storage/WrapAddresses.sol';

contract CouponPack is Coupon {
    constructor(PackInfo memory newPackInfo, address ownerAddress) {
        require(ownerAddress != address(0), 'AD01 - Not available for manager');

        packInfo = newPackInfo;
        quantity = newPackInfo.total;
        owner = ownerAddress;
    }

    fallback() external payable {
        (bool success, bytes memory packBytes) = address(ADR_ADDRESSES).staticcall(
            abi.encodeWithSignature('viewAddress(uint16)', ADR_COUPON_COMMANDER)
        );

        require(success, 'CouponPack address Fail');

        address coupon_commander = abi.decode(packBytes, (address));

        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())

            let result := delegatecall(gas(), coupon_commander, ptr, calldatasize(), 0, 0)
            returndatacopy(ptr, 0, returndatasize())

            switch result
            case 0 {
                revert(ptr, returndatasize())
            }
            default {
                return(ptr, returndatasize())
            }
        }
    }
}
