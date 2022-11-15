// SPDX-License-Identifier: SEE LICENSE IN LICENSE.md

pragma solidity >=0.5.0;

interface IUniswapV2Migrator {
    function migrate(address token, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external;
}
