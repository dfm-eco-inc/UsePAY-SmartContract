const util = require('./common/util');
const fs = require('fs');
const Prompt = require('prompt-checkbox');
const Web3 = require('web3');
const execSync = require('child_process').execSync;

/**
 * Storage 배포
 */
async function main() {
    console.clear();
    console.log('\nDeploying UsePAY Addresses');
    console.log('===============================');

    // 배포 설정 가져오기
    const deployNetwork = process.env.HARDHAT_NETWORK;
    const defaultAccount = await util.getDefaultAccount();
    const contractName = 'Addresses';
    const outputFilePath = `../output/${deployNetwork}-history.log`;
    const web3 = new Web3(ethers.provider.connection.url);

    // 배포할 컨트랙트 선택
    console.log('\n---- 1 / 6 ----');
    question = `다중 서명에 참여할 서명자 수를 입력해주세요 (최소 2명)`;
    const numSigners = (await util.userInput(question + '\n입력 :')) || 2;
    console.log(`확인 : ${numSigners}`);
    if (numSigners < 2) {
        console.log('서명자 수는 2 이상이어야 합니다');
        return false;
    }

    // 지연
    // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
    console.log('\n---- 2 / 6 ----');
    let addresses = [];
    while (true) {
        question = `관리자 계정을 추가 해주세요. (공백 입력으로 완료))`;
        const siner = (await util.userInput(question + '\n입력 :')) || '';
        console.log(`확인 : ${siner}`);

        if (web3.utils.isAddress(siner)) {
            addresses.push(siner);
            addresses = [...new Set(addresses)];
        } else {
            if (siner == '' && addresses.length >= numSigners) {
                break;
            } else {
                console.log('유효한 계정이 아닙니다\n');
            }
        }
    }

    // 실행 지연 시간
    console.log('\n---- 3 / 6 ----');
    question = `서명 완료후 실행 지연 시간을 입력해주세요. (최소 3초)`;
    const deplaySeconds = (await util.userInput(question + '\n입력 :')) || 3;
    console.log(`확인 : ${deplaySeconds}`);
    if (deplaySeconds < 3) {
        console.log('최소 실행 지연시간은 3초 입니다');
        return false;
    }

    // 배포 설정 정보 확인
    console.log('\n---- 4 / 6 ----');
    console.log(`배포 할 네트워크 : ${deployNetwork}`);
    console.log(`배포 할 컨트랙트 : ${contractName}`);
    console.log(`다중 서명 참여자 수 : ${numSigners}`);
    console.log(`등록할 관리자 계정 : ${addresses.join(', ')}`);

    // 배포 여부 확인
    console.log('\n---- 5 / 6 ----');
    question = `정말 컨트랙트를 배포 하시겠습니까? (Y/N)`;
    const isContinue = (await util.userInput(question + '\n입력 :')) || 'N';
    console.log(`확인 : ${isContinue}`);
    if (isContinue.toUpperCase() != 'Y') {
        console.log('\n배포를 중단합니다.');
        return;
    }

    // 지연
    console.log('\n---- 6 / 6 ----');
    for (let i = 5; i > 0; i--) {
        console.log(`${i}초 전`);
        await util.sleep(1000);
    }

    // Core Factory 배포
    const address = await util.deploy(contractName, addresses, numSigners, deplaySeconds);
    console.log(`배포된 ${contractName} 컨트랙트 주소 : ${address} `);

    // addresses 주소 하드코딩
    const filePath = './contracts/UsePAY/Storage/WrapAddresses.sol';
    let text = (await fs.readFileSync(filePath, 'utf-8')).split('\n');
    text[7] = `    address internal ADR_ADDRESSES = ${address};`;
    await fs.writeFileSync(filePath, text.join('\n'));
    execSync('npx hardhat compile', { stdio: 'pipe' });
    console.log('WrapAddresses 컨트랙트 갱신 완료');

    // 배포 기록 추가
    const output = {
        updated: new Date(),
        deployNetwork,
        contractName,
        address,
        numOfSigners: numSigners,
        unlockDelaySeconds: deplaySeconds,
        managerAccounts: addresses.join(', ')
    };
    await util.appendJsonFile(outputFilePath, output);

    // 완료
    console.log(`\n배포 완료.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
