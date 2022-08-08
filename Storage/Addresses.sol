// SPDX-License-Identifier: GNU LGPLv3
pragma solidity 0.8.9;

contract Addresses {
    mapping(uint16 => address) private addresses;

    event setAddressEvent(address newAddress, uint16 idx);
    event setAddressesEvent(address[] newAddresses, uint16[] idxs);

    modifier onlyManager() {
        require(checkManager(msg.sender), "This address is not manager");
        _;
    }

    constructor() {
        addresses[0] = msg.sender;
    }

    function setAddress(uint16 _index, address _addr) external onlyManager {
        addresses[_index] = _addr;
        emit setAddressEvent(_addr, _index);
    }

    function setAddresses(uint16[] memory _index, address[] memory _addr) external onlyManager {
        require(_index.length == _addr.length, "not same _index,_addr length");

        for (uint16 i; i < _index.length; i++) {
            addresses[_index[i]] = _addr[i];
        }

        emit setAddressesEvent(_addr, _index);
    }

    function viewAddress(uint16 _index) external view returns (address) {
        return addresses[_index];
    }

    function checkManager(address _addr) public view returns (bool) {
        require(_addr != address(0), "AD01 - Not available for manager");

        for (uint8 i; i < 100; i++) {
            if (addresses[i] == _addr) {
                return true;
            }
        }

        return false;
    }
}
