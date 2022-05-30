// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >= 0.7.0;
pragma experimental ABIEncoderV2;

import "../Pack/CouponPack.sol";
import "./Commander.sol";
contract CouponCommander is Commander,Coupon {
     
    event buyEvent(address indexed pack, uint256 buyNum, address buyer,uint256 count); // 0: pack indexed, 1: buyer, 2: count 
    event useEvent(address indexed pack, address user,uint256 count); // 0: pack indexed, 1: buyer, 2: count 
    event requestRefundEvent(address indexed pack, address buyer ,uint256 count); // 0: pack indexed, 1: buyer, 2: count
    event calculateRefundEvent(address indexed pack, address[] buyers ) ;
    event calculateEvent(address indexed); 
    event changeTotalEvent(address indexed,uint256 _before,uint256 _after);

    //-----------------------------------------
    //  modifiers
    //-----------------------------------------
    
    
    modifier onlyOwner() { require ( msg.sender == owner, "O01" ); _; }
    // modifier canUse(uint256 count) { 
    //     require ( buyList[msg.sender].hasCount - buyList[msg.sender].useCount >= count, "U02" );
    //     _; 
    // }
    // modifier canBuy(uint256 count) { 
    //     require (count<=packInfo.maxCount,"");
    //     require ( block.timestamp >= packInfo.times0 && block.timestamp <= packInfo.times1, "B01" ); 
    //     require ( quantity - count >= 0 , "B04"); 
    //     _; 
    // }


    // function _buy(uint32 count, address buyer) private {
    //     buyList[buyer].hasCount = buyList[buyer].hasCount+( count );
    //     quantity = quantity - count ;
    // }
    
    
    // //-----------------------------------------
    // //  payableFunctions
    // //-----------------------------------------
    
    // function buy( uint32 count , uint256 buyNum ) external payable canBuy(count) {
    //     _buy(count, msg.sender);
    //     emit buyEvent(  address( this ), buyNum, msg.sender, count );
    // }
    
    // function give(address[] memory toAddr) external payable canUse( toAddr.length ) {
    //     require(block.timestamp<packInfo.times3,"");
    //     buyList[msg.sender].hasCount = buyList[msg.sender].hasCount- uint32(toAddr.length);
    //     for(uint i=0; i<toAddr.length; i++) {
    //         buyList[toAddr[i]].hasCount++;
    //     }
    //     emit giveEvent( address(this), msg.sender, toAddr );
    // }
    
    // function gift( address[] memory toAddr ) external payable canBuy(toAddr.length) {
    //     for ( uint i =0; i<toAddr.length; i++) {
    //         buyList[toAddr[i]].hasCount++;
    //     }
    //     quantity = quantity - toAddr.length ;
    //     emit giftEvent( address(this), msg.sender, toAddr);
    // }
    
    // function use( uint32 _count ) external payable canUse( _count ) {
    //     require ( block.timestamp > packInfo.times2 && block.timestamp < packInfo.times1, "U01" );
    //     buyList[msg.sender].useCount = buyList[msg.sender].useCount+(_count);
    //     emit useEvent( address( this ), msg.sender, _count );
    // }
    
    function changeTotal(uint32 _count) external payable onlyOwner {
        require(packInfo.total - quantity <= _count,"count too high");
        if ( _count > packInfo.total ) {
            checkFee(_count-packInfo.total);    
            _swap(msg.sender,msg.value);
            quantity = quantity + ( _count - packInfo.total );
        }else {
            quantity = quantity - ( packInfo.total - _count );
        }
        emit changeTotalEvent(address(this),packInfo.total,_count);
        packInfo.total = _count;
    }
    
    
    //-----------------------------------------
    //  viewFunctions
    //-----------------------------------------
    function viewInfo() external view returns (PackInfo memory) { return packInfo; }
    
    function viewUser(address _addr) external view returns (pack memory) { return buyList[_addr]; }
    
    // function viewQuantity() external view returns (uint256) { return quantity; }
    
    function viewOwner() external view returns (address) { return owner; }

    function viewVersion() external view returns (uint8) { return ver; }
}