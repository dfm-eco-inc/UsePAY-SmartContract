const { ethers } = require('hardhat');
const util = require('../../UsePAY/deploy/common/util');
const execSync = require('child_process').execSync;
const Web3 = require('web3');

/**
 * Uniswap V2 배포, UsePAY 테스트를 위한 배포 스크립트
 */
async function main() {
    const { MANAGER_ADDRESS } = process.env;                    // 매니저 주소
    const { ROUTER_ADDRESS } = process.env;                     // Uniswap Router 주소
    const { GOVERNANCE_TOKEN_ADDRESS } = process.env;           // 거버넌스 토큰 주소 (PAC)
    const { GOVERNANCE_TOKEN_LIQUIDITY_AMOUNT } = process.env;  // 거버넌스 토큰의 유동성 추가량
    const { NATIVE_TOKEN_LIQUIDITY_AMOUNT } = process.env;      // 네이티브 토큰의 유동성 추가량

    // 스왑 배포 (5/5) - 유동성 추가
    let uniswapRouter = await ethers.getContractFactory('UniswapV2Router02');
    uniswapRouter = await uniswapRouter.attach(ROUTER_ADDRESS);
    const after5MinTimestamp = Math.floor(Date.now() / 1000) + 60 * 5;
    const gTokenAmount = Web3.utils.toWei(GOVERNANCE_TOKEN_LIQUIDITY_AMOUNT, 'ether');
    const wTokenAmount = Web3.utils.toWei(NATIVE_TOKEN_LIQUIDITY_AMOUNT, 'ether');
    const tx = await uniswapRouter.addLiquidityETH(
        GOVERNANCE_TOKEN_ADDRESS,
        gTokenAmount,
        0,
        0,
        MANAGER_ADDRESS,
        after5MinTimestamp,
        {
            value: wTokenAmount
        }
    );
    const result = await tx.wait();
    console.log(`      ${result.status == 1 ? 'success' : 'fail'}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
