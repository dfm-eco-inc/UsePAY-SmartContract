const { ethers } = require('hardhat');

async function deploy(contractName, params) {
    let Contract = await ethers.getContractFactory(contractName);
    Contract = params ? await Contract.deploy(...params) : await Contract.deploy();
    await Contract.deployed();
    return Contract;
}

async function getBalance(address) {
    return ethers.utils.formatEther(await ethers.provider.getBalance(address));
}

module.exports = { deploy, getBalance };
