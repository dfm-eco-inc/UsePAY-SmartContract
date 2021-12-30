// SPDX-License-Identifier: MIT
pragma solidity >= 0.7.0;
pragma experimental ABIEncoderV2;

import "../../Pack/TicketPack.sol";
import "../../Pack/Pack.sol";
import "./BSC_Commander.sol";

contract BSC_TicketCommander is Ticket,Commander {
    
    //-----------------------------------------
    //  events
    //-----------------------------------------
    event buyEvent(address indexed pack, address buyer,uint256 count); // 0: pack indexed, 1: buyer, 2: count 
    event useEvent(address indexed pack, address user,uint256 count); // 0: pack indexed, 1: buyer, 2: count 
    event requestRefundEvent(address indexed pack, address buyer ,uint256 count, uint256 money, uint256 swap); // 0: pack indexed, 1: buyer, 2: count
    event calculateRefundEvent(address indexed pack, address[] buyers ) ;
    event calculateEvent(address indexed); 
    event changeTotalEvent(address indexed,uint256 _before,uint256 _after);

    //-----------------------------------------
    //  modifiers
    //-----------------------------------------
    
    
    modifier onlyOwner() { require ( msg.sender == owner, "O01" ); _; }
    modifier onCaculateTime() { require ( block.timestamp > packInfo.times3 , "CT01" );  _; }
    modifier canUse(uint256 count) { 
        require ( buyList[msg.sender].hasCount - buyList[msg.sender].useCount >= count, "U02" );
        _; 
    }
    modifier canBuy(uint256 count) { 

        require ( block.timestamp >= packInfo.times0 && block.timestamp <= packInfo.times1, "B01" ); 
        require ( quantity - count >= 0 , "B04"); 
        if ( packInfo.tokenType ==  0 ) {
            require ( msg.value == packInfo.price*( count ) , "B03" );
        } else {
            (,bytes memory tokenResult) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",uint16(packInfo.tokenType)));
            (bool success,) = address(abi.decode(tokenResult,(address))).call(abi.encodeWithSignature("transferFrom(address,address,uint256)",msg.sender, address( this ), packInfo.price*( count )));
            require ( success , "T01");
        }
        _; 
        
    }


    function _buy(uint32 count, address buyer) private {
        buyList[buyer].hasCount = buyList[buyer].hasCount+( count );
        quantity = quantity - count ;
    }
    
    function _refund( address _to, uint256 _count,uint8 percent  ) private returns (uint256,uint256) {
        ( ,bytes memory result0 ) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",101));
        (address DFM) = abi.decode(result0,(address));
        ( ,bytes memory result1 ) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",uint16(packInfo.tokenType)));
        (address TOKEN) = abi.decode(result1,(address));
            
        uint refundValue = 0;
        uint refundPercentValue = 0;
        uint swapValue = 0;
        if ( TOKEN == DFM ) {
            if ( block.timestamp > packInfo.times3 ) {
                refundValue = refundValue + (packInfo.price *  _count)/100 * (100-packInfo.noshowValue);
            } else {
                refundValue = refundValue + (packInfo.price *  _count);
            }
        }else {
            if ( block.timestamp > packInfo.times3 ) {
                refundValue = refundValue + (packInfo.price *  _count)/100 * (100-packInfo.noshowValue - percent);
            } else {
                refundValue = refundValue + (packInfo.price *  _count)/100 * (100-percent);
            }
            refundPercentValue = refundPercentValue + ((packInfo.price * _count)/100 * percent);
        }
        if (refundValue != 0 ) {
            _transfer(packInfo.tokenType,_to,refundValue);
        }
        if (refundPercentValue != 0 ) {
            swapValue = _swap(_to,refundPercentValue,TOKEN,DFM);
        }
        return (refundValue,swapValue);
    }
    

    
    //-----------------------------------------
    //  payableFunctions
    //-----------------------------------------

    

    
    function buy( uint32 count ) external payable canBuy(count) {
        require (count<=packInfo.maxCount,"");
        _buy(count, msg.sender);
        emit buyEvent(  address( this ),msg.sender, count );
    }
    
    function give(address[] memory toAddr) external payable canUse( toAddr.length ) {
        require(block.timestamp<packInfo.times3,"");
        buyList[msg.sender].hasCount = buyList[msg.sender].hasCount- uint32(toAddr.length);
        for(uint i=0; i<toAddr.length; i++) {
            buyList[toAddr[i]].hasCount++;
        }
        emit giveEvent( address(this), msg.sender, toAddr );
    }
    
    function gift( address[] memory toAddr ) external payable canBuy(toAddr.length){
        for ( uint i =0; i<toAddr.length; i++) {
            buyList[toAddr[i]].hasCount++;
        }
        quantity = quantity - toAddr.length ;
        emit giftEvent( address(this), msg.sender, toAddr);
    }
    
    function use( uint32 _count ) external payable canUse( _count ) {
        require ( block.timestamp > packInfo.times2 && block.timestamp < packInfo.times1, "U01" );
        buyList[msg.sender].useCount = buyList[msg.sender].useCount+(_count);
        _transfer( packInfo.tokenType, owner, packInfo.price*( _count ) );
        emit useEvent( address( this ), msg.sender, _count );
    }
    
    function requestRefund( uint32 _count ) external payable canUse(_count) {
        uint256 refundValue = 0;
        uint256 swapValue = 0;
        if ( block.timestamp < packInfo.times2 ) {
            ( refundValue,swapValue ) = _refund(msg.sender,_count,0);
        } else {
            ( refundValue,swapValue ) = _refund(msg.sender,_count,5);
        }
        buyList[msg.sender].hasCount = buyList[msg.sender].hasCount - _count;
        if (block.timestamp < packInfo.times1) {
            quantity = quantity + _count;
        }
        emit requestRefundEvent(address(this),msg.sender,_count,refundValue,swapValue);
    }
    
    function calculate( address[] calldata toAddr ) external payable onlyManager(msg.sender) onCaculateTime {
        uint useCount = 0;
        for ( uint i = 0; i<toAddr.length; i++) {
            _refund( toAddr[i],buyList[toAddr[i]].hasCount - buyList[toAddr[i]].useCount, 10 );    
            useCount = useCount + buyList[toAddr[i]].useCount;
        }
        emit calculateRefundEvent(address(this),toAddr);
        uint noshowCount = quantity - useCount;
        uint money = ( packInfo.price / 100 * packInfo.noshowValue * noshowCount ) + ( useCount * packInfo.price );
        uint balance = 0;
        if ( packInfo.tokenType == 100 ) {
            balance = address(this).balance;
        } else {
            (,bytes memory tokenAddressResult) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",packInfo.tokenType));
            address tokenAddress = abi.decode(tokenAddressResult,(address));
            (,bytes memory balanceResult) = address(tokenAddress).staticcall(abi.encodeWithSignature("balanceOf(address)",address(this)));
            balance = abi.decode(balanceResult,(uint256));
        }
        require(balance == money,"");
        _transfer(packInfo.tokenType,owner,money);
        emit calculateEvent(address(this));
    }
    
    function changeTotal(uint32 _count) external payable onlyOwner {
        require(packInfo.total - quantity <= _count,"count too high");
        if ( _count > packInfo.total ) {
            checkFee(_count-packInfo.total);    
            
            ( ,bytes memory result0 ) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",101));
            (address DFM) = abi.decode(result0,(address));
            _swap(msg.sender,msg.value,address(0),DFM);
            
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
}