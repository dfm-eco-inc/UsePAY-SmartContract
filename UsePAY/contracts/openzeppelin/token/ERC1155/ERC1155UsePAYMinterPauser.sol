// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol';

contract ERC1155UsePAYMinterPauser is ERC1155PresetMinterPauser {
    string public name;

    constructor(string memory collectionName, string memory metadataUri) ERC1155PresetMinterPauser(metadataUri) {
        name = collectionName;
    }
}
