// SPDX-License-Identifier: MIT
pragma solidity = 0.8.0;

contract Addresses {
    
    // 0 : ticketCommander
    // 1: couponCommander
    // 2: subscriptionCommander ...
    // 100 : ETH ( 0x000...)
    // 101 : DFM
    // 102 : USDT
    // 103 : GUSD ...
    // 199 : WETH
    // 200 : manager0
    // 201 : manager1
    // 202 : manager2 ...
    // 301 : safeAddress
    // 400 : uniswapRouter
    // 401: uniswapFactory
    // 500 : Percentage
    // 600 : Bridge

    mapping(uint16=>address) addresses;
    
    //-----------------------------------------
    //  modifiers
    //-----------------------------------------
    modifier onlyManager() { require( checkManger(msg.sender) , "This address is not manager" ); _; }
    
    //-----------------------------------------
    //  pureFunctions
    //-----------------------------------------
    function checkManger(address _addr) public view returns ( bool ) {
        if ( addresses[0] == _addr ) {
            return true;
        }        
        return false;
    }
    
    constructor() {
        addresses[0] = msg.sender;
        addresses[100] = 0x0000000000000000000000000000000000000000;
        addresses[101] = 0x6Ab29d1cB15d6FEa255E6e02cE61D635015E7c77;
    }
    
    function setAddress(uint16 _index,address _addr) external payable onlyManager {
        addresses[_index] = _addr;
    }

    function setAddresses(uint16[] memory _index, address[] memory _addr) external payable onlyManager {
        require(_index.length == _addr.length,"not same _index,_addr length");
        for ( uint16 i =0; i<_index.length; i++) {
            addresses[_index[i]] = _addr[i];
        }
    }
    
    function viewAddress(uint16 _index) external view returns (address) {
        return addresses[_index];
    }
}