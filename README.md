# UsePAY SmartContract 

This is UsePAY's smart-contract project which developed with the Hardhat framework


## For Certik teams

Check [this document](CERTIK.md) please.

## Directory structure

```shell
.
├── README.md                               # Current document
├── Uniswap                                 # Uniswap v2
│   ├── LICENSE.md
│   ├── README.md
│   ├── contracts                           # Contracts
│   ├── deploy                              # Deployment scripts
│   ├── hardhat.config.js
│   ├── package.json
│   └── yarn.lock
├── UsePAY                                  # UsePAY
│   ├── LICENSE.md
│   ├── README.md
│   ├── contracts                           # Contracts
│   ├── deploy                              # Deployment scripts
│   ├── test                                # Tests
│   ├── hardhat.config.js
│   ├── package.json
│   └── yarn.lock
├── output                                  # Deployment history logs
└── package.json
```

## Setting development environment

> Node.js 16.15.0

```shell
$ yarn
$ cd UsePAY; yarn       # For UsePAY project
$ cd ../Uniswap; yarn   # For Uniswap V2 project
```

## Test
```shell
# Launch local private network for testing
$ yarn localnet

# Test all
$ yarn test

# Test each Packs
$ yarn test:coupon          # Coupon Pack
$ yarn test:ticket          # Ticket Pack
$ yarn test:subscription    # Subscription Pack
```


## Deployment scripts

> Log file structure : `output/NETWORK_NAME-history.log`.
> Deployment command structure : `yarn deploy PROJECT NETWORK NUMBER`

```shell
├── 01-WrappedToken.js          // The Number parameter must be 1
├── 02-ERC20.js
├── 03-Addresses.js
├── 04-WrapAddresses.js
├── 05-CommanderCreators.js
├── 06-Libraries.js
├── 07-SetAddress.js
├── common
│   └── util.js
└── deploy.sh
```

> As the following example, the deployment number is 1, so the command have be `yarn deploy usepay localhost 1`.

```shell
# Launch local private network for the deployment testing
$ yarn localnet

# Deploying Wrapped token contract
$ yarn deploy usepay localhost 1

# Extract all ABIs
$ yarn abi
```

### Full deployment guide.

Check [this documentation](./DEPLOYMENT.md) written in Korean out

### ABI API Viewer online

- https://abi.hashex.org/