#!/bin/bash

if [ -z "$1" ]; then echo '프로그램 구분자가 비어있습니다.'; exit; fi
if [ -z "$2" ]; then echo '네트워크 구분자가 비어있습니다.'; exit; fi
if [ -z "$3" ]; then echo '컨트랙트 구분자가 비어있습니다.'; exit; fi

if [ $3 -gt 7 ]; then echo '컨트랙트 번호가 너무 큽니다.'; exit; fi
if [ $3 -lt 1 ]; then echo '컨트랙트 번호가 작습니다.'; exit; fi

case $1 in
    usepay) cd UsePAY;;
    uniswap) cd Uniswap;;
esac

yarn deploy $2 $3
