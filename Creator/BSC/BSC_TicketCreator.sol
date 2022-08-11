// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import "../../Pack/TicketPack.sol";
import "../../Commander/BSC/BSC_Commander.sol";

contract BSC_TicketCreator is Ticket, Commander {
    event CreateTicketEvent(address indexed pack, uint256 createNum, PackInfo packInfo);

    function createTicket(PackInfo calldata _packInfo, uint256 _createNum) external payable {
        require(_packInfo.total <= 1000, "C05 - Limit count over");
        require(
            _packInfo.times0 < _packInfo.times1 &&
                _packInfo.times1 < _packInfo.times3 &&
                _packInfo.times0 < _packInfo.times2 &&
                _packInfo.times2 < _packInfo.times3,
            "Invalid timing structure"
        );

        checkFee(packInfo.total);

        _swap(101, msg.sender, msg.value);
        TicketPack pers = new TicketPack(_packInfo, msg.sender);

        emit CreateTicketEvent(address(pers), _createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
