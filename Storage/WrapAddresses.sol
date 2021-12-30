// SPDX-License-Identifier: MIT
pragma solidity >= 0.7.0;

contract WrapAddresses {
    // address internal iAddresses = 0x4E3C648dF58f2Da711f5B34B7eBD3F2A1f888a0A; //eth_rinkeby_before
    address internal iAddresses = 0x91585D7c04A8aF54bd5c5f518Af53025C6FD4025; // eth_rinkeby_after
    // address internal iAddresses = 0x48aa9c47897B50dBF8B7dc3A1bFa4b05C481EB3d; //eth_mainnet
    // address internal iAddresses = 0x5dA0e1a95e6F85b3DA11C1350B2A82F40f5b2E0f; //bsc_testnet_before
    // address internal iAddresses = 0xcF25A14dF61Fdf8aE268cD4E172Cff127698e0f3; //bsc_testnet_after
    // address internal iAddresses = 0x48aa9c47897B50dBF8B7dc3A1bFa4b05C481EB3d; // bsc_mainnet
    modifier onlyManager(address _addr) {
        checkManager(_addr);
        _;
    }
    
    function checkManager(address _addr) internal view {
        (, bytes memory result ) = address( iAddresses ).staticcall(abi.encodeWithSignature("viewAddress(uint16)",0));
        require( abi.decode(result,(address)) == _addr , "This address is not Manager");
    } 
}
