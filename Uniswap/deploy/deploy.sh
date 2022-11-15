#!/bin/bash

if [ -z "$1" ]; then echo '네트워크 구분자가 비어있습니다.'; exit; fi
if [ -z "$2" ]; then echo '컨트랙트 구분자가 비어있습니다.'; exit; fi

if [ $2 -gt 11 ]; then echo '컨트랙트 번호가 너무 큽니다.'; exit; fi
if [ $2 -lt 1 ]; then echo '컨트랙트 번호가 작습니다.'; exit; fi

case $2 in
    1) npx hardhat run --network $1 ./deploy/01-UniswapV2Factory.js ;;
    2) npx hardhat run --network $1 ./deploy/02-UniswapRouter.js ;;
    3) npx hardhat run --network $1 ./deploy/03-CreateTokenPair.js ;;
    4) npx hardhat run --network $1 ./deploy/04-AddLiquidity-interactive.js ;;
    10) MANAGER_ADDRESS=$3 WRAPPED_TOKEN_ADDRESS=$4 GOVERNANCE_TOKEN_ADDRESS=$5 NATIVE_TOKEN_LIQUIDITY_AMOUNT=$6 GOVERNANCE_TOKEN_LIQUIDITY_AMOUNT=$7 npx hardhat run --network $1 ./deploy/10-DeployAll.js ;;
    11) MANAGER_ADDRESS=$3 ROUTER_ADDRESS=$4 GOVERNANCE_TOKEN_ADDRESS=$5 NATIVE_TOKEN_LIQUIDITY_AMOUNT=$6 GOVERNANCE_TOKEN_LIQUIDITY_AMOUNT=$7 PAIR=$8 npx hardhat run --network $1 ./deploy/11-AddLiquidity.js ;;
esac
