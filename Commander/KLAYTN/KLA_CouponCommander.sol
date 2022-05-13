// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >= 0.7.0;
pragma experimental ABIEncoderV2;

import "../../Pack/CouponPack.sol";
import "../../Pack/Pack.sol";
import "./KLA_Commander.sol";
contract KLA_CouponCommander is KLA_Commander,Coupon {
    
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

    
    function changeTotal(uint32 _count) external payable onlyOwner {
        require(packInfo.total - quantity <= _count,"count too high");
        if ( _count > packInfo.total ) {
            checkFee(_count-packInfo.total);    
            (,bytes memory result0 ) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",0));
            _transfer(100,abi.decode(result0,(address)),msg.value);
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
    
    function viewQuantity() external view returns (uint256) { return quantity; }
    
    function viewOwner() external view returns (address) { return owner; }

    function viewVersion() external view returns (uint8) { return ver; }
}