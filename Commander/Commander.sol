// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

import "../Storage/WrapAddresses.sol";
import "../Library/AggregatorV3Interface.sol";
import "./EmergencyStop.sol";

contract Commander is WrapAddresses {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    uint private reqeustTime = block.timestamp;
    bool private reEntry = false;
    AggregatorV3Interface internal priceFeed;
    IEmergencyStop internal contractStop;

    event giveEvent(address indexed pack, address fromAddr, address[] toAddr);
    event getChainlinkDataFeedAddressEvent(address dataFeed);

    modifier blockReEntry() {
        require(!reEntry, "Not allowed");
        reEntry = true;
        _;
        reEntry = false;
    }

    modifier haltInEmergency() {
        require(!contractStop.getContractStopped(), "function not allowed");
        _;
    }

    modifier requestLimit(uint t) {
        require(block.timestamp >= reqeustTime, "Too many request");
        reqeustTime = block.timestamp + t;
        _;
    }

    constructor() {
        // Data Feeds Addresses : https://docs.chain.link/docs/reference-contracts
        address dataFeedAddress = 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e;
        priceFeed = AggregatorV3Interface(dataFeedAddress);

        emit getChainlinkDataFeedAddressEvent(dataFeedAddress);

        // Need to change when deploying this contract
        contractStop = IEmergencyStop(0x5B38Da6a701c568545dCfcB03FcB875f56beddC4);
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

    // Returning value of WEI of the native token
    function getPrice() public view returns (uint256) {
        (, int price, , , ) = priceFeed.latestRoundData();
        uint256 totalDecimal = 10**(18 + priceFeed.decimals());

        return totalDecimal / uint256(price);
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
        uint balance = 0;

        if (tokenType == 100) {
            balance = address(this).balance;
        } else {
            balance = getBalance(getAddress(tokenType));
        }

        return balance;
    }

    function _swap(address _to, uint256 amountIn) internal returns (uint256) {
        (bool success, bytes memory result) = getAddress(1200).call{value: amountIn}(
            abi.encodeWithSignature(
                "exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))",
                getExactInputSigleParams(_to, amountIn, getAddress(101))
            )
        );

        require(success, "swap ETH->TOKEN fail");

        return abi.decode(result, (uint256));
    }

    function getExactInputSigleParams(
        address _to,
        uint256 _amountIn,
        address _tokenAddr
    ) internal view returns (ExactInputSingleParams memory) {
        return
            ExactInputSingleParams(
                getAddress(103), // WETH
                _tokenAddr,
                500, // fee
                _to,
                block.timestamp + 15, // daedline
                _amountIn,
                0, // amountOutMin
                0 // sqrtPriceLimitX96
            );
    }

    function checkFee(uint count) internal {
        uint8 n = 0;

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
