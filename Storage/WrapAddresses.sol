// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

contract WrapAddresses {
    // address internal immutable iAddresses = 0x30BafbA23f24d386a39210280590B0346c0dfd92; // UsePAY_eth_rinkeby
    // address internal immutable iAddresses = 0x31716bbA4B12A52592c041ED19Dc06B5F99e20e8; // UsePAY_bsc_testnet
    // address internal immutable iAddresses = 0xC143722499E159C84d06B36C64D79c5F868905e1; // UsePAY_klaytn_testnet
    // address internal immutable iAddresses = 0xeD05ccB1f106D57bd18C6e3bD88dB70AC936de68; // UsePAY_bsc_eth_klaytn_mainnet
    // address internal immutable iAddresses = 0x48aa9c47897B50dBF8B7dc3A1bFa4b05C481EB3d; // Bridge_eth_bsc_mainnet
    address internal immutable iAddresses = 0xa146CF9b52a77f56FFe0C158D7bA05576d7adE04; // Certik test

    modifier onlyManager(address _addr) {
        checkManager(_addr);
        _;
    }

    function viewNumOfConfirmation() internal view returns (uint) {
        (bool success, bytes memory result) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewNumOfConfirmation()")
        );

        require(success, "Get number of confirmation failed");
        return abi.decode(result, (uint));
    }

    function checkManager(address _addr) internal view {
        (bool success, bytes memory result) = address(iAddresses).staticcall(
            abi.encodeWithSignature("checkManager(address)", _addr)
        );

        require(success, "Get manager failed");
        require(abi.decode(result, (bool)), "This address is not Manager");
    }
}
