// SPDX-License-Identifier: MIT
pragma solidity >= 0.7.0;
pragma experimental ABIEncoderV2;

import "../../Pack/CouponPack.sol";
import "../../Pack/Pack.sol";
import "../../Commander/BSC/BSC_Commander.sol";
contract BSC_CouponCreator is Commander,Coupon {
    event createCouponEvent( address indexed pack, uint256 createTime, PackInfo packInfo ); // 0: pack indexed, 2: createTime, 3: PackInfo
    function createCoupon(  PackInfo calldata _packInfo   ) external payable 
    {
        ( ,bytes memory result0 ) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",101));
        (address DFM) = abi.decode(result0,(address));
        _swap(msg.sender,msg.value,address(0),DFM);
        CouponPack pers = new CouponPack( _packInfo, msg.sender );
        emit createCouponEvent(address( pers ), block.timestamp , _packInfo);
    }
}