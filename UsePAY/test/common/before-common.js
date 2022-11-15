const { ethers } = require('hardhat');
const helpers = require('@nomicfoundation/hardhat-network-helpers');
const { sleep } = require('../../deploy/common/util');
const { deploy } = require('./util');
const { MANAGERS, ADDRESSES } = require('./constants');
const execSync = require('child_process').execSync;
const Web3 = require('web3');
const fs = require('fs');

const emptyAddress = '0x0000000000000000000000000000000000000000';
const defaultSigner = new ethers.Wallet(MANAGERS[0].privateKey, ethers.provider);
const deployInfoFile = './localnet.addresses.txt';
const mintAmount = 1000000000; // 거버넌스토큰 민팅량
const wtokenAmount = 1000; // 네이티브 토큰 유동성 추가량
const govTokenAmount = wtokenAmount * 100; // 거버넌스 토큰 유동성 추가량 (Native의 100배)
let addressesTargets = [];
const paramManagers = [MANAGERS[0].address, MANAGERS[1].address, MANAGERS[2].address];
const confirmCount = 2;
const unlockTime = 60 * 60 * 24 // 24 hours

/**
 * 공통 테스트 환경 배포 코드
 *      deployInfoFile이 있으면 공통 배포 코드가 이미 배포된 것으로 간주하고, 기존 배포 정보를 불러와 리턴합니다. 
 *      만약 없으면 신규배포 하고 정보를 리턴합니다. 
 * @returns 
 */
async function beforeCommon() {
    let exists = false;
    let addressesTargets = [];
    
    // 배포 흔적이 있는 경우 검증합니다.
    if (await fs.existsSync(deployInfoFile)) {
        const address = await fs.readFileSync(deployInfoFile, 'utf-8');

        if (Web3.utils.isAddress(address)) {
            try {
                this.Addresses = (await ethers.getContractFactory('Addresses')).attach(address);
                exists = this.Addresses.address != emptyAddress; 

                this.wrappedToken = (await ethers.getContractFactory('WETH')).attach(
                    await this.Addresses.viewAddress(ADDRESSES.WRAPPED_NATIVE_TOKEN)
                );
                exists = exists && this.wrappedToken.address != emptyAddress; 

                this.govToken = (await ethers.getContractFactory('ERC20PresetPauser')).attach(
                    await this.Addresses.viewAddress(ADDRESSES.PAC_TOKEN)
                );
                exists = exists && this.govToken.address != emptyAddress; 

                this.EmergencyStop = (await ethers.getContractFactory('EmergencyStop')).attach(
                    await this.Addresses.viewAddress(ADDRESSES.EMERGENCY_STOP)
                );
                exists = exists && this.EmergencyStop.address != emptyAddress; 
            } catch (e) {
                exists = false;
            }

            if (exists) {
                addressesTargets.push([ADDRESSES.UNISWAP_ROUTER, this.Addresses.viewAddress(ADDRESSES.UNISWAP_ROUTER)]);
                addressesTargets.push([ADDRESSES.UNISWAP_TOKEN_PAIR, this.Addresses.viewAddress(ADDRESSES.UNISWAP_TOKEN_PAIR)]);
                for(let i=0; i<addressesTargets.length; i++) {
                    exists = addressesTargets.at(i)[1] != emptyAddress;
                    if (!exists) break;
                }
            }
        }
    }

    // 신규 배포거나 기존 배포검증이 실패한경우 새로 배포하고, 그렇지 않으면 기존 정보를 리턴합니다.
    if (!exists){
        return await deployDefaultContracts();
    } else {
        const { govToken, wrappedToken, Addresses, EmergencyStop } = this;
        return { EmergencyStop, unlockTime, confirmCount, govToken, defaultSigner, wrappedToken, Addresses, addressesTargets };
    }
}

async function deployDefaultContracts() {
    // Governance token 생성 및 기본 계정에 토큰 전송
    this.govToken = await deploy('ERC20PresetPauser', [
        'USEPAY.IO',
        'PAC',
        Web3.utils.toWei(mintAmount.toString(), 'ether')
    ]);
    await this.govToken.transfer(defaultSigner.address, Web3.utils.toWei(govTokenAmount.toString(), 'ether'));
    addressesTargets.push([ADDRESSES.PAC_TOKEN, this.govToken.address]);
    console.log(`    - 거버넌스 토큰 배포 (민팅량: ${mintAmount})`);

    // Native token wrapper 생성
    let text = await fs.readFileSync('./contracts/WrappedToken/WrappedTokenTemplate.sol', 'utf-8');
    text = text.replaceAll('TOKEN_NAME', 'Wrapped ETH');
    text = text.replaceAll('TOKEN_SYMBOL', 'WETH');
    await fs.writeFileSync(`./contracts/WrappedToken/WETH.sol`, text);
    result = execSync('npx hardhat compile');
    this.wrappedToken = await deploy('WETH');
    addressesTargets.push([ADDRESSES.WRAPPED_NATIVE_TOKEN, this.wrappedToken.address]);
    console.log('    - 래핑된 네이티브 토큰 배포');

    // Uniswap 배포 및 토큰 페어 생성
    console.log('    - 유니스왑 배포 시작');
    let cmd = `cd ../Uniswap; yarn --silent deploy localhost 10 ${defaultSigner.address} ${this.wrappedToken.address} ${this.govToken.address}`;
    let cmdOutput = execSync(cmd).toString();
    let cmdOutputArr = cmdOutput.split('\n');
    this.tokenPairAddress = cmdOutputArr.at(-3).trim();
    this.routerAddress = cmdOutputArr.at(-2).trim();
    addressesTargets.push([ADDRESSES.UNISWAP_ROUTER, this.routerAddress]);
    addressesTargets.push([ADDRESSES.UNISWAP_TOKEN_PAIR, this.tokenPairAddress]);
    console.log(`    ${cmdOutput.trim()}`);
    console.log('    - 유니스왑 배포 완료');

    // Uniswap 유동성 추가
    await this.govToken.approve(this.routerAddress, Web3.utils.toWei(govTokenAmount.toString(), 'ether'));
    cmd = `cd ../Uniswap; yarn --silent deploy localhost 11 ${defaultSigner.address} ${this.routerAddress} ${this.govToken.address} ${wtokenAmount} ${govTokenAmount} ${this.tokenPairAddress}`;
    cmdOutput = execSync(cmd).toString();
    cmdOutputArr = cmdOutput.split('\n');
    const addLiquidityResult = cmdOutputArr.at(-2).trim() == 'success';
    if (!addLiquidityResult) {
        console.log('    - 유동성 풀에 자금 추가 실패');
        process.exit(-1);
    } else {
        console.log('    - 유동성 풀에 자금 추가 완료');
    }

    // Addresses 배포
    this.Addresses = await deploy('Addresses', [paramManagers, confirmCount, unlockTime]);
    await fs.writeFileSync(deployInfoFile, this.Addresses.address, 'utf-8');
    console.log('    - Addresses 배포');

    // Addresses 배포주소 하드코딩
    const filePath = './contracts/UsePAY/Storage/WrapAddresses.sol';
    text = (await fs.readFileSync(filePath, 'utf-8')).split('\n');
    text[7] = `    address internal ADR_ADDRESSES = ${this.Addresses.address};`;
    await fs.writeFileSync(filePath, text.join('\n'));
    execSync('npx hardhat compile', { stdio: 'pipe' });
    console.log('    - WrapAddresses 컨트랙트 갱신');

    // EmergencyStop 배포
    this.EmergencyStop = await deploy('EmergencyStop');
    addressesTargets.push([ADDRESSES.EMERGENCY_STOP, this.EmergencyStop.address]);
    console.log('    - EmergencyStop 배포');

    // Percentage 배포
    this.Percentage = await deploy('Percentage');
    addressesTargets.push([ADDRESSES.PERCENTAGE, this.Percentage.address]);
    console.log('    - Percentage 배포');

    // 리턴
    const { govToken, wrappedToken, Addresses, Percentage, EmergencyStop } = this;
    return { unlockTime, confirmCount, govToken, defaultSigner, wrappedToken, Addresses, EmergencyStop, addressesTargets };
}

async function setAddresses(Addresses, addressesTargets, confirmCount, unlockTime) {
    console.log('    - 배포된 컨트랙트 주소 설정 시작');
    const addresses = await Addresses.attach(Addresses.address);

    for (let i = 0; i < confirmCount; i++) {
        const wallet = new ethers.Wallet(MANAGERS[i].privateKey, ethers.provider);
        const signer = await addresses.connect(wallet);
        if (i == 0) {
            await signer.startSetAddresses(
                addressesTargets.map((v) => v[0]),
                addressesTargets.map((v) => v[1])
            );
        } else {
            await signer.confirmSetAddresses();
        }
    }

    // 24시간 후로 강제 이동
    let currentBlockTime = await helpers.time.latest();
    currentBlockTime += unlockTime + 10;
    await ethers.provider.send('evm_setNextBlockTimestamp', [currentBlockTime]);

    await Addresses.launchSetAddresses();
    
    console.log('    - 배포된 컨트랙트 주소 설정 완료');
}

async function toggleContractStop(EmergencyStop, confirmCount, toBe) {
    const emergencyStop = await EmergencyStop.attach(EmergencyStop.address);
    const currentStatus = await emergencyStop.getContractStopped();

    if (currentStatus == toBe) {
        console.log(`    - EmergencyStop ${toBe ? '잠금' : '잠금해제'} 완료`);
        return;
    }

    for (let i = 0; i < confirmCount; i++) {
        const wallet = new ethers.Wallet(MANAGERS[i].privateKey, ethers.provider);
        const signer = await emergencyStop.connect(wallet);
        if (i == 0) {
            await signer.toggleContractStopped();
        } else {
            await signer.confirmToggleContractStopped();
        }
    }

    for (let i = 0; i < unlockTime; i++) {
        await sleep(1000);
        console.log(`      Launch the setAddress() method after ${unlockTime - i} sec.`);
        if (await emergencyStop.getContractStopped() != currentStatus) break;
    }

    console.log(`    - EmergencyStop ${toBe ? '잠금' : '잠금해제'} 완료`);
}

module.exports = { beforeCommon, setAddresses, toggleContractStop };