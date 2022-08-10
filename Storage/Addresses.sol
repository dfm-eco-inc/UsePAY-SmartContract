// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

contract Addresses {
    struct MultiSign {
        uint count;
        uint unlockTimestamp;
        uint16[] index;
        address[] addr;
        address[] confirmers;
    }

    uint private immutable unlockSeconds;
    uint private immutable numConfirmationsRequired;
    mapping(uint16 => address) private addresses;
    MultiSign private multiSign;

    event startSetAddressesEvent(address starterAddress, address[] newAddress, uint16[] idx);
    event cancelSetAddressesEvent(address cancelerAddress);
    event confirmSetAddressesEvent(address confirmerAddress);
    event launchSetAddressesEvent(address launcherAddress, address[] newAddress, uint16[] idx);

    modifier onlyManager() {
        require(checkManager(msg.sender), "This address is not manager ");
        _;
    }

    constructor(
        address[] memory _owners,
        uint _numConfirmationsRequired,
        uint _unlockSeconds
    ) {
        require(_owners.length >= 3, "A minimum of 3 accounts is required.");
        require(_numConfirmationsRequired > 1, "At least 2 confirmations are required");
        require(_unlockSeconds >= 10 seconds, "At least 10 seconds are required");

        for (uint16 i; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid account");
            addresses[i] = owner;
        }

        unlockSeconds = _unlockSeconds;
        numConfirmationsRequired = _numConfirmationsRequired;
        multiSign.confirmers = new address[](numConfirmationsRequired);
    }

    function startSetAddresses(uint16[] memory _index, address[] memory _addr)
        external
        onlyManager
    {
        require(multiSign.count == 0, "Already in progress");

        multiSign.confirmers[0] = msg.sender;
        multiSign.index = _index;
        multiSign.addr = _addr;
        multiSign.count = 1;

        emit startSetAddressesEvent(msg.sender, _addr, _index);
    }

    function cancelSetAddresses() external onlyManager {
        require(multiSign.count > 0, "Can not cancel confirmation");

        for (uint16 i; i < multiSign.confirmers.length; i++) {
            if (multiSign.confirmers[i] == msg.sender) {
                multiSign.confirmers[i] = address(0);
                multiSign.count--;
                break;
            }
        }

        emit cancelSetAddressesEvent(msg.sender);
    }

    function confirmSetAddresses() external onlyManager {
        require(
            multiSign.count > 0 && multiSign.count < numConfirmationsRequired,
            "Do not need confirmation"
        );

        for (uint i; i < multiSign.confirmers.length; i++) {
            require(multiSign.confirmers[i] != msg.sender, "Already confirmed");
        }

        for (uint i; i < multiSign.confirmers.length; i++) {
            if (multiSign.confirmers[i] == address(0)) {
                multiSign.confirmers[i] = msg.sender;
                multiSign.count++;
                break;
            }
        }

        if (multiSign.count >= numConfirmationsRequired) {
            multiSign.unlockTimestamp = uint32(block.timestamp + unlockSeconds);
        }

        emit confirmSetAddressesEvent(msg.sender);
    }

    function launchSetAddresses() external onlyManager {
        require(multiSign.count == numConfirmationsRequired, "Needed all confirmation");
        require(block.timestamp >= multiSign.unlockTimestamp, "Execution time is not reached");

        for (uint i; i < multiSign.index.length; i++) {
            addresses[multiSign.index[i]] = multiSign.addr[i];
        }

        multiSign.count = 0;
        multiSign.unlockTimestamp = 0;

        for (uint16 i; i < multiSign.confirmers.length; i++) {
            multiSign.confirmers[i] = address(0);
        }

        emit launchSetAddressesEvent(msg.sender, multiSign.addr, multiSign.index);
    }

    function viewConfirmSetAddressStatus() external view returns (MultiSign memory) {
        return multiSign;
    }

    function viewAddress(uint16 _index) external view returns (address) {
        return addresses[_index];
    }

    function viewNumOfConfirmation() external view returns (uint) {
        return numConfirmationsRequired;
    }

    function viewUnlockSeconds() external view returns (uint) {
        return unlockSeconds;
    }

    function checkManager(address _addr) public view returns (bool) {
        require(_addr != address(0), "AD01 - Not available for manager");
        if (_addr == address(this)) return true;

        for (uint16 i; i < 100; i++) {
            if (addresses[i] == _addr) {
                return true;
            }
        }

        return false;
    }
}
