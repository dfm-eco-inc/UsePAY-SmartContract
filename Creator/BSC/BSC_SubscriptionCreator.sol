// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >= 0.8.0;
pragma experimental ABIEncoderV2;

import "../../Pack/SubscriptionPack.sol";
import "../../Commander/BSC/BSC_Commander.sol";

contract BSC_SubscriptionCreator is Subscription, Commander {
    uint8 private swapCount;
    uint16[2] private tokenIdx = [101,550];
    uint8 private nowSwap;
    event createSubscriptionEvent( address indexed pack, uint256 createNum, PackInfo packInfo );  // 0: pack indexed, 1 : craeteTime , 2 : packInfo
    event setSwapCountEvent( address indexed owner, uint8 beforeCnt, uint8 afterCnt);
    function createSubscription( PackInfo calldata _packInfo , uint256 _createNum ) external payable 
    {
        require(_packInfo.total <= 1000 ,"C05");
        uint8 i = 0;
        if(swapCount>0) {
            nowSwap++;
            if(swapCount == nowSwap) {
                nowSwap = 0;
                i = 1;
            }
        }
        _swap(tokenIdx[i],msg.sender,msg.value);
        SubscriptionPack pers = new SubscriptionPack( _packInfo, msg.sender );
        emit createSubscriptionEvent( address(pers), _createNum , _packInfo );
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