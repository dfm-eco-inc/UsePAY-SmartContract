// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import "../../Pack/TicketPack.sol";
import "../../Commander/KLAYTN/KLA_Commander.sol";

contract KLA_TicketCreator is Ticket, KLA_Commander {
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

        _transfer(100, getAddress(0), msg.value);
        TicketPack pers = new TicketPack(_packInfo, msg.sender);

        emit CreateTicketEvent(address(pers), _createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
