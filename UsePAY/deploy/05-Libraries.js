const util = require('./common/util');
const fs = require('fs');
const Prompt = require('prompt-checkbox');
const Web3 = require('web3');
const execSync = require('child_process').execSync;

/**
 * Commanders 배포
 */
async function main() {
    console.clear();
    console.log('\nDeploying UsePAY Libraries');
    console.log('===============================');

    // 배포 설정 가져오기
    const deployNetwork = process.env.HARDHAT_NETWORK;
    const defaultAccount = await util.getDefaultAccount();
    const outputFilePath = `../output/${deployNetwork}-history.log`;
    const web3 = new Web3(ethers.provider.connection.url);
    let addressesAddress = await util.getLastDeployedContractAddress(deployNetwork, 'Addresses');
    let tokenPACAddress = await util.getLastDeployedPACTokenAddress(deployNetwork, 'PAC');

    // 배포할 컨트랙트 선택
    console.log('\n---- 1 / 3----');
    const prompt = new Prompt({
        name: 'contracts',
        radio: true,
        message: '배포할 컨트랙트 선택 :',
        choices: ['Percentage', 'EmergencyStop', 'MultiTransfer']
    });
    const targets = await prompt.run();
    if (targets.length == 0) return;

    // Addresses 주소 확인
    if (targets.indexOf('EmergencyStop') > -1) {
        question = `\nEmergencyStop 컨트랙트에서 참조할 Addresses 의 주소를 입력해주세요 (현재 값 : ${addressesAddress})`;
        addressesAddress = (await util.userInput(question + '\n입력 :', false)) || addressesAddress;
        console.log(`확인 : ${addressesAddress}`);
        if (!web3.utils.isAddress(addressesAddress)) {
            console.log('유효한 주소가 아닙니다');
            return false;
        }
    }

    // MultiTransfer 거버넌스 토큰 주소 확인
    let govTokenAddress = '';
    if (targets.indexOf('MultiTransfer') > -1) {
        // 주소 입력
        question = `\nMultiTransfer 컨트랙트에서 참조할 UsePAY 의 거버넌스 토큰(PAC)의 주소를 입력해주세요. (현재 값: ${tokenPACAddress})`;
        govTokenAddress = await util.userInput(question + '\n입력 :', false, false) || tokenPACAddress;
        console.log(`확인 : ${govTokenAddress}`);
        if (!web3.utils.isAddress(govTokenAddress)) {
            console.log('유효한 주소가 아닙니다');
            return false;
        }
    }

    // 배포 설정 정보 확인
    console.log('\n---- 2 / 4 ----');
    console.log(`배포 할 네트워크 : ${deployNetwork}`);
    addressesAddress ? console.log(`Addresses 계정 : ${addressesAddress}`) : null;
    govTokenAddress ? console.log(`PAC Token 계정 : ${govTokenAddress}`) : null;
    for (let i = 0; i < targets.length; i++) {
        console.log(`배포 할 컨트랙트 : ${targets[i]}`);
    }

    console.log('\n---- 3 / 4 ----');
    question = `정말 컨트랙트를 배포 하시겠습니까? (Y/N)`;
    const isContinue = (await util.userInput(question + '\n입력 :', false)) || 'N';
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

    // addresses 주소 하드코딩
    const filePath = './contracts/UsePAY/Storage/WrapAddresses.sol';
    let text = (await fs.readFileSync(filePath, 'utf-8')).split('\n');
    text[7] = `    address internal immutable ADR_ADDRESSES = ${addressesAddress};`;
    await fs.writeFileSync(filePath, text.join('\n'));
    execSync('npx hardhat compile', { stdio: 'pipe' });
    console.log('\nWrapAddresses 컨트랙트 갱신 완료\n');


    // 배포
    for (let i = 0; i < targets.length; i++) {
        let address = '';
        if (targets[i] == 'MultiTransfer') {
            address = await util.deploy(targets[i], govTokenAddress);
        } else {
            address = await util.deploy(targets[i]);
        }

        const output = { updated: new Date(), deployNetwork, contractName: targets[i], address };
        console.log(`배포된 ${targets[i]} 컨트랙트 주소 : ${address}`);

        if (targets[i] == 'EmergencyStop') {
            output.addressesAddress = addressesAddress;
        } else if (targets[i] == 'MultiTransfer') {
            output.governanceTokenAddress = govTokenAddress;
        }

        await util.appendJsonFile(outputFilePath, output);
    }

    console.log(`\n배포 완료.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
