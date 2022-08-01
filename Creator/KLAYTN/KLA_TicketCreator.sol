// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "../../Pack/TicketPack.sol";
import "../../Commander/KLAYTN/KLA_Commander.sol";

contract KLA_TicketCreator is Ticket, KLA_Commander {
    event createTicketEvent(address indexed pack, uint256 createNum, PackInfo packInfo); // 0: pack indexed, 1 : craeteTime , 2 : packInfo

    function createTicket(PackInfo calldata _packInfo, uint256 _createNum) external payable {
        require(_packInfo.total <= 1000, "C05");
        (, bytes memory result0) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", 0)
        );
        _transfer(100, abi.decode(result0, (address)), msg.value);
        TicketPack pers = new TicketPack(_packInfo, msg.sender);
        emit createTicketEvent(address(pers), _createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
