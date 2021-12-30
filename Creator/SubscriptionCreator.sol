// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;
pragma experimental ABIEncoderV2;

import "../Pack/Pack.sol";
import "../Pack/SubscriptionPack.sol";
import "../Commander/Commander.sol";
import "../Utils/Percentage.sol";

contract SubscriptionCreator is Subscription, Commander, Percentage {
    
    event createSubscriptionEvent( address indexed pack, uint256 createTime, PackInfo packInfo );  // 0: pack indexed, 1 : craeteTime , 2 : packInfo
    function createSubscription( PackInfo calldata _packInfo ) external payable 
    {
        ( ,bytes memory result0 ) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",101));
        _swap(msg.sender,msg.value,address(0),abi.decode(result0,(address)));
        (,bytes memory result) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",1300));
        (,bytes memory resultPercent) = address(abi.decode(result,(address))).staticcall(abi.encodeWithSignature("getValue(uint256,uint256)",_packInfo.total,60));
        SubscriptionPack pers = new SubscriptionPack( _packInfo, abi.decode(resultPercent,(uint)), msg.sender );
        emit createSubscriptionEvent( address(pers), block.timestamp, _packInfo );
    }
}