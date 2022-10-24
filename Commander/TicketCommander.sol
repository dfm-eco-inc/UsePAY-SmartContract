// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import './Commander.sol';
import '../Storage/Pack.sol';
import '../Library/IERC20.sol';
import '../Library/Percentage.sol';
import 'hardhat/console.sol';

contract TicketCommander is Commander, Ticket {
    event BuyEvent(address indexed packAddress, uint256 txUniqueNumber, address buyer, uint256 buyQuantity);
    event UseEvent(address indexed packAddress, address userAddress, uint256 useQuantity);
    event CalculateEvent(address indexed, address owner, uint256 calculatedAmount);
    event RequestRefundEvent(
        address indexed packAddress,
        address buyer,
        uint256 quantity,
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

    modifier canUse(uint256 useQuantity) {
        require(
            buyList[msg.sender].hasCount - buyList[msg.sender].useCount >= useQuantity,
            'U02 - Not enough owned count'
        );
        _;
    }

    modifier canBuy(uint256 buyQuantity) {
        require(
            block.timestamp >= packInfo.times0 && block.timestamp <= packInfo.times1,
            'B01 - Not available time for buy'
        );

        require(quantity >= buyQuantity, 'B04 - Not enough quentity');

        require(
            buyList[msg.sender].hasCount + buyQuantity <= packInfo.maxCount,
            'B05 - Exceeding the available quantity'
        );
        _;
    }

    function buy(uint32 buyQuantity, uint256 txUniqueNumber) external payable canBuy(buyQuantity) {
        require(buyQuantity > 0, 'buyQuentity must be bigger than 0');

        uint256 price = packInfo.price * buyQuantity;

        if (packInfo.tokenType == ADR_NATIVE_TOKEN) {
            require(msg.value == price, 'B03 - Not enough value');
        } else {
            address tokenAddress = getAddress(packInfo.tokenType);
            require(tokenAddress != address(0), 'Token address is empty');

            IERC20 token = IERC20(tokenAddress);
            require(token.allowance(msg.sender, address(this)) >= price, 'B03 - Not enough value');

            token.transferFrom(msg.sender, address(this), price);
        }

        buyList[msg.sender].hasCount += buyQuantity;
        quantity -= buyQuantity;

        emit BuyEvent(address(this), txUniqueNumber, msg.sender, buyQuantity);
    }

    function give(address[] memory to) external canUse(to.length) {
        require(to.length != 0, 'The recipient is empty');

        buyList[msg.sender].hasCount -= uint32(to.length);

        for (uint256 i; i < to.length; i++) {
            require(buyList[to[i]].hasCount + 1 <= packInfo.maxCount, 'B05 - Exceeding the available quantity');
            buyList[to[i]].hasCount++;
        }

        emit GiveEvent(address(this), msg.sender, to);
    }

    function use(uint32 useQuantity) external canUse(useQuantity) {
        require(
            block.timestamp >= packInfo.times2 && block.timestamp <= packInfo.times3,
            'U01 - Not available time for use'
        );

        totalUsedCount += useQuantity;
        buyList[msg.sender].useCount += useQuantity;

        _transfer(packInfo.tokenType, owner, packInfo.price * useQuantity);

        emit UseEvent(address(this), msg.sender, useQuantity);
    }

    function requestRefund(uint32 refundQuantity)
        external
        canUse(refundQuantity)
        blockReEntry
        haltInEmergency
        requestLimit(1 minutes)
    {
        uint256 refundedAmount;
        uint256 swappedAmount;

        /// @dev before end of use can refund 100%
        if (block.timestamp <= packInfo.times3) {
            totalUsedCount += refundQuantity;
            (refundedAmount, swappedAmount) = refund(msg.sender, packInfo.price * refundQuantity, 0);
        } else {
            uint256 totalAmount = packInfo.price * refundQuantity;
            totalAmount = percentValue(totalAmount, 100 - packInfo.noshowValue);
            (refundedAmount, swappedAmount) = refund(msg.sender, totalAmount, 5);
        }

        buyList[msg.sender].hasCount -= refundQuantity;

        if (block.timestamp < packInfo.times1) {
            quantity += refundQuantity;
        }

        emit RequestRefundEvent(address(this), msg.sender, refundQuantity, refundedAmount, swappedAmount);
    }

    function calculate() external onlyOwner haltInEmergency onCalculateTime {
        require(!isCalculated, 'CT03 - Already calculated pack');

        uint256 quantityCount = packInfo.total - quantity - totalUsedCount;
        uint256 quantityValue = percentValue(packInfo.price, packInfo.noshowValue) * quantityCount;

        isCalculated = true;
        _transfer(packInfo.tokenType, owner, quantityValue);

        emit CalculateEvent(address(this), owner, quantityValue);
    }

    function changeTotal(uint32 newQuantity) external payable onlyOwner {
        require(packInfo.total - quantity <= newQuantity, 'TC01 - Less than the remaining quantity');
        require(newQuantity <= MAX_COUPON_QTY, 'C05 - Wrong total count');
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

    function viewUser(address _addr) external view returns (pack memory) {
        return buyList[_addr];
    }

    function viewQuantity() external view returns (uint256) {
        return quantity;
    }

    function viewOwner() external view returns (address) {
        return owner;
    }

    function viewVersion() external pure returns (uint8) {
        return ver;
    }

    function viewTotalUsedCount() external view returns (uint32) {
        return totalUsedCount;
    }

    function percentValue(uint256 value, uint8 percent) private view returns (uint256) {
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
        uint256 refundPercentValue;
        uint256 swapValue;
        uint256 refundFeeAmount;

        if (packInfo.tokenType == ADR_NATIVE_TOKEN) {
            refundAmount = percentValue(amount, (100 - percent));
            refundPercentValue = amount - refundAmount;
            if (refundPercentValue != 0) {
                swapValue = _swap(ADR_PAC_TOKEN, to, refundPercentValue);
            }
        } else {
            if (block.timestamp > packInfo.times3) {
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

        return (refundAmount, swapValue);
    }
}
