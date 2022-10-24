// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import '../Pack/SubscriptionPack.sol';
import './Commander.sol';
import '../Library/Percentage.sol';

contract SubscriptionCommander is Commander, Subscription {
    struct MultiSign {
        uint256 count;
        uint256 unlockTimestamp;
        address[] confirmers;
    }

    uint256 private immutable unlockSeconds;
    uint256 private immutable numConfirmationsRequired;
    MultiSign private multiSign;

    event LaunchCalculateEvent(
        address starterAddress,
        address indexed packAddress,
        address owner,
        uint256 balance,
        uint256 calculatedAmount,
        uint256 swappedAmount,
        uint256 feeAmount
    );
    event StartCalculateEvent(address starterAddress);
    event CancelCalculateEvent(address cancelerAddress);
    event ConfirmCalculateEvent(address confirmerAddress);
    event CalculateEvent(address indexed packAddress, address owner, uint256 calculatedAmount);
    event BuyEvent(address indexed packAddress, address buyer);
    event RequestRefundEvent(
        address indexed packAddress,
        address buyer,
        uint256 refundedAmount,
        uint256 swappedTokenAmount
    );
    event ChangeTotalEvent(
        address indexed,
        uint256 previousTotal,
        uint256 changedTotal,
        uint256 feePrice,
        uint swappedAmount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, 'O01 - Only for issuer');
        _;
    }

    modifier onCalculateTime() {
        require(block.timestamp > packInfo.times3, 'CT01 - Not available time for calculate');
        _;
    }

    modifier canBuy() {
        require(buyList[msg.sender].hasCount == 0, 'B00 - Already bought pack');
        require(
            block.timestamp >= packInfo.times0 && block.timestamp <= packInfo.times1,
            'B01 - Not available time for buy'
        );
        require(quantity > 0, 'B04 - Not enough quentity');
        _;
    }

    modifier canUse() {
        require(buyList[msg.sender].hasCount > 0, 'U02 - Not enough owned count');
        _;
    }

    constructor() {
        numConfirmationsRequired = viewNumOfConfirmation();
        unlockSeconds = viewUnlockSeconds();
    }

    function buy() external payable canBuy {
        if (packInfo.tokenType == ADR_NATIVE_TOKEN) {
            require(msg.value == packInfo.price, 'B03 - Not enough value');
        } else {
            address tokenAddress = getAddress(packInfo.tokenType);
            require(tokenAddress != address(0), 'Token address is empty');

            IERC20 token = IERC20(tokenAddress);
            require(token.allowance(msg.sender, address(this)) >= packInfo.price, 'B03 - Not enough value');

            token.transferFrom(msg.sender, address(this), packInfo.price);
        }

        buyList[msg.sender].hasCount = 1;
        quantity--;

        emit BuyEvent(address(this), msg.sender);
    }

    function give(address[] memory to) external canUse {
        require(to.length == 1, 'Subscription packs can only be sent to one person');

        buyList[msg.sender].hasCount = 0;
        buyList[to[0]].hasCount = 1;

        emit GiveEvent(address(this), msg.sender, to);
    }

    function requestRefund() external canUse blockReEntry haltInEmergency requestLimit(1 minutes) {
        require(block.timestamp < packInfo.times3, 'N04 - Not available time for refund');

        uint256 refundAmount;

        if (block.timestamp < packInfo.times2 + 2 days) {
            quantity++;
            refundAmount = packInfo.price;
        } else {
            uint256 percent = getTimePercent(packInfo.times3 - packInfo.times2, packInfo.times3 - block.timestamp);
            refundAmount = percentValue(packInfo.price, percent);
        }

        buyList[msg.sender].hasCount = 0;
        (uint256 refunded, uint256 swapped) = refund(msg.sender, refundAmount, 0);

        emit RequestRefundEvent(address(this), msg.sender, refunded, swapped);
    }

    function startCalculate() external haltInEmergency onlyManager(msg.sender) {
        require(packInfo.times3 + 30 days < block.timestamp, 'Only available after 30 days from times3');
        require(multiSign.count == 0, 'Already in progress');

        if (multiSign.confirmers.length == 0) {
            multiSign.confirmers = new address[](numConfirmationsRequired);
        }

        multiSign.confirmers[0] = msg.sender;
        multiSign.count = 1;

        emit StartCalculateEvent(msg.sender);
    }

    function cancelCalculate() external haltInEmergency onlyManager(msg.sender) {
        require(multiSign.count > 0, 'Can not cancel confirmation');

        bool success;

        for (uint16 i; i < multiSign.confirmers.length; i++) {
            if (multiSign.confirmers[i] == msg.sender) {
                multiSign.confirmers[i] = address(0);
                multiSign.count--;
                success = true;
                break;
            }
        }

        require(success, "You've not confirmed");

        emit CancelCalculateEvent(msg.sender);
    }

    function confirmCalculate() external haltInEmergency onlyManager(msg.sender) {
        require(multiSign.count > 0 && multiSign.count < numConfirmationsRequired, 'Do not need confirmation');

        for (uint256 i; i < multiSign.confirmers.length; i++) {
            require(multiSign.confirmers[i] != msg.sender, 'Already confirmed');
        }

        for (uint256 i; i < multiSign.confirmers.length; i++) {
            if (multiSign.confirmers[i] == address(0)) {
                multiSign.confirmers[i] = msg.sender;
                multiSign.count++;
                break;
            }
        }

        if (multiSign.count >= numConfirmationsRequired) {
            multiSign.unlockTimestamp = uint32(block.timestamp + unlockSeconds);
        }

        emit ConfirmCalculateEvent(msg.sender);
    }

    function launchCalculate() external haltInEmergency onlyManager(msg.sender) {
        require(multiSign.count == numConfirmationsRequired, 'Needed all confirmation');
        require(block.timestamp >= multiSign.unlockTimestamp, 'Execution time is not reached');

        uint256 balance;
        uint256 calculatedAmount;
        uint256 swappedAmount;
        uint256 feeAmount;

        if (packInfo.tokenType == ADR_NATIVE_TOKEN) {
            balance = address(this).balance;
            (calculatedAmount, swappedAmount) = refund(owner, balance, 10);
        } else {
            balance = _getBalance(getAddress(packInfo.tokenType));
            calculatedAmount = percentValue(balance, 98);
            feeAmount = balance - calculatedAmount;

            _transfer(packInfo.tokenType, owner, calculatedAmount);
            _transfer(packInfo.tokenType, msg.sender, feeAmount);
        }

        multiSign.count = 0;
        multiSign.unlockTimestamp = 0;

        for (uint16 i; i < multiSign.confirmers.length; i++) {
            multiSign.confirmers[i] = address(0);
        }

        emit LaunchCalculateEvent(
            msg.sender,
            address(this),
            owner,
            balance,
            calculatedAmount,
            swappedAmount,
            feeAmount
        );
    }

    function calculate() external onlyOwner haltInEmergency onCalculateTime {
        require(packInfo.times3 + 30 days >= block.timestamp, 'Only available within 30 days after times3');

        uint256 balance;

        if (packInfo.tokenType == ADR_NATIVE_TOKEN) {
            balance = address(this).balance;
        } else {
            balance = _getBalance(getAddress(packInfo.tokenType));
        }

        require(balance > 0, 'CT03 - Already calculated pack');
        _transfer(packInfo.tokenType, owner, balance);

        emit CalculateEvent(address(this), owner, balance);
    }

    function changeTotal(uint32 newQuantity) external payable onlyOwner {
        require(packInfo.total - quantity <= newQuantity, 'TC01 - Less than the remaining quantity');
        require(newQuantity <= MAX_SUBSCRIPTION_QTY, 'C05 - Wrong total count');
        uint swappedAmouont;

        if (newQuantity > packInfo.total) {
            checkFee(newQuantity - packInfo.total);
            swappedAmouont = _swap(ADR_PAC_TOKEN, msg.sender, msg.value);
            quantity += newQuantity - packInfo.total;
        } else {
            quantity -= packInfo.total - newQuantity;
        }

        packInfo.total = newQuantity;

        emit ChangeTotalEvent(address(this), packInfo.total, newQuantity, msg.value, swappedAmouont);
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

    function viewVersion() external pure returns (uint8) {
        return ver;
    }

    function getTimePercent(uint256 totalTime, uint256 passedTime) private view returns (uint256) {
        address target = getAddress(ADR_PERCENTAGE);
        require(target != address(0), 'Percentage is not available');

        Percentage per = Percentage(target);
        return per.getTimePercent(totalTime, passedTime);
    }

    function percentValue(uint256 value, uint256 percent) private view returns (uint256) {
        address target = getAddress(ADR_PERCENTAGE);
        require(target != address(0), 'Percentage is not available');

        Percentage per = Percentage(target);
        return per.getPercentValue(value, percent);
    }

    function refund(
        address to,
        uint256 amount,
        uint8 percent
    ) private returns (uint256, uint256) {
        uint256 refundAmount;
        uint256 refundSwapAmount;
        uint256 swappedAmount;
        uint256 refundFeeAmount;

        if (packInfo.tokenType == ADR_NATIVE_TOKEN) {
            refundAmount = percentValue(amount, 100 - percent);
            refundSwapAmount = amount - refundAmount;

            if (refundSwapAmount != 0) {
                swappedAmount = _swap(ADR_PAC_TOKEN, to, refundSwapAmount);
            }
        } else {
            if (percent != 0) {
                refundAmount = percentValue(amount, 98);
                refundFeeAmount = amount - refundAmount;

                if (refundFeeAmount != 0) {
                    _transfer(packInfo.tokenType, getAddress(ADR_CREATOR), refundFeeAmount);
                }
            } else {
                refundAmount = amount;
            }
        }

        if (refundAmount != 0) {
            _transfer(packInfo.tokenType, to, refundAmount);
        }

        return (refundAmount, swappedAmount);
    }
}
