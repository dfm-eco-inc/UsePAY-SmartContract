// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import "../../Storage/WrapAddresses.sol";

contract KLA_Commander is WrapAddresses {
    uint private reqeustTime = block.timestamp;
    bool private reEntry = false;

    event GiveEvent(address indexed pack, address fromAddr, address[] toAddr);

    modifier blockReEntry() {
        require(!reEntry, "Not allowed");
        reEntry = true;
        _;
        reEntry = false;
    }

    modifier haltInEmergency() {
        require(!_isHalted(), "function not allowed");
        _;
    }

    modifier requestLimit(uint t) {
        require(block.timestamp >= reqeustTime, "Too many request");
        reqeustTime = block.timestamp + t;
        _;
    }

    function getCountFee(uint count) external view returns (uint256) {
        uint8 n;

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

    function getPrice() public view returns (uint256) {
        (bool success, bytes memory priceBytes) = getAddress(1202).staticcall(
            abi.encodeWithSignature(
                "estimatePos(address,uint256)",
                getAddress(506), // USDT
                1000000
            )
        );

        require(success, "estimatePos failed");

        return abi.decode(priceBytes, (uint));
    }

    function _transfer(
        uint16 tokenType,
        address _to,
        uint256 value
    ) internal {
        if (tokenType == 100) {
            payable(_to).transfer(value);
        } else {
            (bool success, ) = getAddress(tokenType).call(
                abi.encodeWithSignature("transfer(address,uint256)", _to, value)
            );

            require(success, "TOKEN transfer Fail");
        }
    }

    function _getBalance(uint16 tokenType) internal view returns (uint256) {
        uint balance;

        if (tokenType == 100) {
            balance = address(this).balance;
        } else {
            balance = getBalance(getAddress(tokenType));
        }

        return balance;
    }

    function checkFee(uint count) internal {
        uint8 n;

        if (count > 10) {
            while (count >= 10) {
                count = count / 10;
                n++;
            }

            require(msg.value > getPrice() * n * 5, "C01 - Not enough fee");
        } else {
            require(msg.value > getPrice(), "C01 - Not enough fee");
        }
    }

    function _isHalted() internal view returns (bool) {
        (bool success, bytes memory resultBytes) = getAddress(7000).staticcall(
            abi.encodeWithSignature("getContractStopped()")
        );

        require(success, "Get Contract Stopped failed");
        return abi.decode(resultBytes, (bool));
    }

    function getBalance(address addr) internal view returns (uint256) {
        (bool success, bytes memory balanceBytes) = addr.staticcall(
            abi.encodeWithSignature("balanceOf(address)", address(this))
        );

        require(success, "Get balance failed");

        return abi.decode(balanceBytes, (uint256));
    }

    function getAddress(uint16 index) internal view returns (address) {
        (bool success, bytes memory addressBytes) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", uint16(index))
        );

        require(success, "Get address failed");

        return abi.decode(addressBytes, (address));
    }
}
