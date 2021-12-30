// SPDX-License-Identifier: MIT
pragma solidity >= 0.7.0;
pragma experimental ABIEncoderV2;

import "../Pack/TicketPack.sol";
import "../Pack/Pack.sol";
import "../Commander/Commander.sol";

contract TicketCreator is Ticket,Commander {
    event createTicketEvent( address indexed pack, uint256 createTime, PackInfo packInfo );  // 0: pack indexed, 1 : craeteTime , 2 : packInfo
    function createTicket(  PackInfo calldata _packInfo   ) external payable 
    {
        ( ,bytes memory result0 ) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",101));
        (address DFM) = abi.decode(result0,(address));
        _swap(msg.sender,msg.value,address(0),DFM);    
        TicketPack pers = new TicketPack( _packInfo, msg.sender );
        emit createTicketEvent(address( pers ), block.timestamp , _packInfo);
    }
}