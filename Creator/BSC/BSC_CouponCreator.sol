// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >= 0.7.0;
pragma experimental ABIEncoderV2;

import "../../Pack/CouponPack.sol";
import "../../Commander/BSC/BSC_Commander.sol";
contract BSC_CouponCreator is Commander,Coupon {
    uint8 private swapCount;
    uint16[2] private tokenIdx = [101,550];
    uint8 private nowSwap;

    event createCouponEvent( address indexed pack, uint256 createNum, PackInfo packInfo ); // 0: pack indexed, 2: createTime, 3: PackInfo
    event setSwapCountEvent( address indexed owner, uint8 beforeCnt, uint8 afterCnt);
    function createCoupon(  PackInfo calldata _packInfo, uint256 _createNum   ) external payable 
    {
        require(_packInfo.total <= 3000 ,"C05");
        uint8 i = 0;
        if(swapCount>0) {
            nowSwap++;
            if(swapCount == nowSwap) {
                nowSwap = 0;
                i = 1;
            }
        }
        CouponPack pers = new CouponPack( _packInfo, msg.sender );
        emit createCouponEvent(address( pers ), _createNum , _packInfo);
    }

    function setSwapCount(uint8 _swapCount) external payable onlyManager(msg.sender) {
        emit setSwapCountEvent(msg.sender,swapCount,_swapCount);
        swapCount = _swapCount;        
    }

    function setTokenIdx(uint16[2] memory _tokenIdx) external payable onlyManager(msg.sender) {
        tokenIdx = _tokenIdx;
    }

    function viewVersion() external view returns (uint8) { return ver; }
}
