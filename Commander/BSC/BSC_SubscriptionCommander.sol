// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.8.0;
pragma experimental ABIEncoderV2;

import '../../Pack/SubscriptionPack.sol';
import './BSC_Commander.sol';

contract BSC_SubscriptionCommander is Subscription, Commander {
    event buyEvent(address indexed pack, uint256 buyNum, address buyer); // 0: pack indexed, 1: buyer, 2: count
    event requestRefundEvent(address indexed pack, address buyer, uint256 num, uint256 money, uint256 swap); // 0: pack indexed, 1: buyer, 2: count
    event noshowRefundEvent(address indexed pack);
    event noshowRefundUser(address indexed pack, address[] buyers, uint256[] value, uint256[] swap);
    event calculateEvent(address indexed pack, address owner, uint256 value);
    event changeTotalEvent(address indexed, uint256 _before, uint256 _after);

    modifier onlyOwner() {
        require(msg.sender == owner, 'O01');
        _;
    }
    modifier onCalculateTime() {
        require(block.timestamp > packInfo.times3, 'CT01');
        _;
    }
    modifier canBuy() {
        require(buyList[msg.sender].hasCount == 0, 'B00');
        require(block.timestamp >= packInfo.times0 && block.timestamp <= packInfo.times1, 'B01');
        require(quantity > 0, 'B04');
        if (packInfo.tokenType == 100) {
            require(msg.value == packInfo.price, 'B03');
        } else {
            (, bytes memory tokenResult) = address(iAddresses).staticcall(abi.encodeWithSignature('viewAddress(uint16)', uint16(packInfo.tokenType)));
            (bool success, ) = address(abi.decode(tokenResult, (address))).call(abi.encodeWithSignature('transferFrom(address,address,uint256)', msg.sender, address(this), packInfo.price));
            require(success, 'T01');
        }
        _;
    }
    modifier canUse() {
        require(buyList[msg.sender].hasCount > 0, 'U02');
        _;
    }
    modifier checkLive() {
        require(isLive == 0, 'N01');
        _;
    }

    function _percentValue(uint value, uint8 percent) private view returns (uint) {
        (, bytes memory resultPercent) = address(iAddresses).staticcall(abi.encodeWithSignature('viewAddress(uint16)', 1300));
        address percentAddr = abi.decode(resultPercent, (address));
        (, bytes memory resultPercentValue) = address(percentAddr).staticcall(abi.encodeWithSignature('getValue(uint256,uint256)', value, percent));
        return abi.decode(resultPercentValue, (uint));
    }

    function _buy(address buyer) private {
        buyList[buyer].hasCount = buyList[buyer].hasCount + 1;
        quantity = quantity - 1;
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
            // TOKEN == BSC
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
            swapValue = _swap(101, _to, refundPercentValue);
        }
        if (feeValue != 0) {
            (, bytes memory result0) = address(iAddresses).staticcall(abi.encodeWithSignature('viewAddress(uint16)', 0));
            _transfer(packInfo.tokenType, abi.decode(result0, (address)), feeValue);
        }
        return (refundValue, swapValue);
    }

    function buy(uint256 buyNum) external payable canBuy checkLive {
        _buy(msg.sender);
        emit buyEvent(address(this), buyNum, msg.sender);
    }

    function give(address[] memory toAddr) external canUse checkLive {
        buyList[msg.sender].hasCount = buyList[msg.sender].hasCount - uint32(toAddr.length);
        for (uint i = 0; i < toAddr.length; i++) {
            buyList[toAddr[i]].hasCount++;
        }
        emit giftEvent(address(this), msg.sender, toAddr);
    }

    function requestRefund() external canUse blockReEntry {
        uint refundValue = 0;
        if (isLive == 0) {
            if (block.timestamp < packInfo.times2) {
                quantity++;
                refundValue = packInfo.price;
            } else if (block.timestamp > packInfo.times2 && block.timestamp < packInfo.times2 + 172800) {
                if (noshowLimit == 0) {
                    noshowLimit = _percentValue(packInfo.total - quantity, 60);
                }
                noshowCount++;
                if (noshowCount >= noshowLimit) {
                    isLive = 1;
                    noShowTime = block.timestamp;
                }

                refundValue = packInfo.price;
            } else if (block.timestamp > packInfo.times2 + 172800) {
                uint period = packInfo.times3 - packInfo.times2;
                uint refundPeriod = packInfo.times3 - block.timestamp;
                (, bytes memory result) = address(iAddresses).staticcall(abi.encodeWithSignature('viewAddress(uint16)', 1300));
                (, bytes memory resultPercent) = address(abi.decode(result, (address))).staticcall(abi.encodeWithSignature('getPercent(uint256,uint256)', period, refundPeriod));
                uint8 percent = abi.decode(resultPercent, (uint8));

                refundValue = _percentValue(packInfo.price, percent);
            }
        } else {
            require(block.timestamp <= noShowTime + 15552000, 'N04');
            refundValue = packInfo.price;
        }
        buyList[msg.sender].hasCount--;
        (uint value, uint swap) = _refund(msg.sender, refundValue, 0);
        emit requestRefundEvent(address(this), msg.sender, 1, value, swap);
    }

    function calculate() external onCalculateTime checkLive {
        uint256 a = 2592000;
        uint256 balance = 0;
        if (block.timestamp > packInfo.times3 + a) {
            checkManager(msg.sender);
            (, bytes memory result) = address(iAddresses).staticcall(abi.encodeWithSignature('viewAddress(uint16)', uint16(packInfo.tokenType)));
            if (packInfo.tokenType == 100) {
                balance = address(this).balance;
                _refund(owner, balance, 10);
            } else {
                (, bytes memory result1) = address(abi.decode(result, (address))).staticcall(abi.encodeWithSignature('balanceOf(address)', address(this)));
                balance = abi.decode(result1, (uint256));
                uint ownerValue = _percentValue(balance, 98);
                _transfer(packInfo.tokenType, owner, ownerValue);
                _transfer(packInfo.tokenType, msg.sender, balance - ownerValue);
            }
        } else {
            require(msg.sender == owner, 'you are not owner');
            if (packInfo.tokenType == 100) {
                balance = address(this).balance;
            } else {
                (, bytes memory tokenResult) = address(iAddresses).staticcall(abi.encodeWithSignature('viewAddress(uint16)', uint16(packInfo.tokenType)));
                (, bytes memory result) = address(abi.decode(tokenResult, (address))).staticcall(abi.encodeWithSignature('balanceOf(address)', address(this)));
                balance = abi.decode(result, (uint256));
            }
            _transfer(packInfo.tokenType, owner, balance);
        }
        emit calculateEvent(address(this), owner, balance);
    }

    function noShowRefund(address[] calldata _addrList) external onlyManager(msg.sender) {
        require(isLive == 1, 'N02');
        require(block.timestamp > noShowTime + 15552000, 'N03');
        uint256[] memory values = new uint256[](_addrList.length);
        uint256[] memory swaps = new uint256[](_addrList.length);
        uint refundValue = _percentValue(packInfo.price, 95);
        for (uint i = 0; i < _addrList.length; i++) {
            address _to = _addrList[i];
            buyList[_to].hasCount--;
            (values[i], swaps[i]) = _refund(_to, refundValue, 10);
        }
        emit noshowRefundUser(address(this), _addrList, values, swaps);
        uint balance = _getBalance(packInfo.tokenType);
        _transfer(packInfo.tokenType, msg.sender, balance);
        emit noshowRefundEvent(address(this));
    }

    function changeTotal(uint32 _count) external payable onlyOwner {
        require(packInfo.total - quantity <= _count, 'TC01');
        require(_count <= 1000, 'C05');

        if (_count > packInfo.total) {
            checkFee(_count - packInfo.total);
            _swap(101, msg.sender, msg.value);
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

    function viewOwner() external view returns (address) {
        return owner;
    }

    function viewQuantity() external view returns (uint256) {
        return quantity;
    }

    function viewIsLive() external view returns (uint256) {
        return isLive;
    }

    function viewUser(address userAddr) external view returns (pack memory) {
        return buyList[userAddr];
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }

    function viewNoshowTime() external view returns (uint) {
        return noShowTime;
    }
}
