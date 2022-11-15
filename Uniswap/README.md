# UsePAY Smart Contract for EVM based networks.

This project is a hardhat project for UsePAY Smart Contract.
UsePAY Smart Contract runs on Ethereum, BSC, and Klayn networks.

# TODO

## Requirements

```shell
# Checking
$ node -v
v16.0.0

# if using nvm
$ nvm install v16.0.0
$ nvm use 16
```

## Installation

```shell
$ yarn install
```

## Compile

```shell
$ yarn compile
```

## Local deploy test

> TODO: 배포된 addresses 컨트랙트의 index 에 주요 주소들을 할당해야 합니다.

```shell
# 로컬 테스트 네트워크 실행
$ yarn localnet
# 토큰 생성, 기존 토큰을 사용하려면 `output/bsc_testnet/tokenAddress.json` 을 수정합니다.
$ yarn deploy:token:bsc
# 배포
$ yarn deploy:bsc
```

## Hardhat commands

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```

## Contract copy

```shell
cp -R /Users/dfmeco/kenneth/projects/UsePAY-SmartContract/Commander ./contracts/UsePAY/
cp -R /Users/dfmeco/kenneth/projects/UsePAY-SmartContract/Creator ./contracts/UsePAY/
cp -R /Users/dfmeco/kenneth/projects/UsePAY-SmartContract/Library ./contracts/UsePAY/
cp -R /Users/dfmeco/kenneth/projects/UsePAY-SmartContract/Pack ./contracts/UsePAY/
cp -R /Users/dfmeco/kenneth/projects/UsePAY-SmartContract/Storage ./contracts/UsePAY/
cp -R /Users/dfmeco/kenneth/projects/UsePAY-SmartContract/Utils ./contracts/UsePAY/
cp -R /Users/dfmeco/kenneth/projects/UsePAY-SmartContract/Test ./contracts/UsePAY/
rm ./contracts/Test/TwapGetter.sol
rm ./contracts/Test/PoolGetter.sol
# import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
```

## Docs

- Hardhat : https://hardhat.org/getting-started
- Deploy : https://docs.google.com/spreadsheets/d/1MRbAKAS4A1IVDM9Q9TuaDwGGbGKnDKT5V5C4D_ibzGw/edit#gid=0
- Addressed : https://docs.google.com/spreadsheets/d/1iB2BWiszYvOYgKEIwBPKCoj3Oq5xu9TOfKuoSrCBHwA/edit#gid=1982571935
