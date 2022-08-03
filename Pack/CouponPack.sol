// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.8.0;

import "./Pack.sol";

contract CouponPack is Coupon {
    constructor(PackInfo memory _packInfo, address _owner) {
        require(_owner != address(0), "AD01");
        packInfo = _packInfo;
        owner = _owner;
        quantity = _packInfo.total;
    }

    fallback() external payable {
        (bool success, bytes memory result0) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", 10001)
        );
        require(success, "viewCouponCommander Fail");
        address coupon_commander = abi.decode(result0, (address));
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())
            let result := delegatecall(gas(), coupon_commander, ptr, calldatasize(), 0, 0)
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
