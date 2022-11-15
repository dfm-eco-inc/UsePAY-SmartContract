require("hardhat-spdx-license-identifier");
require("@nomiclabs/hardhat-waffle");
require('hardhat-gas-reporter');
require("hardhat-prettier");

const settings = {
    optimizer: {
        enabled: true,
        runs: 200,
    },
};

module.exports = {
    defaultNetwork: 'localhost',
    mocha: {
        timeout: 400000000
    },
    gasReporter: {
        currency: 'USD',
        gasPrice: 21
    },
    networks: {
        localhost: {
            url: 'http://127.0.0.1:8545'
        },
        mumbai: {
            url: 'https://polygon-mumbai.g.alchemy.com/v2/API_KEY',
            accounts: []
        },
        bnbtest: {
            url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
            accounts: []
        },
        goerli: {
            gasPrice: 80000000000,
            url: 'https://eth-goerli.g.alchemy.com/v2/API_KEY',
            accounts: []
        },
        polygon: {
            url: 'https://polygon-rpc.com',
            accounts: []
        }
    },
    solidity: {
        compilers: [
            {
                version: '0.5.16',
                settings
            },
            {
                version: '0.6.0',
                settings
            },
            {
                version: '0.6.6',
                settings
            }
        ],
        settings
    }
};
