const util = require('../../UsePAY/deploy/common/util');
const keccak256 = require('keccak256');
const { ethers } = require('hardhat');
const Web3 = require('web3');
const fs = require('fs');

/**
 * Uniswap V2 유동성 추가
 */
async function main() {
    console.clear();
    console.log('Add liquidity on UniswapV2');
    console.log('===============================');

    // 배포 설정 가져오기
    const deployNetwork = process.env.HARDHAT_NETWORK;
    const defaultAccount = await util.getDefaultAccount();
    let uniswapRouter = await ethers.getContractFactory('UniswapV2Router02');
    let uniswapTokenPair = await ethers.getContractFactory('UniswapV2Pair');
    let erc20Token = await ethers.getContractFactory('UniswapV2ERC20');
    const outputFilePath = `../output/${deployNetwork}-history.log`;
    const web3 = new Web3(ethers.provider.connection.url);

    let lastPairAddress = await util.getLastDeployedContractAddress(deployNetwork, 'UniswapV2Pair');
    let lastRouterAddress = await util.getLastDeployedContractAddress(deployNetwork, 'UniswapV2Router02');
    let lastPACAddress = await util.getLastDeployedContractAddress(deployNetwork, 'ERC20PresetPauser');

    // UniswapV2Pair 주소 입력
    console.log('\n---- 1 / 7 ----');
    let isValidAddress = false;
    let question = `배포된 UniswapV2Pair 컨트랙트의 주소를 입력해주세요. (현재 값 : ${lastPairAddress})`;
    inputValue = (await util.userInput(question + '\n입력 :')) || lastPairAddress;
    if (inputValue == '') return;
    console.log(`확인 : ${inputValue}`);
    if (!web3.utils.isAddress(inputValue)) {
        console.log('유효한 주소가 아닙니다');
        return false;
    }
    uniswapTokenPair = await uniswapTokenPair.attach(inputValue);

    // UniswapV2Router02 주소 입력
    console.log('\n---- 2 / 7 ----');
    isValidAddress = false;
    question = `배포된 UniswapV2Router02 컨트랙트의 주소를 입력해주세요. (현재 값 : ${lastRouterAddress})`;
    inputValue = (await util.userInput(question + '\n입력 :')) || lastRouterAddress;
    if (inputValue == '') return;
    console.log(`확인 : ${inputValue}`);
    if (!web3.utils.isAddress(inputValue)) {
        console.log('유효한 주소가 아닙니다');
        return false;
    }
    uniswapRouter = await uniswapRouter.attach(inputValue);

    // ERC20PresetPauser 주소 입력
    console.log('\n---- 3 / 7 ----');
    isValidAddress = false;
    question = `배포된 ERC20PresetPauser 컨트랙트의 주소를 입력해주세요. (현재 값 : ${lastPACAddress})`;
    inputValue = (await util.userInput(question + '\n입력 :')) || lastPACAddress;
    if (inputValue == '') return;
    console.log(`확인 : ${inputValue}`);
    if (!web3.utils.isAddress(inputValue)) {
        console.log('유효한 주소가 아닙니다');
        return false;
    }
    erc20Token = erc20Token.attach(inputValue);

    // 추가할 물량
    console.log('\n---- 4 / 7 ----');
    question = `ERC-20 토큰을 얼마나 추가하시겠습니까? (기본값 : 100 Token)`;
    let gTokenAmount = (await util.userInput(question + '\n입력 :')) || '100';
    gTokenAmount = Web3.utils.toWei(gTokenAmount, 'ether');

    console.log('\n---- 5 / 7 ----');
    question = `Native 토큰을 얼마나 추가하시겠습니까? (기본값 : 1 Token)`;
    let wTokenAmount = (await util.userInput(question + '\n입력 :')) || '1';
    wTokenAmount = Web3.utils.toWei(wTokenAmount, 'ether');

    // 유동성 잔고
    console.log(`\n---- 현재 풀 상태 ----`);
    let balance = {};
    let reserves = await uniswapTokenPair.getReserves();
    balance['Current Liquidity ' + (await uniswapTokenPair.token0()) + ' amount'] = parseFloat(
        ethers.utils.formatEther(reserves._reserve0)
    );
    balance['Current Liquidity ' + (await uniswapTokenPair.token1()) + ' amount'] = parseFloat(
        ethers.utils.formatEther(reserves._reserve1)
    );
    balance['Account owned ERC-20 amount'] = parseFloat(
        ethers.utils.formatEther(await erc20Token.balanceOf(defaultAccount))
    );
    balance['Account owned Native token amount'] = parseFloat(
        ethers.utils.formatEther(await ethers.provider.getBalance(defaultAccount))
    );
    balance['ERC-20 amount will increase more'] = parseFloat(ethers.utils.formatEther(gTokenAmount));
    balance['Native token amount will increase more'] = parseFloat(ethers.utils.formatEther(wTokenAmount));
    console.log(balance);

    // 배포 여부 확인
    console.log('\n---- 6 / 7 ----');
    question = `이대로 유동성을 추가 공급 하시겠습니까? (Y/N)`;
    const isContinue = (await util.userInput(question + '\n입력 :')) || 'N';
    console.log(`확인 : ${isContinue}`);
    if (isContinue.toUpperCase() != 'Y') {
        console.log('\n중단합니다.');
        return;
    }

    // ERC-20 퍼가요 승인
    await erc20Token.approve(uniswapRouter.address, gTokenAmount);
    const after5MinTimestamp = Math.floor(Date.now() / 1000) + 60 * 5;

    // 유동성 추가
    const tx = await uniswapRouter.addLiquidityETH(
        erc20Token.address,
        gTokenAmount,
        0,
        0,
        defaultAccount,
        after5MinTimestamp,
        {
            value: wTokenAmount
        }
    );
    const result = await tx.wait();

    // 지연
    console.log('\n---- 7 / 7 ----');
    for (let i = 5; i > 0; i--) {
        console.log(`${i}초 전`);
        await util.sleep(1000);
    }

    console.log(`\n---- 최종 풀 상태 ----`);
    balance = {};
    reserves = await uniswapTokenPair.getReserves();
    balance['Liquidity ' + (await uniswapTokenPair.token0()) + ' amount'] = parseFloat(
        ethers.utils.formatEther(reserves._reserve0)
    );
    balance['Liquidity ' + (await uniswapTokenPair.token1()) + ' amount'] = parseFloat(
        ethers.utils.formatEther(reserves._reserve1)
    );
    balance['Account owned ERC-20 amount'] = parseFloat(
        ethers.utils.formatEther(await erc20Token.balanceOf(defaultAccount))
    );
    balance['Account owned Native token amount'] = parseFloat(
        ethers.utils.formatEther(await ethers.provider.getBalance(defaultAccount))
    );
    console.log(balance);

    // 기록 추가
    const output = {
        updated: new Date(),
        deployNetwork,
        commandType: 'ContractCall',
        method: 'addLiquidityETH',
        routerAddress: uniswapRouter.address,
        pariAddress: uniswapTokenPair.address,
        token0: reserves._reserve0.toString(),
        token1: reserves._reserve1.toString()
    };
    await util.appendJsonFile(outputFilePath, output);

    // 완료
    console.log(`\n완료.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
