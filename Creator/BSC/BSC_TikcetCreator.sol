// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.8.0;
pragma experimental ABIEncoderV2;

import '../../Pack/TicketPack.sol';
import '../../Commander/BSC/BSC_Commander.sol';

contract BSC_TicketCreator is Ticket, Commander {
    uint8 private swapCount;
    uint16[2] private tokenIdx = [550, 101];
    uint8 private nowSwap;

    event createTicketEvent(address indexed pack, uint256 createNum, PackInfo packInfo); // 0: pack indexed, 1 : craeteTime , 2 : packInfo
    event setSwapCountEvent(address indexed owner, uint8 beforeCnt, uint8 afterCnt);

    function createTicket(PackInfo calldata _packInfo, uint256 _createNum) external payable {
        require(_packInfo.total <= 1000, 'C05');
        _swap(101, msg.sender, msg.value);
        TicketPack pers = new TicketPack(_packInfo, msg.sender);
        emit createTicketEvent(address(pers), _createNum, _packInfo);
    }

    function setSwapCount(uint8 _swapCount) external payable onlyManager(msg.sender) {
        emit setSwapCountEvent(msg.sender, swapCount, _swapCount);
        swapCount = _swapCount;
    }

    function setTokenIdx(uint16[2] memory _tokenIdx) external payable onlyManager(msg.sender) {
        tokenIdx = _tokenIdx;
    }

    function viewSwapCount() external view returns (uint8) {
        return swapCount;
    }

    function viewTokenIdx() external view returns (uint16[2] memory) {
        return tokenIdx;
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
