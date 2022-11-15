const util = require('./common/util');
const fs = require('fs');
const execSync = require('child_process').execSync;

/**
 * Wrapped Token 배포
 */
async function main() {
    console.clear();
    console.log('\nDeploying Wrapped Token');
    console.log('===============================');

    // 배포 설정 가져오기
    const deployNetwork = process.env.HARDHAT_NETWORK;
    const defaultAccount = await util.getDefaultAccount();
    const outputFilePath = `../output/${deployNetwork}-history.log`;

    // 토큰 이름
    console.log('\n---- 1 / 5 ----');
    let question = `생성할 Wrapped Native Token 의 이름을 입력해주세요. (기본값: Wrapped Ether)`;
    const tokenName = (await util.userInput(question + '\n입력 :')) || 'Wrapped Ether';
    if (tokenName == '') return;

    // 토큰 심볼
    console.log('\n---- 2 / 5 ----');
    question = `생성할 Wrapped Native Token 의 심볼을 입력해주세요. (기본값: WETH)`;
    const tokenSymbol = (await util.userInput(question + '\n입력 :')) || 'WETH';
    if (tokenSymbol == '') return;

    // 배포 설정 정보 확인
    console.log('\n---- 3 / 5 ----');
    console.log(`배포 할 네트워크 : ${deployNetwork}`);
    console.log(`토큰 이름 : ${tokenName}`);
    console.log(`토큰 심볼 : ${tokenSymbol}`);

    // 배포 여부 확인
    console.log('\n---- 4 / 5 ----');
    question = `정말 컨트랙트를 배포 하시겠습니까? (Y/N)`;
    const isContinue = (await util.userInput(question + '\n입력 :')) || 'N';
    console.log(`확인 : ${isContinue}`);
    if (isContinue.toUpperCase() != 'Y') {
        console.log('\n배포를 중단합니다.');
        return;
    }

    // 지연
    console.log('\n---- 5 / 5 ----');
    for (let i = 5; i > 0; i--) {
        console.log(`${i}초 전`);
        await util.sleep(1000);
    }

    // Wrapped Token 컨트랙트 파일 생성
    let text = await fs.readFileSync('./contracts/WrappedToken/WrappedTokenTemplate.sol', 'utf-8');
    text = text.replaceAll('TOKEN_NAME', tokenName);
    text = text.replaceAll('TOKEN_SYMBOL', tokenSymbol);
    await fs.writeFileSync(`./contracts/WrappedToken/${tokenSymbol}.sol`, text);
    result = execSync('npx hardhat compile');

    // Wrapped Token 배포
    const address = await util.deploy(tokenSymbol);
    console.log(`배포된 Wrapped token 컨트랙트 주소 : ${address}`);

    // 배포 기록 추가
    const output = { updated: new Date(), deployNetwork, tokenName, tokenSymbol, address };
    await util.appendJsonFile(outputFilePath, output);

    // 완료
    console.log(`\n배포 완료.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
