require('hardhat-spdx-license-identifier');
require("@nomiclabs/hardhat-waffle");
require('hardhat-contract-sizer');
require('hardhat-gas-reporter');
require('hardhat-prettier');
require('solidity-docgen');

const settings = {
    optimizer: {
        enabled: true,
        runs: 28
    }
};

module.exports = {
    defaultNetwork: 'localhost',
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
                version: '0.8.9',
                settings
            },
            {
                version: '0.8.0',
                settings
            },
            {
                version: '0.4.18',
                settings
            }
        ]
    },
    contractSizer: {
        alphaSort: true,
        disambiguatePaths: false,
        runOnCompile: true,
        strict: true
    }
};
