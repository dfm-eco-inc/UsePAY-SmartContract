// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import '../../Storage/WrapAddresses.sol';

contract KLA_Commander is WrapAddresses {
    event giftEvent(address indexed pack, address fromAddr, address[] toAddr); // 0: pack indexed, 1: from, 2: to, 3: count
    event giveEvent(address indexed pack, address fromAddr, address[] toAddr); // 0: pack indexed, 1: from, 2: to, 3: count

    bool reEntry = false;
    modifier blockReEntry() {
        require(!reEntry);
        reEntry = true;
        _;
        reEntry = false;
    }

    function _transfer(
        uint16 tokenType,
        address _to,
        uint256 value
    ) internal {
        if (tokenType == 100) {
            payable(_to).transfer(value);
        } else {
            (bool success0, bytes memory tokenResult) = address(iAddresses).staticcall(abi.encodeWithSignature('viewAddress(uint16)', uint16(tokenType)));
            require(success0, '0');
            (bool success, ) = address(abi.decode(tokenResult, (address))).call(abi.encodeWithSignature('transfer(address,uint256)', _to, value));
            require(success, 'TOKEN transfer Fail');
        }
    }

    function _getBalance(uint16 tokenType) internal view returns (uint256) {
        uint balance = 0;
        if (tokenType == 100) {
            balance = address(this).balance;
        } else {
            (, bytes memory tokenResult) = address(iAddresses).staticcall(abi.encodeWithSignature('viewAddress(uint16)', uint16(tokenType)));
            (, bytes memory result) = address(abi.decode(tokenResult, (address))).staticcall(abi.encodeWithSignature('balanceOf(address)', address(this)));
            balance = abi.decode(result, (uint256));
        }
        return balance;
    }

    function checkFee(uint count) internal {
        uint8 n = 0;
        if (count > 10) {
            while (count >= 10) {
                count = count / 10;
                n++;
            }
            require(msg.value > getPrice() * n * 5, 'C01');
        } else {
            require(msg.value > getPrice(), 'C01');
        }
    }

    function getPrice() internal view returns (uint256) {
        (bool success0, bytes memory resultPool) = address(iAddresses).staticcall(abi.encodeWithSignature('viewAddress(uint16)', 1202));
        require(success0, '0');
        address klaySwapPool = abi.decode(resultPool, (address));
        (bool success1, bytes memory usdtResult) = address(iAddresses).staticcall(abi.encodeWithSignature('viewAddress(uint16)', 506));
        require(success1, '1');
        (bool success2, bytes memory data) = address(klaySwapPool).staticcall(abi.encodeWithSignature('estimatePos(address,uint256)', abi.decode(usdtResult, (address)), 1000000));
        require(success2, '2');
        return abi.decode(data, (uint));
    }

    function getCountFee(uint count) external view returns (uint256) {
        uint8 n = 0;
        if (count > 10) {
            while (count >= 10) {
                count = count / 10;
                n++;
            }
            return getPrice() * n * 5;
        } else {
            return getPrice();
        }
    }
}
