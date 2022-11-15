# UsePAY Solidity SmartContract

UsePAY 관련 컨트랙트를 컴파일하고 배포하는 프로젝트입니다.
UsePAY Smart Contract 와 Uniswap v2 Contract 를 빌드하고 배포합니다.


## 디렉토리 구조

```shell
.
├── README.md                               # 본 문서
├── Uniswap                                 # 유니스왑 v2 프로젝트
│   ├── LICENSE.md
│   ├── README.md
│   ├── contracts                           # 유니스왑 스마트컨트랙트 소스코드
│   ├── deploy                              # 유니스왑 배포 스크립트
│   ├── hardhat.config.js
│   ├── package.json
│   └── yarn.lock
├── UsePAY                                  # UsePAY 프로젝트
│   ├── LICENSE.md
│   ├── README.md
│   ├── contracts                           # UsePAY 스마트컨트랙트 소스코드
│   ├── deploy                              # UsePAY 배포 스크립트
│   ├── test                                # 컨트랙트 기능 테스트 스크립트
│   ├── hardhat.config.js
│   ├── package.json
│   └── yarn.lock
├── output                                  # 배포된 컨트랙트의 주소 정보가 저장되는 디렉토리
└── package.json                            # 전체 프로젝트의 컴파일/배포 스크립트
```

## 개발 환경

> Node.js 16.15.0

```shell
$ cd UsePAY; yarn 
$ cd ../Uniswap; yarn
```

## 기능 테스트
```shell
# 테스트 네트워크 실행
$ yarn localnet

# 전체 테스트
$ yarn test

# 개별 테스트
$ yarn test:coupon          # 쿠폰팩
$ yarn test:ticket          # 티켓팩
$ yarn test:subscription    # 구독팩
```

## 네트워크 추가

> 각 프로젝트별 `hardhat.config.js` 의 `module.exports` 코드의 `networks` 에 추가할 네트워크의 정보를 설정합니다.

```shell
bscTest: {
    url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    accounts: ['배포에 사용할 계정의 (매니저)의 비밀키']
}
```

## 배포 구조 및 방법

> 네트워크별 배포 기록은 `output/네트워크구분자-history.log` 파일로 저장됩니다.
> 명령어는 `yarn deploy 프로젝트명 네트워크구분자 배포번호` 구조로 되어 있습니다.

```shell
├── 01-WrappedToken.js          // 이 컨트랙트를 배포하려면 배포번호는 1번이 됩니다.
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

> 위 케이스의 경우 UsePAY 컨트랙트 1번이므로 명령어는 `yarn deploy usepay localhost 1` 을 실행합니다.

```shell
# 로컬 네트워크 실행
$ yarn localnet

# Wrapped token 배포
$ yarn deploy usepay localhost 1

# ABI 추출
$ yarn abi
```

### 신규 배포 가이드

전체 수동 배포는 [DEPLOYMENT.md](./DEPLOYMENT.md) 문서를 확인해주세요.

### ABI API 확인

- https://abi.hashex.org/