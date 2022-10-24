// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

/**
 * UsePAY 여러 사용자에게 동시에 토큰을 보내는 컨트랙트 - CalcReferrerContract
 */
contract MultiTransfer {
    struct TransferInfo {
        address to;
        uint256 amount;
    }

    // PAC 토큰 주소 (구 DFM)
    address governanceTokenAddress;

    event TokenTransferEvent(address sender, TransferInfo[] receiver);
    event GovernanceTokenTransferEvent(address sender, TransferInfo[] receiver);

    constructor(address tokenAddress) {
        governanceTokenAddress = tokenAddress;
    }

    function multiTransfer(address tokenAddress, TransferInfo[] memory to) external payable {
        _transfer(tokenAddress, to);
        emit TokenTransferEvent(msg.sender, to);
    }

    function transferGovernanceToken(TransferInfo[] memory to) external payable {
        _transfer(governanceTokenAddress, to);
        emit GovernanceTokenTransferEvent(msg.sender, to);
    }

    function _transfer(address tokenAddress, TransferInfo[] memory to) private {
        for (uint256 i = 0; i < to.length; i++) {
            (bool success, ) = address(tokenAddress).call(
                abi.encodeWithSignature('transferFrom(address, address, uint256)', msg.sender, to[i].to, to[i].amount)
            );
            require(success, 'TOKEN transfer Fail');
        }
    }
}
