// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;
pragma experimental ABIEncoderV2;

import "../../Pack/Pack.sol";
import "../../Pack/SubscriptionPack.sol";
import "./BSC_Commander.sol";

contract BSC_SubscriptionCommander is Subscription,Commander {

    
    //-----------------------------------------
    //  events
    //-----------------------------------------
    event buyEvent(address indexed pack, address buyer); // 0: pack indexed, 1: buyer, 2: count 
    event requestRefundEvent(address indexed pack, address buyer , uint256 money, uint256 swap); // 0: pack indexed, 1: buyer, 2: count
    event calculateRefundEvent(address indexed pack, address[] buyers );
    event noshowRefundEvent(address indexed pack, address[] buyers);
    event calculateEvent(address indexed pack); 
    event changeTotalEvent(address indexed,uint256 _before,uint256 _after);
    
    //-----------------------------------------
    //  modifiers
    //-----------------------------------------
    modifier onlyOwner { require(msg.sender == owner ,"O01"); _; }
    modifier onCaculateTime() { require ( block.timestamp > packInfo.times3 , "CT01" );  _; }
    modifier canBuy() { 
        require ( buyList[msg.sender].hasCount == 0 , "B00");
        require ( block.timestamp >= packInfo.times0 && block.timestamp <= packInfo.times1, "B01" ); 
        require ( quantity > 0 , "B04"); 
        if ( packInfo.tokenType ==  0 ) {
            require ( msg.value == packInfo.price , "B03" );
        } else {
            (,bytes memory tokenResult) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",uint16( packInfo.tokenType)));
            (bool success,) = address(abi.decode(tokenResult,(address))).call(abi.encodeWithSignature("transferFrom(address,address,uint256)",msg.sender, address( this ), packInfo.price));
            require ( success , "T01");
        }
        _; 
        
    }
    modifier canUse () { require ( buyList[msg.sender].hasCount !=0 , "U02" ); _; }
    modifier checkLive() { require ( isLive == 0 , "N01");_; }
    
    function _buy(address buyer) private {
        buyList[buyer].hasCount = buyList[buyer].hasCount + 1;
        quantity = quantity - 1;
    }
    
    function _refund( address _to,uint8 percent  ) private returns (uint256,uint256) {
        ( ,bytes memory result0 ) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",101));
        ( ,bytes memory result1 ) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",uint16(packInfo.tokenType)));
        uint refundValue = 0;
        uint refundPercentValue = 0;
        uint swapValue = 0;
        if ( abi.decode(result1,(address)) == abi.decode(result0,(address)) ) {
            refundValue = refundValue + (packInfo.price)/100 * (100-percent);
        }else {
            refundValue = refundValue + (packInfo.price)/100 * (100-percent);
            refundPercentValue = refundPercentValue + ((packInfo.price)/100 * percent);
        }
        if (refundValue != 0 ) {
            _transfer(packInfo.tokenType,_to,refundValue);
        }
        if (refundPercentValue != 0 ) {
            swapValue = _swap(_to,refundPercentValue,abi.decode(result1,(address)),abi.decode(result0,(address)));
        }
        return (refundValue,swapValue);
    }


    

    
    function buy () external payable canBuy() checkLive {
        _buy(msg.sender);
        emit buyEvent( address( this ), msg.sender);
    }
    
    function give(address[] memory toAddr) external payable canUse() checkLive {
        buyList[msg.sender].hasCount = buyList[msg.sender].hasCount - uint32(toAddr.length);
        for(uint i=0; i<toAddr.length; i++) {
            buyList[toAddr[i]].hasCount++;
        }
        emit giftEvent(address(this), msg.sender, toAddr);
    }
    
    // function gift(  address[] memory toAddr ) external payable canBuy() checkLive {
    //     for( uint i=0; i<toAddr.length; i++) {
    //         buyList[toAddr[i]].hasCount++;
    //     }
    //     quantity = quantity - toAddr.length;
    //     emit giveEvent(address(this),msg.sender,toAddr);
    // }
    
    function requestRefund() external payable canUse() checkLive {
        uint8 percent = 0;
        if (block.timestamp > packInfo.times2 && block.timestamp < packInfo.times2 + 86400) {
            noshowCount++;
            if ( noshowCount >= noshowLimit ) {
                isLive = 1;
            }
        } else if ( block.timestamp > packInfo.times2 + 86400 ) {

            uint period = packInfo.times3-packInfo.times2;
            uint refundPeriod = packInfo.times3 - block.timestamp; 
            (,bytes memory result) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",1300));
            (,bytes memory resultPercent) = address(abi.decode(result,(address))).staticcall(abi.encodeWithSignature("getPercent(uint256,uint256)",period,refundPeriod));
            percent = 100-abi.decode(resultPercent,(uint8));
        }
        buyList[msg.sender].hasCount--;
        (uint value, uint swap) = _refund(msg.sender,percent);
        emit requestRefundEvent(address(this),msg.sender,value,swap);
    }
    
    function calculate() external payable onCaculateTime checkLive {
        uint256 a = 259200;
        if ( block.timestamp+( a ) > packInfo.times3 ) { // caculate Manager
            checkManager(msg.sender);
            uint256 balance;
            (,bytes memory result) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",uint16(packInfo.tokenType)));
            (,bytes memory result0) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",101));
            if ( packInfo.tokenType == 100 ) {
                balance = address(this).balance;
            } else {
                (,bytes memory result1) = address(abi.decode(result,(address))).staticcall(abi.encodeWithSignature("balanceOf(address)",address(this)));
                balance = abi.decode(result1,(uint256));
            }
            
            if (packInfo.tokenType == 1 ) {
                _transfer(packInfo.tokenType,owner,balance);
            } else {
                _transfer(packInfo.tokenType,owner,balance/10*9);
                _swap(owner,balance/10*1,abi.decode(result,(address)),abi.decode(result0,(address)));
            }
            
        } else { // caculate Owner
            require ( msg.sender == owner , "you are not owner" );
            uint256 balance;
            if ( packInfo.tokenType ==  0  ) {
                balance = address(this).balance;
            } else {
                (,bytes memory tokenResult) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",uint16(packInfo.tokenType)));
                (,bytes memory result) = address(abi.decode(tokenResult,(address))).staticcall(abi.encodeWithSignature("balanceOf(address)",address(this)));
                balance = abi.decode(result,(uint256));
            }   
            _transfer(packInfo.tokenType,owner,balance);
        }
        emit calculateEvent(address(this));
    }
    
    function noShowRefund(address[] calldata _addrList) external payable onCaculateTime onlyManager(msg.sender) {
        require(isLive==1,"N02");
        (,bytes memory result0) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",101));
        for( uint i = 0; i < _addrList.length; i++ ) {
            address _to = _addrList[i];
            if( packInfo.tokenType==1 ) {
                _transfer(packInfo.tokenType,_to,packInfo.price* (buyList[_to].hasCount) );
            } else {
                _transfer(packInfo.tokenType,_to,packInfo.price*(buyList[_to].hasCount)/100 * 90);
                (,bytes memory tokenResult) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",uint16(packInfo.tokenType)));
                _swap( _to,packInfo.price*(buyList[_to].hasCount)/100 * 10, abi.decode(tokenResult,(address)), abi.decode(result0,(address)) );
            }
        }
        emit noshowRefundEvent(address(this),_addrList);
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
    
    
    function viewInfo() external view returns ( PackInfo memory ) { return packInfo; }
    
    
    function viewOwner() external view returns(address) {
        return owner;
    }
    
    function viewQuantity() external view returns(uint256) { return quantity; }
    
    function viewIsLive() external view returns(uint256) {
        return isLive;
    }
    
    function viewUser( address userAddr ) external view returns ( pack memory ) { return buyList[userAddr]; }
}