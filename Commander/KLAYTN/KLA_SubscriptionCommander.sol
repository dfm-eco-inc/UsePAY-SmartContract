// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import "../../Pack/SubscriptionPack.sol";
import "./KLA_Commander.sol";

contract KLA_SubscriptionCommander is Subscription, KLA_Commander {
    event buyEvent(address indexed pack, uint256 buyNum, address buyer); // 0: pack indexed, 1: buyer, 2: count
    event requestRefundEvent(address indexed pack, address buyer, uint256 num, uint256 money); // 0: pack indexed, 1: buyer, 2: count
    event calculateEvent(address indexed pack, address owner, uint256 value);
    event changeTotalEvent(address indexed, uint256 _before, uint256 _after);

    modifier onlyOwner() {
        require(msg.sender == owner, "O01 - Only for issuer");
        _;
    }

    modifier onCalculateTime() {
        require(block.timestamp > packInfo.times3, "CT01 - Not available time for calculate");
        _;
    }

    modifier canBuy() {
        require(buyList[msg.sender].hasCount == 0, "B00 - Already bought pack");
        require(
            block.timestamp >= packInfo.times0 && block.timestamp <= packInfo.times1,
            "B01 - Not available time for buy"
        );
        require(quantity > 0, "B04 - Not enough quentity");
        _;
    }

    modifier canUse() {
        require(buyList[msg.sender].hasCount > 0, "U02 - Not enough owned count");
        _;
    }

    function buy(uint256 buyNum) external payable canBuy {
        if (packInfo.tokenType == 100) {
            require(msg.value == packInfo.price, "B03 - Not enough value");
        } else {
            (bool success, ) = getAddress(packInfo.tokenType).call(
                abi.encodeWithSignature(
                    "transferFrom(address,address,uint256)",
                    msg.sender,
                    address(this),
                    packInfo.price
                )
            );

            require(success, "T01 - Token transfer failed");
        }

        _buy(msg.sender);

        emit buyEvent(address(this), buyNum, msg.sender);
    }

    function give(address[] memory toAddr) external canUse {
        buyList[msg.sender].hasCount = buyList[msg.sender].hasCount - uint32(toAddr.length);

        for (uint i; i < toAddr.length; i++) {
            buyList[toAddr[i]].hasCount++;
        }

        emit giveEvent(address(this), msg.sender, toAddr);
    }

    function requestRefund() external canUse blockReEntry haltInEmergency requestLimit(1 minutes) {
        uint refundValue;

        if (block.timestamp < packInfo.times2) {
            quantity++;
            refundValue = packInfo.price;
        } else {
            (bool success, bytes memory percentBytes) = getAddress(1300).staticcall(
                abi.encodeWithSignature(
                    "getTimePercent(uint256,uint256)",
                    packInfo.times3 - packInfo.times2,
                    packInfo.times3 - block.timestamp
                )
            );

            require(success, "Get time percent failed");

            refundValue = _percentValue(packInfo.price, abi.decode(percentBytes, (uint8)));
        }

        buyList[msg.sender].hasCount--;
        _refund(msg.sender, refundValue);

        emit requestRefundEvent(address(this), msg.sender, 1, refundValue);
    }

    function calculate() external onCalculateTime {
        uint256 balance;

        if (block.timestamp > packInfo.times3 + 2592000) {
            checkManager(msg.sender);

            if (packInfo.tokenType == 100) {
                balance = address(this).balance;
                _refund(owner, balance);
            } else {
                balance = getBalance(getAddress(packInfo.tokenType));
                uint ownerValue = _percentValue(balance, 98);

                _transfer(packInfo.tokenType, owner, ownerValue);
                _transfer(packInfo.tokenType, msg.sender, balance - ownerValue);
            }
        } else {
            require(msg.sender == owner, "you are not owner");

            if (packInfo.tokenType == 100) {
                balance = address(this).balance;
            } else {
                balance = getBalance(getAddress(packInfo.tokenType));
            }

            _transfer(packInfo.tokenType, owner, balance);
        }

        emit calculateEvent(address(this), owner, balance);
    }

    function changeTotal(uint32 count) external payable onlyOwner {
        require(packInfo.total - quantity <= count, "TC01 - Less than the remaining quantity");
        require(count <= 1000, "C05 - Limit count over");

        if (count > packInfo.total) {
            checkFee(count - packInfo.total);
            _transfer(100, getAddress(0), msg.value);
        }

        quantity = quantity - (packInfo.total - count);
        packInfo.total = count;

        emit changeTotalEvent(address(this), packInfo.total, count);
    }

    function viewInfo() external view returns (PackInfo memory) {
        return packInfo;
    }

    function viewOwner() external view returns (address) {
        return owner;
    }

    function viewQuantity() external view returns (uint256) {
        return quantity;
    }

    function viewUser(address userAddr) external view returns (pack memory) {
        return buyList[userAddr];
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }

    function _percentValue(uint value, uint8 percent) private view returns (uint) {
        (bool success, bytes memory resultPercentValue) = getAddress(1300).staticcall(
            abi.encodeWithSignature("getPercentValue(uint256,uint256)", value, percent)
        );

        require(success, "Getting a value of the percent is failed");

        return abi.decode(resultPercentValue, (uint));
    }

    function _buy(address buyer) private {
        buyList[buyer].hasCount++;
        quantity--;
    }

    function _refund(address _to, uint value) private returns (uint256) {
        uint refundValue = value;

        _transfer(packInfo.tokenType, _to, refundValue);

        return refundValue;
    }
}
