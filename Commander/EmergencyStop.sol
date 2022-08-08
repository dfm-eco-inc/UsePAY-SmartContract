// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import "../Storage/WrapAddresses.sol";

interface IEmergencyStop {
    function getContractStopped() external pure returns (bool);

    function toggleContractStopped() external;
}

contract EmergencyStop is WrapAddresses {
    bool private contractStopped = false;

    function toggleContractStopped() external onlyManager(msg.sender) {
        contractStopped = !contractStopped;
    }

    function getContractStopped() external view returns (bool) {
        return contractStopped;
    }
}
