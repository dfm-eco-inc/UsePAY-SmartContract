// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

contract Addresses {
    struct MultiSign {
        uint count;
        uint16[] index;
        address[] addr;
        address[] confirmers;
    }

    uint private immutable numConfirmationsRequired;
    mapping(uint16 => address) private addresses;
    MultiSign private multiSignAddress;
    MultiSign private multiSignAddresses;

    event setAddressEvent(address newAddress, uint16 idx);
    event setAddressesEvent(address[] newAddresses, uint16[] idxs);

    modifier onlyManager() {
        require(checkManager(msg.sender), "This address is not manager ");
        _;
    }

    constructor(address[] memory _owners, uint _numConfirmationsRequired) {
        require(_numConfirmationsRequired > 1, "At least 2 confirmations are required");
        require(_owners.length >= 3, "A minimum of 3 accounts is required.");

        for (uint16 i; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid account");
            addresses[i] = owner;
        }

        numConfirmationsRequired = _numConfirmationsRequired;
        multiSignAddress.confirmers = new address[](numConfirmationsRequired);
        multiSignAddresses.confirmers = new address[](numConfirmationsRequired);
    }

    function confirmSetAddress() external onlyManager {
        require(multiSignAddress.count != 0, "Do not need confirmation");

        for (uint i; i < multiSignAddress.confirmers.length; i++) {
            require(multiSignAddress.confirmers[i] != msg.sender, "Already confirmed");
        }

        multiSignAddress.confirmers[multiSignAddress.count] = msg.sender;
        multiSignAddress.count++;

        if (multiSignAddress.count >= numConfirmationsRequired) {
            this.setAddress(multiSignAddress.index[0], multiSignAddress.addr[0]);
        }
    }

    function confirmSetAddresses() external onlyManager {
        require(multiSignAddresses.count != 0, "Do not need confirmation");

        for (uint i; i < multiSignAddresses.confirmers.length; i++) {
            require(multiSignAddresses.confirmers[i] != msg.sender, "Already confirmed");
        }

        multiSignAddresses.confirmers[multiSignAddresses.count] = msg.sender;
        multiSignAddresses.count++;

        if (multiSignAddresses.count >= numConfirmationsRequired) {
            this.setAddresses(multiSignAddresses.index, multiSignAddresses.addr);
        }
    }

    function setAddress(uint16 _index, address _addr) external onlyManager {
        require(
            multiSignAddress.count == 0 || multiSignAddress.count >= numConfirmationsRequired,
            "Wating for confirmation"
        );

        if (multiSignAddress.count == 0) {
            multiSignAddress.confirmers[0] = msg.sender;
            multiSignAddress.index = [_index];
            multiSignAddress.addr = [_addr];
            multiSignAddress.count = 1;
        } else {
            addresses[multiSignAddress.index[0]] = multiSignAddress.addr[0];

            multiSignAddress.count = 0;
            for (uint16 i; i < multiSignAddress.confirmers.length; i++) {
                multiSignAddress.confirmers[i] = address(0);
            }

            emit setAddressEvent(_addr, _index);
        }
    }

    function setAddresses(uint16[] memory _index, address[] memory _addr) external onlyManager {
        require(
            multiSignAddresses.count == 0 || multiSignAddresses.count >= numConfirmationsRequired,
            "Wating for confirmation"
        );
        require(_index.length == _addr.length, "not same _index,_addr length");

        if (multiSignAddresses.count == 0) {
            multiSignAddresses.confirmers[0] = msg.sender;
            multiSignAddresses.index = _index;
            multiSignAddresses.addr = _addr;
            multiSignAddresses.count = 1;
        } else {
            for (uint i; i < multiSignAddresses.index.length; i++) {
                addresses[multiSignAddresses.index[i]] = multiSignAddresses.addr[i];
            }

            multiSignAddresses.count = 0;
            for (uint i; i < multiSignAddresses.confirmers.length; i++) {
                multiSignAddresses.confirmers[i] = address(0);
            }

            emit setAddressesEvent(_addr, _index);
        }
    }

    function viewAddress(uint16 _index) external view returns (address) {
        return addresses[_index];
    }

    function viewNumOfConfirmation() external view returns (uint) {
        return numConfirmationsRequired;
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
