// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >= 0.7.0;
pragma experimental ABIEncoderV2;

import "./Pack.sol";

contract SubscriptionPack is Subscription {

    event constructorEvent(uint256 limit,address owner);
    constructor ( PackInfo memory _packInfo, address _owner) {
        packInfo = _packInfo;
        quantity = _packInfo.total;
        owner = _owner;
    }

    
    receive () external payable {}
    fallback() external payable {
        (,bytes memory result0) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",10002));
        address subscription_commander = abi.decode(result0,(address));
        //get Data 
        assembly {
            let ptr := mload( 0x40 )
            calldatacopy( ptr, 0, calldatasize() )
            let result := delegatecall( gas(), subscription_commander , ptr, calldatasize(), 0, 0 )
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