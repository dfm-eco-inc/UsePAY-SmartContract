# UsePAY 전체 배포 방법

## Goerli 배포시 가스 관련 참고 사항

- 가스 가격이 급변해서 배포가 무한 펜딩상태에 빠지는 경우가 발생합니다. 
- 배포 직전에 `https://stats.goerli.net/` 에서 현재 가격을 참고하여, `hardhat.config.js` 의 해당 네트워크 설정에 참고한 gasPrice을 설정한 후 배포해야 합니다.

## 배포 

> 프로젝트를 완전히 새로 배포할 때 아래와 같이 진행합니다. 

### 1. Wrapped 네이티브 토큰 배포

이미 네트워크에 Wrapped Native Token 주소가 있는 경우는 주소만 메모합니다.

```shell
$ yarn deploy usepay localhost 1

Deploying Wrapped Token
===============================

---- 1 / 5 ----
생성할 Wrapped Native Token 의 이름을 입력해주세요. (기본값: Wrapped Ether)
입력 : Wrapped Ether

---- 2 / 5 ----
생성할 Wrapped Native Token 의 심볼을 입력해주세요. (기본값: WETH)
입력 : WETH

---- 3 / 5 ----
배포 할 네트워크 : localhost
토큰 이름 : Wrapped Ether
토큰 심볼 : WETH

---- 4 / 5 ----
정말 컨트랙트를 배포 하시겠습니까? (Y/N)
입력 : y
확인 : y

---- 5 / 5 ----
5초 전
4초 전
3초 전
2초 전
1초 전
배포된 Wrapped token 컨트랙트 주소 : 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

배포 완료.
```

### 2. PAC 토큰 배포 (UsePAY 거버넌스 토큰 ERC-20)

> UsePAY의 거버넌스 토큰인 PAC 토큰을 발행합니다. (구 DFM 토큰)
> 배포 대상 네트워크에 이미 배포된 경우에는 주소만 메모합니다.
> PAC 토큰의 추가 민팅은 회사의 정책상 불가능하고, 네트워크별 발행량이 각기 다릅니다. 

```shell
$ yarn deploy usepay localhost 2

Deploying ERC-20 Token
===============================

---- 1 / 7 ----
생성할 Token 의 이름을 입력해주세요. (기본값: USEPAY.IO)
입력 : USEPAY.IO

---- 2 / 7 ----
생성할 Wrapped Native Token 의 심볼을 입력해주세요. (기본값: PAC)
입력 : PAC

---- 3 / 7 ----
토큰 발행량을 입력해주세요. (기본값 : 1억개, 100,000,000)
입력 : 100000000

---- 4 / 7 ----
추가 민팅을 허용하시겠습니까? (Y/N)
입력 : n

---- 5/ 7 ----
배포 할 네트워크 : localhost
배포 할 컨트랙트 : ERC20PresetPauser
토큰 이름 : USEPAY.IO
토큰 심볼 : PAC
추가 민팅 : 불가능
발행 수량 : 100000000

---- 6 / 7 ----
이대로 ERC-20 토큰을 배포 하시겠습니까? (Y/N)
입력 : y
확인 : y

---- 7 / 7 ----
5초 전
4초 전
3초 전
2초 전
1초 전
배포된 Token 주소 : 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

배포 완료.
```

### 3. Addresses 컨트랙트 배포

> 업그레이드 가능한 배포를 위해, 계정 정보를 관리하는 Addresses 컨트랙트를 배포합니다. 
> 이 컨트랙트는 계정 주소를 인덱스 번호에 할당하고 수정할 수 있으며, 다중 서명을 통해서만 설정할 수 있습니다. 
> 0 ~ 100 까지의 인덱스는 관리자 계정이며, UsePAY 컨트랙트에서 사용하는 필수 인덱스 번호는 WrapAddresses.sol 에서 확인할 수 있습니다.

> ⚡️ 주의 사항 ⚡️ : Addresses 컨트랙트의 배포 주소가 `WrapAdresses.sol` 에 `하드코딩`되며, 다른 UsePAY 컨트랙트 배포시에 자동 포함되어 배포 됩니다. 

> 아래의 예시는 `다중 서명자(관리자) 3명`과 서명 완료후 기능 실행에 필요한 `최소한의 지연 시간`을 설정합니다. 


```shell
$ yarn deploy usepay localhost 3

Deploying UsePAY Addresses
===============================

---- 1 / 6 ----
다중 서명에 참여할 서명자 수를 입력해주세요 (최소 2명)
입력 : 3
확인 : 3

---- 2 / 6 ----
관리자 계정을 추가 해주세요. (공백 입력으로 완료))
입력 : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
확인 : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
관리자 계정을 추가 해주세요. (공백 입력으로 완료))
입력 : 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
확인 : 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
관리자 계정을 추가 해주세요. (공백 입력으로 완료))
입력 : 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
확인 : 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
관리자 계정을 추가 해주세요. (공백 입력으로 완료))
입력 :
확인 :

---- 3 / 6 ----
서명 완료후 실행 지연 시간을 입력해주세요. (최소 5초)
입력 : 5
확인 : 5

---- 4 / 6 ----
배포 할 네트워크 : localhost
배포 할 컨트랙트 : Addresses
다중 서명 참여자 수 : 3
등록할 관리자 계정 : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

---- 5 / 6 ----
정말 컨트랙트를 배포 하시겠습니까? (Y/N)
입력 : y
확인 : y

---- 6 / 6 ----
5초 전
4초 전
3초 전
2초 전
1초 전
배포된 Addresses 컨트랙트 주소 : 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
WrapAddresses 컨트랙트 갱신 완료

배포 완료.
```

### 4. Commander 와 Creator 컨트랙트 배포

> UsePAY 팩을 생성 및 제어 기능을 담당하는 컨트랙트를 일괄 배포 합니다. 

> 배포 과정에서 자동 불러오는 Addresses의 주소는 마지막 배포한 기록을 참조하여 자동으로 불러오지만, 한번 더 올바른지 확인하고, 아니라면 설정할 Addresses의 배포 주소를 입력해주세요. 

> ⚡️ 주의 사항 ⚡️ : 입력한 Addresses 컨트랙트의 배포 주소가 `WrapAdresses.sol` 에 `하드코딩`되며, 다른 UsePAY 컨트랙트 배포시에 자동 포함되어 배포 됩니다. 

```shell
$ yarn deploy usepay localhost 4

Deploying UsePAY Commander and Creators
===============================

---- 1 / 3----
? 배포할 컨트랙트 선택 :
❯◉ all
 ◯ none
 ────────
   ✓ TicketCommander
   ✓ CouponCommander
   ✓ SubscriptionCommander
   ✓ TicketCreator
   ✓ CouponCreator
   ✓ SubscriptionCreator

---- 1 / 3----
? 배포할 컨트랙트 선택 : TicketCommander, CouponCommander, SubscriptionCommander, TicketCreator, CouponCreator, SubscriptionCreator

Addresses 의 주소를 입력해주세요 (현재 값 : 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9)
입력 : 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

확인 : 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

---- 2 / 4 ----
배포 할 네트워크 : localhost
Addresses 계정 : 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
배포 할 컨트랙트 : TicketCommander
배포 할 컨트랙트 : CouponCommander
배포 할 컨트랙트 : SubscriptionCommander
배포 할 컨트랙트 : TicketCreator
배포 할 컨트랙트 : CouponCreator
배포 할 컨트랙트 : SubscriptionCreator

---- 3 / 4 ----
정말 컨트랙트를 배포 하시겠습니까? (Y/N)
입력 : yy

확인 : y

---- 4 / 4 ----
5초 전
4초 전
3초 전
2초 전
1초 전

WrapAddresses 컨트랙트 갱신 완료

배포된 TicketCommander 컨트랙트 주소 : 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
배포된 CouponCommander 컨트랙트 주소 : 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
배포된 SubscriptionCommander 컨트랙트 주소 : 0x0165878A594ca255338adfa4d48449f69242Eb8F
배포된 TicketCreator 컨트랙트 주소 : 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
배포된 CouponCreator 컨트랙트 주소 : 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
배포된 SubscriptionCreator 컨트랙트 주소 : 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318

배포 완료.
```

### 5. Libraries 컨트랙트 배포 

> UsePAY 컨트랙트와 인터페이스에서 사용하는 개별 기능을 실행하는 컨트랙트 입니다. 
> 백분율 계산을 위한 컨트랙트, 긴급 정지 기능을 위한 컨트랙트, 토큰 다중 전송을 위한 컨트랙트를 배포합니다.
> 배포 과정에서 입력하는 주소들이 잘못 입력되면 기능이 정상 작동하지 않으니 한번 더 확인해주세요. 

```shell
$ yarn deploy usepay localhost 4

Deploying UsePAY Libraries
===============================

---- 1 / 3----
? 배포할 컨트랙트 선택 :
❯◉ all
 ◯ none
 ────────
   ✓ Percentage
   ✓ EmergencyStop
   ✓ MultiTransfer
? 배포할 컨트랙트 선택 : Percentage, EmergencyStop, MultiTransfer

EmergencyStop 컨트랙트에서 참조할 Addresses 의 주소를 입력해주세요 (현재 값 : 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9)
입력 : 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

확인 : 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

MultiTransfer 컨트랙트에서 참조할 UsePAY 의 거버넌스 토큰(PAC)의 주소를 입력해주세요. (현재 값: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0)
입력 : 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

확인 : 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

---- 2 / 4 ----
배포 할 네트워크 : localhost
Addresses 계정 : 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
PAC Token 계정 : 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
배포 할 컨트랙트 : Percentage
배포 할 컨트랙트 : EmergencyStop
배포 할 컨트랙트 : MultiTransfer

---- 3 / 4 ----
정말 컨트랙트를 배포 하시겠습니까? (Y/N)
입력 : yy

확인 : y

---- 4 / 4 ----
5초 전
4초 전
3초 전
2초 전
1초 전

WrapAddresses 컨트랙트 갱신 완료

배포된 Percentage 컨트랙트 주소 : 0x610178dA211FEF7D417bC0e6FeD39F05609AD788
배포된 EmergencyStop 컨트랙트 주소 : 0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e
배포된 MultiTransfer 컨트랙트 주소 : 0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0

배포 완료.
```

### 6. Uniswap v2 Factory 배포

> UsePAY 내부에서 토큰 교환에 사용하는 스왑 프로토콜인 UniSwap v2의 Factory를 배포합니다.
> 최고 관리자 계정 주소가 필요합니다. 

```shell
$ yarn deploy uniswap localhost 1

Deploying UniswapV2 UniswapV2Factory
===============================

---- 1 / 4 ----
매니저 계정 주소를 입력해주세요. (기본값: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
입력 : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
확인 : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

---- 2 / 4----
배포 할 네트워크 : localhost
배포 할 컨트랙트 : UniswapV2Factory
컨트랙트 매니저 계정 : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

---- 3 / 4 ----
정말 컨트랙트를 배포 하시겠습니까? (Y/N)
입력 : y
확인 : y

---- 4 / 4 ----
5초 전
4초 전
3초 전
2초 전
1초 전

배포된 컨트랙트 주소 : 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82

배포 완료.
```

### 7. Uniswap v2 Router 배포

> sePAY 내부에서 토큰 교환에 사용하는 스왑 프로토콜인 UniSwap v2의 Router를 배포합니다.
> 배포 대상의 네트워크에 존재하는 Wrapped Native Token 토큰의 컨트랙트 주소와 앞서 배포된 Uniswap Factory의 주소가 필요합니다. 

> 배포 과정에서 Factory를 배포하면서 `생성된 해시 코드`를 Router 컨트랙트 내부의 변수에 `하드 코딩`한 후, 배포됩니다. 

```shell
$ yarn deploy uniswap localhost 2

Deploying UniswapV2 UniswapRouter
===============================

---- 1 / 4 ----
배포된 UniswapV2Factory 컨트랙트의 주소를 입력해주세요.
입력 : 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82
확인 : 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82

---- 2 / 4 ----
Wrapped Native Token의 배포 주소를 입력해주세요.
입력 : 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

---- 2 / 4----
배포 할 네트워크 : localhost
배포 할 컨트랙트 : UniswapV2Router02
연결 할 UniswapV2Factory 컨트랙트 주소 : 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82
연결 할 Wrapped Token 의 컨트랙트 주소 : 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
수정 할 UniswapV2Factory 의 Init code hash : de1982b878d41a9a756f002d8c7e375fb0b3af8703fdc38b53be6486dca69f4a

---- 3 / 4 ----
정말 컨트랙트를 배포 하시겠습니까? (Y/N)
입력 : y
확인 : y

---- 4 / 4 ----
5초 전
4초 전
3초 전
2초 전
1초 전

Init code hash 수정.
배포된 컨트랙트 주소 : 0x9A676e781A523b5d0C0e43731313A708CB607508

배포 완료.
```

### 8. Uniswap v2 토큰 쌍 (유동성 풀) 생성

> UsePAY 거버넌스 토큰과 네이티브 토큰간의 스왑을 위한 유동성 풀을 생성합니다. 

```shell
$ yarn deploy uniswap localhost 3

Creating new token pair on UniswapV2
===============================

---- 1 / 6 ----
배포된 UniswapV2Factory 컨트랙트의 주소를 입력해주세요.
입력 : 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
확인 : 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707

---- 2 / 6 ----
첫번째 토큰 주소를 입력해주세요.
입력 : 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9

---- 3 / 6 ----
두번째 토큰 주소를 입력해주세요.
입력 : 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

---- 4 / 6 ----
배포 할 네트워크 : localhost
배포 할 컨트랙트 : UniswapV2Factory
첫번째 주소 : 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
두번째 주소 : 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

---- 5 / 6 ----
페어를 생성 하시겠습니까? (Y/N)
입력 : y
확인 : y

---- 6 / 6 ----
5초 전
4초 전
3초 전
2초 전
1초 전

배포된 페어 컨트랙트 주소 : 0x502e6dF5CcCe52cBdC489b76E301b519DBe0a001

완료.
```

### 9. Uniswap v2 토큰 쌍 (유동성 풀) 유동성 공급

> 생성된 유동성 풀에 토큰 유동성을 추가합니다. 

```shell
$ yarn deploy uniswap localhost 4

Add liquidity on UniswapV2
===============================

---- 1 / 7 ----
배포된 UniswapV2Pair 컨트랙트의 주소를 입력해주세요. (현재 값 : 0x8900394B1a2c5E4B8d60d4BA89925AEBc5dBbb82)
입력 : 0x8900394B1a2c5E4B8d60d4BA89925AEBc5dBbb82
확인 : 0x8900394B1a2c5E4B8d60d4BA89925AEBc5dBbb82

---- 2 / 7 ----
배포된 UniswapV2Router02 컨트랙트의 주소를 입력해주세요. (현재 값 : 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9)
입력 : 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
확인 : 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

---- 3 / 7 ----
배포된 ERC20PresetPauser 컨트랙트의 주소를 입력해주세요. (현재 값 : 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512)
입력 : 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
확인 : 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

---- 4 / 7 ----
ERC-20 토큰을 얼마나 추가하시겠습니까? (기본값 : 100 Token)
입력 : 100

---- 5 / 7 ----
Native 토큰을 얼마나 추가하시겠습니까? (기본값 : 1 Token)
입력 : 1

---- 현재 풀 상태 ----
{
  'Current Liquidity 0x5FbDB2315678afecb367f032d93F642f64180aa3 amount': 4,
  'Current Liquidity 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 amount': 400,
  'Account owned ERC-20 amount': 99999600,
  'Account owned Native token amount': 9995.981304556915,
  'ERC-20 amount will increase more': 100,
  'Native token amount will increase more': 1
}

---- 6 / 7 ----
이대로 유동성을 추가 공급 하시겠습니까? (Y/N)
입력 : y
확인 : y

---- 7 / 7 ----
5초 전
4초 전
3초 전
2초 전
1초 전

---- 최종 풀 상태 ----
{
  'Liquidity 0x5FbDB2315678afecb367f032d93F642f64180aa3 amount': 5,
  'Liquidity 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 amount': 500,
  'Account owned ERC-20 amount': 99999500,
  'Account owned Native token amount': 9994.981105797098
}

완료.
```

### 10. 배포된 컨트랙트 주소 설정하기

> 배포된 [로그 파일](./output/mumbai-history.log)을 참고하여 주소를 설정합니다.
> 특히 Datafeed의 경우 https://docs.chain.link/docs/data-feeds/price-feeds/addresses/ 를 참고합니다.

```shell
$ yarn deploy uniswap localhost 4

Set addresses
=============
Addresses 에 지정된 주소를 모두 할당해야 합니다. 
가장 최근에 배포된 Addresses 주소 : 0xDE38610B625dAd33625931ca7D61345660B35066

---- 1 / 6 ----
* Addresses 의 주소를 입력해주세요 
입력 : 
확인 : 0xDE38610B625dAd33625931ca7D61345660B35066

* 등록된 관리자 목록
[
  '0x72688356720A951b5d8B0A9498AF4D73b8e556d6',
  '0x20CBC351572507E0519c619ECD5E5D5059b9eF40'
]

* UsePAY 필수 주소 등록 현황
[  100] NATIVE_TOKEN         : 0x0000000000000000000000000000000000000000
[  101] WRAPPED_NATIVE_TOKEN : 0x0000000000000000000000000000000000000000
[  102] PAC_TOKEN            : 0x0000000000000000000000000000000000000000
[60000] UNISWAP_ROUTER       : 0x0000000000000000000000000000000000000000
[60001] UNISWAP_TOKEN_PAIR   : 0x0000000000000000000000000000000000000000
[60100] PERCENTAGE           : 0x0000000000000000000000000000000000000000
[60101] EMERGENCY_STOP       : 0x0000000000000000000000000000000000000000
[60102] MULTI_TRANSFER       : 0x0000000000000000000000000000000000000000
[61000] CHAINLINK_DATAFEED   : 0x0000000000000000000000000000000000000000
[62000] TICKET_COMMANDER     : 0x0000000000000000000000000000000000000000
[62001] COUPON_COMMANDER     : 0x0000000000000000000000000000000000000000
[62002] SUBSCR_COMMANDER     : 0x0000000000000000000000000000000000000000
[62003] TICKET_CREATOR       : 0x0000000000000000000000000000000000000000
[62004] COUPON_CREATOR       : 0x0000000000000000000000000000000000000000
[62005] SUBSCR_CREATOR       : 0x0000000000000000000000000000000000000000

---- 2 / 6 ----
* 총 2개의 매니저 계정으로부터 서명이 필요합니다.

1번 매니저 계정의 비밀키를 입력해주세요. 
입력 : ******************************************************************

2번 매니저 계정의 비밀키를 입력해주세요. 
입력 : ******************************************************************

---- 3 / 6 ----
* 설정할 인덱스와 주소를 추가해주세요. 추가가 완료되면 그냥 엔터를 입력해주세요.
예시) 5,0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

입력 : 102,0x3674B1B19b471D252F3EC4b805Ea0f5C6e046710

입력 : 

---- 4 / 6 ----
배포 할 네트워크 : mumbai
index : 102, address: 0x3674B1B19b471D252F3EC4b805Ea0f5C6e046710

---- 5 / 6 ----
정말 주소를 이대로 설정 하시겠습니까? (Y/N)
입력 : y
확인 : y

---- 6 / 6 ----
5초 전
4초 전
3초 전
2초 전
1초 전

매니저 0x72688356720A951b5d8B0A9498AF4D73b8e556d6 계정 승인. 1/2
매니저 0x20CBC351572507E0519c619ECD5E5D5059b9eF40 계정 승인. 2/2

실행 승인 완료.

실행 대기 3초 전
실행 대기 2초 전
실행 대기 1초 전

index: 101, address: 0x8602838Ef3f4974dC1feF31d84d0cA1C2EDb2AC2
done.

```
