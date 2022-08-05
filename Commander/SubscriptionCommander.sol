// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.8.0;

import "../Pack/SubscriptionPack.sol";
import "./Commander.sol";

contract SubscriptionCommander is Subscription, Commander {
    event calculateEvent(address indexed pack, address owner, uint256 value);
    event changeTotalEvent(address indexed, uint256 _before, uint256 _after);
    event buyEvent(address indexed pack, uint256 buyNum, address buyer); // 0: pack indexed, 1: buyer, 2: count
    event disabledPackRefundEvent(address indexed pack);
    event requestRefundEvent(
        address indexed pack,
        address buyer,
        uint256 num,
        uint256 money,
        uint256 swap
    ); // 0: pack indexed, 1: buyer, 2: count
    event disabledPackRefundUser(
        address indexed pack,
        address[] buyers,
        uint256[] value,
        uint256[] swap
    );

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

    modifier checkLive() {
        require(!disabledPack, "N01 - Disabled pack");
        _;
    }

    function buy(uint256 buyNum) external payable canBuy checkLive {
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

    function give(address[] memory toAddr) external canUse checkLive {
        buyList[msg.sender].hasCount = buyList[msg.sender].hasCount - uint32(toAddr.length);

        for (uint i = 0; i < toAddr.length; i++) {
            buyList[toAddr[i]].hasCount++;
        }

        emit giveEvent(address(this), msg.sender, toAddr);
    }

    function requestRefund() external canUse blockReEntry haltInEmergency requestLimit(1 minutes) {
        uint refundValue = 0;

        if (!disabledPack) {
            if (block.timestamp < packInfo.times2) {
                quantity++;
                refundValue = packInfo.price;
            } else if (
                block.timestamp > packInfo.times2 && block.timestamp < packInfo.times2 + 172800
            ) {
                if (refundCountForDisable >= _percentValue(packInfo.total - quantity, 60)) {
                    disabledPack = true;
                    disabledTime = uint32(block.timestamp);
                }

                refundCountForDisable++;
                refundValue = packInfo.price;
            } else if (block.timestamp > packInfo.times2 + 172800) {
                (bool success, bytes memory resultPercent) = getAddress(1300).staticcall(
                    abi.encodeWithSignature(
                        "getTimePercent(uint256,uint256)",
                        packInfo.times3 - packInfo.times2,
                        packInfo.times3 - block.timestamp
                    )
                );

                require(success, "Get time percent failed");

                uint8 percent = abi.decode(resultPercent, (uint8));
                refundValue = _percentValue(packInfo.price, percent);
            }
        } else {
            require(
                block.timestamp <= disabledTime + 15552000,
                "N04 - Not available time for refund"
            );

            refundValue = packInfo.price;
        }

        buyList[msg.sender].hasCount--;
        (uint value, uint swap) = _refund(msg.sender, refundValue, 0);

        emit requestRefundEvent(address(this), msg.sender, 1, value, swap);
    }

    function calculate() external onCalculateTime checkLive {
        uint256 balance = 0;

        if (block.timestamp > packInfo.times3 + 2592000) {
            checkManager(msg.sender);

            if (packInfo.tokenType == 100) {
                balance = address(this).balance;
                _refund(owner, balance, 10);
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

    function disabledPackRefund(address[] calldata _addrList) external onlyManager(msg.sender) {
        require(disabledPack, "N02 - Not disabled pack");
        require(block.timestamp > disabledTime + 15552000, "N03 - Not available time for refund");

        uint256[] memory values = new uint256[](_addrList.length);
        uint256[] memory swaps = new uint256[](_addrList.length);
        uint refundValue = _percentValue(packInfo.price, 95);

        for (uint i = 0; i < _addrList.length; i++) {
            address _to = _addrList[i];
            buyList[_to].hasCount--;
            (values[i], swaps[i]) = _refund(_to, refundValue, 10);
        }

        emit disabledPackRefundUser(address(this), _addrList, values, swaps);

        uint balance = _getBalance(packInfo.tokenType);
        _transfer(packInfo.tokenType, msg.sender, balance);

        emit disabledPackRefundEvent(address(this));
    }

    function changeTotal(uint32 count) external payable onlyOwner {
        require(packInfo.total - quantity <= count, "TC01 - Less than the remaining quantity");
        require(count <= 1000, "C05 - Limit count over");

        if (count > packInfo.total) {
            checkFee(count - packInfo.total);
            _swap(msg.sender, msg.value);
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

    function viewIsDisabled() external view returns (bool) {
        return disabledPack;
    }

    function viewUser(address userAddr) external view returns (pack memory) {
        return buyList[userAddr];
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }

    function viewNoshowTime() external view returns (uint) {
        return disabledTime;
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

    function _refund(
        address _to,
        uint value,
        uint8 percent
    ) private returns (uint256, uint256) {
        uint refundValue = 0;
        uint refundPercentValue = 0;
        uint swapValue = 0;
        uint feeValue = 0;

        if (packInfo.tokenType == 100) {
            refundValue = _percentValue(value, 100 - percent);
            refundPercentValue = value - refundValue;
        } else {
            if (percent != 0) {
                refundValue = _percentValue(value, 98);
                feeValue = value - refundValue;
            } else {
                refundValue = value;
            }
        }

        if (refundValue != 0) {
            _transfer(packInfo.tokenType, _to, refundValue);
        }

        if (refundPercentValue != 0) {
            swapValue = _swap(_to, refundPercentValue);
        }

        if (feeValue != 0) {
            _transfer(packInfo.tokenType, getAddress(0), feeValue);
        }

        return (refundValue, swapValue);
    }
}
