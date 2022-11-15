const util = require('../../UsePAY/deploy/common/util');
const keccak256 = require('keccak256');
const { ethers } = require('hardhat');
const Web3 = require('web3');
const fs = require('fs');

/**
 * Uniswap V2 Core Router 배포
 */
async function main() {
    console.clear();
    console.log('\nDeploying UniswapV2 UniswapRouter');
    console.log('===============================');

    // 배포 설정 가져오기
    const deployNetwork = process.env.HARDHAT_NETWORK;
    const defaultAccount = await util.getDefaultAccount();
    const contractName = 'UniswapV2Router02';
    const outputFilePath = `../output/${deployNetwork}-history.log`;
    const web3 = new Web3(ethers.provider.connection.url);

    // UniswapV2Factory 주소 입력
    let lastFactoryAddress = await util.getLastDeployedContractAddress(deployNetwork, 'UniswapV2Factory');

    console.log('\n---- 1 / 4 ----');
    let isValidAddress = false;
    let question = `배포된 UniswapV2Factory 컨트랙트의 주소를 입력해주세요. (현재값: ${lastFactoryAddress})`;
    const uniswapV2FactoryAddress = (await util.userInput(question + '\n입력 :')) || lastFactoryAddress;
    if (uniswapV2FactoryAddress == '') return;
    console.log(`확인 : ${uniswapV2FactoryAddress}`);
    if (!web3.utils.isAddress(uniswapV2FactoryAddress)) {
        console.log('유효한 주소가 아닙니다');
        return false;
    }

    // Factory Deployed init hash
    let uniswapV2FactoryInitCodeHash = '';
    try {
        const UniswapV2Factory = await ethers.getContractFactory('UniswapV2Factory');
        const factory = await UniswapV2Factory.attach(uniswapV2FactoryAddress);
        uniswapV2FactoryInitCodeHash = (await factory.INIT_CODE_HASH()).slice(2);
    } catch (e) {
        console.log('유효한 주소가 아닙니다');
        return false;
    }

    // Wrapped Token 설정 (기존 토큰 / 신규 토큰)
    console.log('\n---- 2 / 4 ----');
    question = `Wrapped Native Token의 배포 주소를 입력해주세요.`;
    const wtokenAddress = await util.userInput(question + '\n입력 :');
    if (wtokenAddress == '') return;

    // 배포 설정 정보 확인
    console.log('\n---- 2 / 4----');
    console.log(`배포 할 네트워크 : ${deployNetwork}`);
    console.log(`배포 할 컨트랙트 : ${contractName}`);
    console.log(`연결 할 UniswapV2Factory 컨트랙트 주소 : ${uniswapV2FactoryAddress}`);
    console.log(`연결 할 Wrapped Token 의 컨트랙트 주소 : ${wtokenAddress}`);
    console.log(`수정 할 UniswapV2Factory 의 Init code hash : ${uniswapV2FactoryInitCodeHash}`);
  
    // 배포 여부 확인
    console.log('\n---- 3 / 4 ----');
    question = `정말 컨트랙트를 배포 하시겠습니까? (Y/N)`;
    const isContinue = (await util.userInput(question + '\n입력 :')) || 'N';
    console.log(`확인 : ${isContinue}`);
    if (isContinue.toUpperCase() != 'Y') {
        console.log('\n배포를 중단합니다.');
        return;
    }

    // 지연
    console.log('\n---- 4 / 4 ----');
    for (let i = 5; i > 0; i--) {
        console.log(`${i}초 전`);
        await util.sleep(1000);
    }

    // Router Contract 수정
    await util.modifyiUniswapPeripheryHex(uniswapV2FactoryInitCodeHash);
    console.log('\nInit code hash 수정.');

    // Core Factory 배포
    const address = await util.deploy(contractName, uniswapV2FactoryAddress, wtokenAddress);
    console.log(`배포된 컨트랙트 주소 : ${address} `);

    // 배포 기록 추가
    const output = {
        updated: new Date(),
        deployNetwork,
        contractName,
        address,
        wrappedTokenAddress: wtokenAddress,
        factoryAddress: uniswapV2FactoryAddress,
        factoryInitCodeHash: uniswapV2FactoryInitCodeHash
    };
    await util.appendJsonFile(outputFilePath, output);

    // 완료
    console.log(`\n배포 완료.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
