// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

contract WrapAddresses {
    bool isReEntry = false;
    uint requestTime = block.timestamp;

    address internal ADR_ADDRESSES = 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6;
    uint8 internal immutable ADR_CREATOR = 0;
    uint8 internal immutable ADR_NATIVE_TOKEN = 100;
    uint8 internal immutable ADR_WRAPPED_NATIVE_TOKEN = 101;
    uint8 internal immutable ADR_PAC_TOKEN = 102;
    uint16 internal immutable ADR_UNISWAP_ROUTER = 60000;
    uint16 internal immutable ADR_PERCENTAGE = 60100;
    uint16 internal immutable ADR_EMERGENCY_STOP = 60101;
    uint16 internal immutable ADR_CHAINLINK_DATAFEED = 61000;
    uint16 internal immutable ADR_TICKET_COMMANDER = 62000;
    uint16 internal immutable ADR_COUPON_COMMANDER = 62001;
    uint16 internal immutable ADR_SUBSCR_COMMANDER = 62002;
    uint16 internal immutable MAX_TICKET_QTY = 1000;
    uint16 internal immutable MAX_SUBSCRIPTION_QTY = 1000;
    uint16 internal immutable MAX_COUPON_QTY = 3000;

    modifier onlyManager(address _addr) {
        checkManager(_addr);
        _;
    }

    function viewUnlockSeconds() internal view returns (uint256) {
        (bool success, bytes memory result) = address(ADR_ADDRESSES).staticcall(
            abi.encodeWithSignature('viewUnlockSeconds()')
        );

        require(success, 'Get number of confirmation failed');
        return abi.decode(result, (uint256));
    }

    function viewNumOfConfirmation() internal view returns (uint256) {
        (bool success, bytes memory result) = address(ADR_ADDRESSES).staticcall(
            abi.encodeWithSignature('viewNumOfConfirmation()')
        );

        require(success, 'Get number of confirmation failed');
        return abi.decode(result, (uint256));
    }

    function checkManager(address _addr) internal view {
        (bool success, bytes memory result) = address(ADR_ADDRESSES).staticcall(
            abi.encodeWithSignature('checkManager(address)', _addr)
        );

        require(success, 'Get manager failed');
        require(abi.decode(result, (bool)), 'This address is not Manager');
    }
}
