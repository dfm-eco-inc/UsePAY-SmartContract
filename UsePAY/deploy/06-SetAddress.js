const execSync = require('child_process').execSync;
const Prompt = require('prompt-checkbox');
const util = require('./common/util');
const Web3 = require('web3');
const fs = require('fs');

/**
 * Commanders 배포
 */
async function main() {
    console.clear();
    console.log('\nSet addresses');
    console.log('=============');

    console.log('Addresses 에 지정된 주소를 모두 할당해야 합니다. ');

    // 최근 배포된 Addresses 주소 가져오기
    const deployNetwork = process.env.HARDHAT_NETWORK;
    const defaultAccount = await util.getDefaultAccount();
    const outputFilePath = `../output/${deployNetwork}-history.log`;
    const web3 = new Web3(ethers.provider.connection.url);
    let addressesAddress = await util.getLastDeployedContractAddress(deployNetwork, 'Addresses');
    console.log(`가장 최근에 배포된 Addresses 주소 : ${addressesAddress}`);

    // Addresses의 주소를 설정
    console.log('\n---- 1 / 6 ----');
    question = `* Addresses 의 주소를 입력해주세요 `;
    const address = (await util.userInput(question + '\n입력 :')) || addressesAddress;
    console.log(`확인 : ${address}`);
    if (!web3.utils.isAddress(address)) {
        console.log('유효한 주소가 아닙니다');
        return false;
    }

    // Addresses 연결
    const Addresses = await ethers.getContractFactory('Addresses');
    const addresses = await Addresses.attach(address);
    const numOfConfirmation = parseInt(await addresses.viewNumOfConfirmation());
    const confirmStatus = await addresses.viewConfirmSetAddressStatus();
    const unlockSeconds = parseInt(await addresses.viewUnlockSeconds());

    // 등록된 매니저 목록
    let registeredManagers = [];
    for (let i = 0; i < 100; i++) registeredManagers.push(await addresses.viewAddress(i));
    registeredManagers = [...new Set(registeredManagers)];
    var index = registeredManagers.indexOf('0x0000000000000000000000000000000000000000');
    registeredManagers.splice(index, 1);

    console.log('\n* 등록된 관리자 목록');
    console.log(registeredManagers);

    console.log('\n* UsePAY 필수 주소 등록 현황');
    const essentialAddresses = {
        NATIVE_TOKEN: 100,
        WRAPPED_NATIVE_TOKEN: 101,
        PAC_TOKEN: 102,
        UNISWAP_ROUTER: 60000,
        UNISWAP_TOKEN_PAIR: 60001,
        PERCENTAGE: 60100,
        EMERGENCY_STOP: 60101,
        MULTI_TRANSFER: 60102,
        CHAINLINK_DATAFEED: 61000,
        TICKET_COMMANDER: 62000,
        COUPON_COMMANDER: 62001,
        SUBSCR_COMMANDER: 62002,
        TICKET_CREATOR: 62003,
        COUPON_CREATOR: 62004,
        SUBSCR_CREATOR: 62005
    };

    const keys = Object.keys(essentialAddresses);
    const values = Object.values(essentialAddresses);
    for (let i = 0; i < keys.length; i++) {
        console.log(
            `[${values[i].toString().padStart(5)}] ${keys[i].padEnd(20)} : ${await addresses.viewAddress(values[i])}`
        );
    }
    // 매니저 계정 입력
    console.log('\n---- 2 / 6 ----');
    console.log(`* 총 ${numOfConfirmation}개의 매니저 계정으로부터 서명이 필요합니다.`);
    let managers = [];
    for (i = 0; i < numOfConfirmation; ) {
        const privateKey = await util.userInput(
            `\n${i + 1}번 매니저 계정의 비밀키를 입력해주세요. \n입력 :`,
            false,
            true
        );
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        if (registeredManagers.indexOf(account.address) == -1) {
            console.log('등록된 매니저 계정이 아닙니다.');
            continue;
        } else {
            managers.push(account);
            managers = [...new Set(managers)];
            i = managers.length;
        }
    }

    // 이미 진행중인 경우
    if (parseInt(confirmStatus.count) != 0) {
        console.log(`\n이미 진행중인 건이 있습니다.`);

        // 만약 입력하지 않은 관리자 계정이 승인한 경우, 모든 취소를 위해 해당 관리자 계정으로 취소해야 함.
        // 어떤 계정이 승인되었는지는 confirmStatus 변수 참조 필요.
        question = `\n* 입력하신 관리자 계정이 승인한 건을 모두 취소하고 진행 하시겠습니까? (Y/N)`;
        const isContinue = (await util.userInput(question + '\n입력 :')) || 'N';
        console.log(`확인 : ${isContinue}`);
        if (isContinue.toUpperCase() != 'Y') {
            console.log('\n중단합니다.');
            return;
        }

        // 모두 취소
        for (let i = 0; i < numOfConfirmation; i++) {
            const wallet = new ethers.Wallet(managers[i].privateKey, ethers.provider);
            const asSigner = await addresses.connect(wallet);
            try {
                await asSigner.cancelSetAddresses();
            } catch (e) {}
        }
    }

    // 설정할 주소 목록 입력 받기
    let targets = [];
    console.log('\n---- 3 / 6 ----');
    console.log(
        `* 설정할 인덱스와 주소를 추가해주세요. 추가가 완료되면 그냥 엔터를 입력해주세요.\n예시) 5,0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
    );
    while (true) {
        let input = await util.userInput('\n입력 :');
        if (input.trim() == '') break;
        input = input.replaceAll(' ', '');

        const arr = input.split(',');
        const isOK = arr.length == 2 && arr[0] > 0 && web3.utils.isAddress(arr[1]);
        if (!isOK) {
            console.log('입력 형식이 잘못되었습니다.');
            continue;
        }
        targets.push(input);
    }
    targets = [...new Set(targets)];

    // 설정할 주소 대상 점검
    if (targets.length == 0) {
        console.log('적용 대상이 없습니다.');
        return;
    }

    // 설정 대상 확인
    console.log('\n---- 4 / 6 ----');
    console.log(`배포 할 네트워크 : ${deployNetwork}`);
    let paramIndex = [];
    let paramAddress = [];
    for (let i = 0; i < targets.length; i++) {
        const arr = targets[i].split(',');
        paramIndex.push(parseInt(arr[0]));
        paramAddress.push(arr[1]);
        console.log(`index : ${arr[0]}, address: ${arr[1]}`);
    }

    console.log('\n---- 5 / 6 ----');
    question = `정말 주소를 이대로 설정 하시겠습니까? (Y/N)`;
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

    // 멀티 사이닝
    console.log();
    for (let i = 0; i < numOfConfirmation; i++) {
        //  계정 변경이 되지 않음.
        const wallet = new ethers.Wallet(managers[i].privateKey, ethers.provider);
        const asSigner = await addresses.connect(wallet);

        try {
            tx = null;
            if (i == 0) tx = await asSigner.startSetAddresses(paramIndex, paramAddress);
            else tx = await asSigner.confirmSetAddresses();
            await tx.wait();
            console.log(`매니저 ${wallet.address} 계정 승인. ${i + 1}/${numOfConfirmation}`);
        } catch (e) {
            const reason = e.reason.toString();

            if (reason.indexOf('Already confirmed') > -1) {
                console.log(`${wallet.address}계정은 이미 승인처리 했습니다.`);
            }

            if (reason.indexOf('Already in progress') > -1) {
                console.log('먼저 처리 중인 변경이 있습니다.');
            } else {
                console.log(`error : ${reason}`);
            }

            return;
        }
    }

    // 최소 컨펌 확인
    const afterStatus = await addresses.viewConfirmSetAddressStatus();
    if (parseInt(afterStatus.count) < numOfConfirmation) {
        console.log('\n승인 처리가 완료되지 않았습니다.');
        return;
    }
    console.log('\n실행 승인 완료.');

    // 최종 사이닝후 언락킹 시간 존재.
    console.log();
    for (let i = unlockSeconds; i > 0; i--) {
        console.log(`실행 대기 ${i}초 전`);
        await util.sleep(1000);
    }

    // 실행
    tx = await addresses.launchSetAddresses();
    tx.wait();

    // 검증
    console.log();
    for (let i = 0; i < paramIndex.length; i++) {
        console.log(`index: ${paramIndex[i]}, address: ${await addresses.viewAddress(paramIndex[i])}`);
    }

    console.log('done.');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
