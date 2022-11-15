const util = require("../../UsePAY/deploy/common/util");
const keccak256 = require("keccak256");
const Web3 = require('web3');

/**
 * Uniswap V2 Core Factory 배포
 */
async function main() {
    console.clear();
    console.log('\nDeploying UniswapV2 UniswapV2Factory');
    console.log('===============================');

    // 배포 설정 가져오기
    const deployNetwork = process.env.HARDHAT_NETWORK;
    const defaultAccount = await util.getDefaultAccount();
    const contractName = 'UniswapV2Factory';
    const outputFilePath = `../output/${deployNetwork}-history.log`;
    const web3 = new Web3(ethers.provider.connection.url);

    // 매니저 계정 입력 받기
    console.log('\n---- 1 / 4 ----');
    let question = `매니저 계정 주소를 입력해주세요. (기본값: ${defaultAccount})`;
    const managerAddress = (await util.userInput(question + '\n입력 :')) || defaultAccount;
    console.log(`확인 : ${managerAddress}`);
    if (!web3.utils.isAddress(managerAddress)) {
        console.log('유효한 주소가 아닙니다');
        return false;
    }

    // 배포 정보 확인
    console.log('\n---- 2 / 4----');
    console.log(`배포 할 네트워크 : ${deployNetwork}`);
    console.log(`배포 할 컨트랙트 : ${contractName}`);
    console.log(`컨트랙트 매니저 계정 : ${managerAddress}`);

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

    // Core Factory 배포
    const address = await util.deploy(contractName, managerAddress);
    console.log(`\n배포된 컨트랙트 주소 : ${address} `);

    // 배포 기록 추가
    const output = { updated: new Date(), deployNetwork, contractName, address };
    await util.appendJsonFile(outputFilePath, output);

    // 완료
    console.log(`\n배포 완료.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});