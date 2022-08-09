// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../Storage/WrapAddresses.sol";

contract EmergencyStop is WrapAddresses {
    struct MultiSign {
        uint count;
        bool stoppedState;
        address[] confirmers;
    }

    bool private contractStopped;
    uint private immutable numConfirmationsRequired;
    MultiSign internal multiSign;

    event toggleContractStoppedEvent(bool contractStopped);

    constructor() {
        numConfirmationsRequired = viewNumOfConfirmation();
        multiSign.confirmers = new address[](numConfirmationsRequired);
    }

    function confirmToggleContractStopped() external onlyManager(msg.sender) {
        require(multiSign.count != 0, "Do not need confirmation");

        for (uint i; i < multiSign.confirmers.length; i++) {
            require(multiSign.confirmers[i] != msg.sender, "Already confirmed");
        }

        multiSign.confirmers[multiSign.count] = msg.sender;
        multiSign.count++;

        if (multiSign.count >= numConfirmationsRequired) {
            this.toggleContractStopped();
        }
    }

    function toggleContractStopped() external {
        if (msg.sender != address(this)) checkManager(msg.sender);

        require(
            multiSign.count == 0 || multiSign.count >= numConfirmationsRequired,
            "Wating for confirmation"
        );

        if (multiSign.count == 0) {
            multiSign.confirmers[0] = msg.sender;
            multiSign.stoppedState = !contractStopped;
            multiSign.count = 1;
        } else {
            contractStopped = multiSign.stoppedState;

            multiSign.count = 0;
            for (uint16 i; i < multiSign.confirmers.length; i++) {
                multiSign.confirmers[i] = address(0);
            }

            emit toggleContractStoppedEvent(contractStopped);
        }
    }

    function getContractStopped() external view returns (bool) {
        return contractStopped;
    }
}
