const { ethers } = require('hardhat');
const util = require('../../UsePAY/deploy/common/util');
const execSync = require('child_process').execSync;
const Web3 = require('web3');

/**
 * Uniswap V2 배포, UsePAY 테스트를 위한 배포 스크립트
 */
async function main() {
    const { MANAGER_ADDRESS } = process.env;                    // 매니저 주소
    const { WRAPPED_TOKEN_ADDRESS } = process.env;              // Wrapped native token 주소
    const { GOVERNANCE_TOKEN_ADDRESS } = process.env;           // 거버넌스 토큰 주소 (PAC)

    // 스왑 배포 (1/5) - 팩토리
    let uniswapFactory = await ethers.getContractFactory('UniswapV2Factory');
    uniswapFactory = await uniswapFactory.deploy(MANAGER_ADDRESS);
    uniswapFactory.deployed();
    const initHash = (await uniswapFactory.INIT_CODE_HASH()).slice(2);
    console.log('    - 스왑 배포 (1/3)');

    // 스왑 배포 (2/5) - 라우터에 해시코드 하드코딩
    await util.modifyiUniswapPeripheryHex(initHash);
    execSync('npx hardhat compile', { stdio: 'pipe' });
    console.log('    - 스왑 배포 (2/3)');

    // 스왑 배포 (3/5) - 라우터 배포
    let uniswapRouter = await ethers.getContractFactory('UniswapV2Router02');
    uniswapRouter = await uniswapRouter.deploy(uniswapFactory.address, WRAPPED_TOKEN_ADDRESS);
    await uniswapRouter.deployed();
    console.log('    - 스왑 배포 (3/3)');

    // 스왑 배포 (4/5) - 토큰 페어 등록
    uniswapFactory = await uniswapFactory.attach(uniswapFactory.address);
    let tx = await uniswapFactory.createPair(WRAPPED_TOKEN_ADDRESS, GOVERNANCE_TOKEN_ADDRESS);
    let rc = await tx.wait();
    let event = rc.events.find((event) => event.event === 'PairCreated');
    const pairAddress = event.args[2];
    console.log('    - 토큰 페어 생성');
    console.log(`      ${pairAddress}`);
    console.log(`      ${uniswapRouter.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
