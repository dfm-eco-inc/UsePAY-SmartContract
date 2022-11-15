// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

contract Addresses {
    struct MultiSign {
        uint256 count;
        uint256 unlockTimestamp;
        uint16[] index;
        address[] addr;
        address[] confirmers;
    }

    uint256 private immutable unlockSeconds;
    uint256 private immutable numConfirmationsRequired;
    mapping(uint16 => address) private addresses;
    MultiSign private multiSign;

    event StartSetAddressesEvent(address starterAddress, address[] newAddress, uint16[] idx);
    event CancelSetAddressesEvent(address cancelerAddress);
    event ConfirmSetAddressesEvent(address confirmerAddress);
    event LaunchSetAddressesEvent(address launcherAddress, address[] newAddress, uint16[] idx);

    modifier onlyManager() {
        require(checkManager(msg.sender), 'This address is not manager ');
        _;
    }

    constructor(address[] memory managerAddresses, uint256 confirmationCount, uint256 unlockDelaySeconds) {
        require(confirmationCount >= 2, 'At least 2 confirmations are required');
        require(
            managerAddresses.length >= 3 && managerAddresses.length > confirmationCount,
            'A minimum of 3 accounts and many than the confirmation count are required.'
        );
        require(unlockDelaySeconds >= 24 hours, 'At least 24 hours are required');

        for (uint16 i; i < managerAddresses.length; i++) {
            address manager = managerAddresses[i];
            require(manager != address(0), 'Invalid account');
            addresses[i] = manager;
        }

        unlockSeconds = unlockDelaySeconds;
        numConfirmationsRequired = confirmationCount;
        multiSign.confirmers = new address[](numConfirmationsRequired);
    }

    function startSetAddresses(uint16[] memory index, address[] memory newAddress) external onlyManager {
        require(multiSign.count == 0, 'Already in progress');
        require(index.length == newAddress.length, 'The array length of the arguments is not matched');
        require(index.length > 0, 'Empty argument');

        multiSign.confirmers[0] = msg.sender;
        multiSign.index = index;
        multiSign.addr = newAddress;
        multiSign.count = 1;

        emit StartSetAddressesEvent(msg.sender, newAddress, index);
    }

    function cancelSetAddresses() external onlyManager {
        require(multiSign.count > 0, 'Can not cancel confirmation');

        for (uint16 i; i < multiSign.confirmers.length; i++) {
            if (multiSign.confirmers[i] == msg.sender) {
                multiSign.confirmers[i] = address(0);
                multiSign.count--;
                break;
            }
        }

        emit CancelSetAddressesEvent(msg.sender);
    }

    function confirmSetAddresses() external onlyManager {
        require(multiSign.count > 0 && multiSign.count < numConfirmationsRequired, 'Do not need confirmation');

        for (uint256 i; i < multiSign.confirmers.length; i++) {
            require(multiSign.confirmers[i] != msg.sender, 'Already confirmed');
        }

        for (uint256 i; i < multiSign.confirmers.length; i++) {
            if (multiSign.confirmers[i] == address(0)) {
                multiSign.confirmers[i] = msg.sender;
                multiSign.count++;
                break;
            }
        }

        if (multiSign.count >= numConfirmationsRequired) {
            multiSign.unlockTimestamp = uint32(block.timestamp + unlockSeconds);
        }

        emit ConfirmSetAddressesEvent(msg.sender);
    }

    function launchSetAddresses() external onlyManager {
        require(multiSign.count == numConfirmationsRequired, 'Needed all confirmation');
        require(block.timestamp >= multiSign.unlockTimestamp, 'Execution time is not reached');

        for (uint256 i; i < multiSign.index.length; i++) {
            addresses[multiSign.index[i]] = multiSign.addr[i];
        }

        multiSign.count = 0;
        multiSign.unlockTimestamp = 0;

        for (uint16 i; i < multiSign.confirmers.length; i++) {
            multiSign.confirmers[i] = address(0);
        }

        emit LaunchSetAddressesEvent(msg.sender, multiSign.addr, multiSign.index);
    }

    function viewConfirmSetAddressStatus() external view returns (MultiSign memory) {
        return multiSign;
    }

    function viewAddress(uint16 index) external view returns (address) {
        return addresses[index];
    }

    function viewNumOfConfirmation() external view returns (uint256) {
        return numConfirmationsRequired;
    }

    function viewUnlockSeconds() external view returns (uint256) {
        return unlockSeconds;
    }

    function checkManager(address targetAddress) public view returns (bool) {
        require(targetAddress != address(0), 'AD01 - Not available for manager');
        if (targetAddress == address(this)) return true;

        for (uint16 i; i < 100; i++) {
            if (addresses[i] == targetAddress) {
                return true;
            }
        }

        return false;
    }
}
