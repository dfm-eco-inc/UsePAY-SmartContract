// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.8.0;

import "../../Pack/TicketPack.sol";
import "./KLA_Commander.sol";

contract KLA_TicketCommander is Ticket, KLA_Commander {
    event buyEvent(address indexed pack, uint256 buyNum, address buyer, uint256 count); // 0: pack indexed, 1: buyer, 2: count
    event useEvent(address indexed pack, address user, uint256 count); // 0: pack indexed, 1: buyer, 2: count
    event requestRefundEvent(address indexed pack, address buyer, uint256 count, uint256 money); // 0: pack indexed, 1: buyer, 2: count
    event calculateEvent(address indexed, address owner, uint256 value);
    event changeTotalEvent(address indexed, uint256 _before, uint256 _after);

    modifier onlyOwner() {
        require(msg.sender == owner, "O01");
        _;
    }

    modifier onCalculateTime() {
        require(block.timestamp > packInfo.times3, "CT01");
        _;
    }

    modifier canUse(uint256 count) {
        require(buyList[msg.sender].hasCount - buyList[msg.sender].useCount >= count, "U02");
        _;
    }

    modifier canBuy(uint256 count) {
        require(block.timestamp >= packInfo.times0 && block.timestamp <= packInfo.times1, "B01");
        require(quantity - count >= 0, "B04");
        if (packInfo.tokenType == 100) {
            require(msg.value == packInfo.price * (count), "B03");
        } else {
            (, bytes memory tokenResult) = address(iAddresses).staticcall(
                abi.encodeWithSignature("viewAddress(uint16)", uint16(packInfo.tokenType))
            );
            (bool success, ) = address(abi.decode(tokenResult, (address))).call(
                abi.encodeWithSignature(
                    "transferFrom(address,address,uint256)",
                    msg.sender,
                    address(this),
                    packInfo.price * (count)
                )
            );
            require(success, "T01");
        }
        _;
    }

    function buy(uint32 count, uint256 buyNum) external payable canBuy(count) {
        require(count <= packInfo.maxCount, "B05");
        _buy(count, msg.sender);
        emit buyEvent(address(this), buyNum, msg.sender, count);
    }

    function give(address[] memory toAddr) external canUse(toAddr.length) {
        buyList[msg.sender].hasCount = buyList[msg.sender].hasCount - uint32(toAddr.length);
        for (uint i = 0; i < toAddr.length; i++) {
            buyList[toAddr[i]].hasCount++;
        }
        emit giveEvent(address(this), msg.sender, toAddr);
    }

    function use(uint32 _count) external canUse(_count) {
        require(block.timestamp > packInfo.times2, "U01");
        totalUsedCount = totalUsedCount + _count;
        buyList[msg.sender].useCount = buyList[msg.sender].useCount + (_count);
        _transfer(packInfo.tokenType, owner, packInfo.price * (_count));
        emit useEvent(address(this), msg.sender, _count);
    }

    function requestRefund(uint32 _count) external canUse(_count) blockReEntry {
        uint256 refundValue = 0;
        buyList[msg.sender].hasCount = buyList[msg.sender].hasCount - _count;
        if (block.timestamp < packInfo.times1) {
            quantity = quantity + _count;
        }
        if (block.timestamp > packInfo.times2 && block.timestamp < packInfo.times3) {
            // in useTime
            (refundValue) = _refund(msg.sender, packInfo.price * _count);
            totalUsedCount = totalUsedCount + _count;
        } else if (block.timestamp > packInfo.times3) {
            // out useTime
            uint totalValue = packInfo.price * _count;
            uint value = _percentValue(totalValue, 100 - packInfo.noshowValue);
            (refundValue) = _refund(msg.sender, value);
        }
        emit requestRefundEvent(address(this), msg.sender, _count, refundValue);
    }

    function calculate() external onlyOwner onCalculateTime {
        require(isCalculated == 0, "CT03");
        uint quantityCount = packInfo.total - quantity - totalUsedCount;
        uint qunaityValue = _percentValue(packInfo.price, packInfo.noshowValue) * quantityCount;
        _transfer(packInfo.tokenType, owner, qunaityValue);
        isCalculated = 1;
        emit calculateEvent(address(this), owner, qunaityValue);
    }

    function changeTotal(uint32 _count) external payable onlyOwner {
        require(packInfo.total - quantity <= _count, "TC01");
        require(_count <= 1000, "C05");
        if (_count > packInfo.total) {
            checkFee(_count - packInfo.total);
            (, bytes memory result0) = address(iAddresses).staticcall(
                abi.encodeWithSignature("viewAddress(uint16)", 0)
            );
            _transfer(100, abi.decode(result0, (address)), msg.value);
            quantity = quantity + (_count - packInfo.total);
        } else {
            quantity = quantity - (packInfo.total - _count);
        }
        emit changeTotalEvent(address(this), packInfo.total, _count);
        packInfo.total = _count;
    }

    function viewInfo() external view returns (PackInfo memory) {
        return packInfo;
    }

    function viewUser(address _addr) external view returns (pack memory) {
        return buyList[_addr];
    }

    function viewQuantity() external view returns (uint256) {
        return quantity;
    }

    function viewOwner() external view returns (address) {
        return owner;
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }

    function viewTotalUsedCount() external view returns (uint32) {
        return totalUsedCount;
    }

    function _percentValue(uint value, uint8 percent) private view returns (uint) {
        (, bytes memory resultPercent) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", 1300)
        );
        address percentAddr = abi.decode(resultPercent, (address));
        (, bytes memory resultPercentValue) = address(percentAddr).staticcall(
            abi.encodeWithSignature("getValue(uint256,uint256)", value, percent)
        );
        return abi.decode(resultPercentValue, (uint));
    }

    function _buy(uint32 count, address buyer) private {
        buyList[buyer].hasCount = buyList[buyer].hasCount + (count);
        quantity = quantity - count;
    }

    function _refund(address _to, uint value) private returns (uint256) {
        uint refundValue = value;
        _transfer(packInfo.tokenType, _to, refundValue);
        return refundValue;
    }
}
