const util = require('./common/util');
const fs = require('fs');
const Web3 = require('web3');

/**
 * ERC20 Token 배포
 */
async function main() {
    console.clear();
    console.log('\nDeploying ERC-20 Token');
    console.log('===============================');

    // 배포 설정 가져오기
    const deployNetwork = process.env.HARDHAT_NETWORK;
    const defaultAccount = await util.getDefaultAccount();
    const outputFilePath = `../output/${deployNetwork}-history.log`;
    let contractName = 'ERC20PresetMinterPauser';

    // 토큰 이름
    console.log('\n---- 1 / 7 ----');
    let question = `생성할 Token 의 이름을 입력해주세요. (기본값: USEPAY.IO)`;
    const tokenName = (await util.userInput(question + '\n입력 :')) || 'USEPAY.IO';
    if (tokenName == '') return;

    // 토큰 심볼
    console.log('\n---- 2 / 7 ----');
    question = `생성할 Wrapped Native Token 의 심볼을 입력해주세요. (기본값: PAC)`;
    const tokenSymbol = (await util.userInput(question + '\n입력 :')) || 'PAC';
    if (tokenSymbol == '') return;

    // 발행 량
    console.log('\n---- 3 / 7 ----');
    question = `토큰 발행량을 입력해주세요. (기본값 : 1억개, 100,000,000)`;
    let mintAmount = parseInt(await util.userInput(question + '\n입력 :')) || 100000000;

    // 추가 민팅 여부
    console.log('\n---- 4 / 7 ----');
    question = `추가 민팅을 허용하시겠습니까? (Y/N)`;
    const allowMint = ((await util.userInput(question + '\n입력 :')).toUpperCase() || 'N') == 'Y';
    if (!allowMint) contractName = 'ERC20PresetPauser';

    // 배포 설정 정보 확인
    console.log('\n---- 5/ 7 ----');
    console.log(`배포 할 네트워크 : ${deployNetwork}`);
    console.log(`배포 할 컨트랙트 : ${contractName}`);
    console.log(`토큰 이름 : ${tokenName}`);
    console.log(`토큰 심볼 : ${tokenSymbol}`);
    console.log(`추가 민팅 : ${allowMint ? '가능' : '불가능'}`);
    console.log(`발행 수량 : ${mintAmount}`);

    // 배포 여부 확인
    console.log('\n---- 6 / 7 ----');
    question = `이대로 ERC-20 토큰을 배포 하시겠습니까? (Y/N)`;
    const isContinue = (await util.userInput(question + '\n입력 :')) || 'N';
    console.log(`확인 : ${isContinue}`);
    if (isContinue.toUpperCase() != 'Y') {
        console.log('\n배포를 중단합니다.');
        return;
    }

    // 지연
    console.log('\n---- 7 / 7 ----');
    for (let i = 5; i > 0; i--) {
        console.log(`${i}초 전`);
        await util.sleep(1000);
    }

    // ERC-20 Token 배포
    mintAmount = Web3.utils.toWei(mintAmount.toString(), 'ether');
    
    let address;
    if (allowMint) {
        address = await util.deploy(contractName, tokenName, tokenSymbol);
        const Contract = await ethers.getContractFactory(contractName);
        const contract = await Contract.attach(address);
        // 민팅
        await contract.mint(defaultAccount, mintAmount);
    } else {
        address = await util.deploy(contractName, tokenName, tokenSymbol, mintAmount);
    }
    console.log(`배포된 Token 주소 : ${address}`);

    // 배포 기록 추가
    const output = { updated: new Date(), deployNetwork, contractName, tokenName, tokenSymbol, address };
    await util.appendJsonFile(outputFilePath, output);

    // 완료
    console.log(`\n배포 완료.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
