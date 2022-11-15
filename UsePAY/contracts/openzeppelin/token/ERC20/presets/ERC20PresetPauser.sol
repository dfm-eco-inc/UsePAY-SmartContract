// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../ERC20.sol';
import '../extensions/ERC20Burnable.sol';
import '../extensions/ERC20Pausable.sol';
import '../../../access/AccessControlEnumerable.sol';
import '../../../utils/Context.sol';

// PAC 토큰은 Minting 기능 사용하지 않음
contract ERC20PresetPauser is Context, AccessControlEnumerable, ERC20Burnable, ERC20Pausable {
    bytes32 public constant PAUSER_ROLE = keccak256('PAUSER_ROLE');

    constructor(string memory name, string memory symbol, uint256 amount) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        _mint(_msgSender(), amount);
    }

    function pause() public virtual {
        require(hasRole(PAUSER_ROLE, _msgSender()), 'ERC20PresetPauser: must have pauser role to pause');
        _pause();
    }

    function unpause() public virtual {
        require(hasRole(PAUSER_ROLE, _msgSender()), 'ERC20PresetPauser: must have pauser role to unpause');
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
