#!/bin/bash

if [ -z "$1" ]; then echo '네트워크 구분자가 비어있습니다.'; exit; fi
if [ -z "$2" ]; then echo '컨트랙트 구분자가 비어있습니다.'; exit; fi

if [ $2 -gt 6 ]; then echo '컨트랙트 번호가 너무 큽니다.'; exit; fi
if [ $2 -lt 1 ]; then echo '컨트랙트 번호가 작습니다.'; exit; fi

case $2 in
    1) npx hardhat run --network $1 ./deploy/01-WrappedToken.js ;;
    2) npx hardhat run --network $1 ./deploy/02-ERC20.js ;;
    3) npx hardhat run --network $1 ./deploy/03-Addresses.js ;;
    4) npx hardhat run --network $1 ./deploy/04-CommanderCreators.js ;;
    5) npx hardhat run --network $1 ./deploy/05-Libraries.js ;;
    6) npx hardhat run --network $1 ./deploy/06-SetAddress.js ;;
esac
