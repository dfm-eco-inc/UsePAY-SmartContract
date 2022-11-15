const util = require('../../UsePAY/deploy/common/util');
const keccak256 = require('keccak256');
const { ethers } = require('hardhat');
const Web3 = require('web3');
const fs = require('fs');

/**
 * Uniswap V2 Token pair 생성
 */
async function main() {
    console.clear();
    console.log('\Creating new token pair on UniswapV2');
    console.log('===============================');

    // 배포 설정 가져오기
    const deployNetwork = process.env.HARDHAT_NETWORK;
    const defaultAccount = await util.getDefaultAccount();
    const contractName = 'UniswapV2Factory';
    const UniswapV2Factory = await ethers.getContractFactory(contractName);
    const outputFilePath = `../output/${deployNetwork}-history.log`;
    const web3 = new Web3(ethers.provider.connection.url);
    let lastFactoryAddress = await util.getLastDeployedContractAddress(deployNetwork, contractName);

    // UniswapV2Factory 주소 입력
    console.log('\n---- 1 / 6 ----');
    let isValidAddress = false;
    let question = `배포된 UniswapV2Factory 컨트랙트의 주소를 입력해주세요. (현재값 : ${lastFactoryAddress})`;
    const uniswapV2FactoryAddress = (await util.userInput(question + '\n입력 :')) || lastFactoryAddress;
    if (uniswapV2FactoryAddress == '') return;
    console.log(`확인 : ${uniswapV2FactoryAddress}`);
    if (!web3.utils.isAddress(uniswapV2FactoryAddress)) {
        console.log('유효한 주소가 아닙니다');
        return false;
    }
    const factory = await UniswapV2Factory.attach(uniswapV2FactoryAddress);

    // 첫번째 토큰 주소 
    console.log('\n---- 2 / 6 ----');
    question = `첫번째 토큰 주소를 입력해주세요.`;
    const firstTokenAddr = await util.userInput(question + '\n입력 :');
    if (firstTokenAddr == '') return;

    console.log('\n---- 3 / 6 ----');
    question = `두번째 토큰 주소를 입력해주세요.`;
    const secondTokenAddr = await util.userInput(question + '\n입력 :');
    if (secondTokenAddr == '') return;
    
    // 배포 설정 정보 확인
    console.log('\n---- 4 / 6 ----');
    console.log(`배포 할 네트워크 : ${deployNetwork}`);
    console.log(`배포 할 컨트랙트 : ${contractName}`);
    console.log(`첫번째 주소 : ${firstTokenAddr}`);
    console.log(`두번째 주소 : ${secondTokenAddr}`);
  
    // 배포 여부 확인
    console.log('\n---- 5 / 6 ----');
    question = `페어를 생성 하시겠습니까? (Y/N)`;
    const isContinue = (await util.userInput(question + '\n입력 :')) || 'N';
    console.log(`확인 : ${isContinue}`);
    if (isContinue.toUpperCase() != 'Y') {
        console.log('\n중단합니다.');
        return;
    }

    // 지연
    console.log('\n---- 6 / 6 ----');
    for (let i = 5; i > 0; i--) {
        console.log(`${i}초 전`);
        await util.sleep(1000);
    }

    // 페어 생성 및 가져오기
    let address = '';
    let exists = false;
    const pairAddress = await factory.getPair(firstTokenAddr, secondTokenAddr);

    if (web3.utils.isAddress(pairAddress) && pairAddress != '0x0000000000000000000000000000000000000000') {
        address = pairAddress;
        console.log(`\n이미 생성된 페어 컨트랙트 주소 : ${address} `);
        exists = true;
    } else {
        const tx = await factory.createPair(firstTokenAddr, secondTokenAddr);
        const rc = await tx.wait();
        const event = rc.events.find((event) => event.event === 'PairCreated');
        address = event.args[2];
        console.log(`\n배포된 페어 컨트랙트 주소 : ${address} `);
        exists = false;
    }

    // 기록 추가
    const output = {
        updated: new Date(),
        deployNetwork,
        contractName: 'UniswapV2Pair',
        exists,
        address,
        factoryAddress: uniswapV2FactoryAddress,
        firstTokenAddr,
        secondTokenAddr
    };
    await util.appendJsonFile(outputFilePath, output);

    // 완료
    console.log(`\n완료.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
