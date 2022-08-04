// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.8.0;

import "../Pack/TicketPack.sol";
import "../Commander/Commander.sol";

contract TicketCreator is Ticket, Commander {
    event createTicketEvent(address indexed pack, uint256 createNum, PackInfo packInfo); // 0: pack indexed, 1 : reference value , 2 : packInfo

    function createTicket(PackInfo calldata _packInfo, uint256 _createNum) external payable {
        require(_packInfo.total <= 1000, "C05 - Limit count over");
        checkFee(packInfo.total);
        _swap(msg.sender, msg.value);
        TicketPack pers = new TicketPack(_packInfo, msg.sender);
        emit createTicketEvent(address(pers), _createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
