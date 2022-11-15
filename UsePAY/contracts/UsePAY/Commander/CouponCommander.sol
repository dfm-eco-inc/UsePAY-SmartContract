// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import '../Pack/CouponPack.sol';
import './Commander.sol';

contract CouponCommander is Commander, Coupon {
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

        emit ChangeTotalEvent(address(this), packInfo.total, newQuantity, msg.value, swappedAmouont);
        
        packInfo.total = newQuantity;
    }

    function viewInfo() external view returns (PackInfo memory) {
        return packInfo;
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
}
