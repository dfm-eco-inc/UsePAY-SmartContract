// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >= 0.7.0;
pragma experimental ABIEncoderV2;
import "./Pack.sol";

contract CouponPack is Coupon {
    constructor ( PackInfo memory _packInfo , address _owner ) {
        packInfo = _packInfo;
        owner = _owner;
        quantity = _packInfo.total;
    }
    
    
    receive () external payable {}
    fallback() external payable {
        (bool success, bytes memory result0) = address( iAddresses ).staticcall(abi.encodeWithSignature("viewAddress(uint16)",10001));
        require( success, "viewCouponCommander Fail");
        (address coupon_commander) = abi.decode(result0,(address));
        //get Data 
        assembly {
            let ptr := mload( 0x40 )
            calldatacopy( ptr, 0, calldatasize() )
            let result := delegatecall( gas(), coupon_commander , ptr, calldatasize(), 0, 0 )
            returndatacopy( ptr, 0, returndatasize() )
            switch result 
                case 0 { //fail
                    revert( ptr, returndatasize() )
                } 
                default { //success
                    return( ptr, returndatasize() )
                }
        }
    }
}