// SPDX-License-Identifier: GNU GENERAL PUBLIC LICENSE V3
pragma solidity ^0.8.0;

import '../openzeppelin/token/ERC20/ERC20.sol';

contract TOKEN_SYMBOL is ERC20 {
    constructor() ERC20('TOKEN_NAME', 'TOKEN_SYMBOL') {}

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint _amount) external {
        require(balanceOf(msg.sender) >= _amount, 'insufficient balance.');
        _burn(msg.sender, _amount);
        payable(msg.sender).transfer(_amount);
    }
}
