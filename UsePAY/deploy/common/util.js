const hre = require('hardhat');
const fs = require('fs');
const moment = require('moment');
const { exec } = require('child_process');
const readline = require('readline');
const { ethers } = require('hardhat');

const UNISWAP_PREFIX = '../UsePAY/';
const WRAP_ADDRESSES_PATH = './contracts/UsePAY/Storage/WrapAddresses.sol';
const MULTITRANSFER_PATH = './contracts/UsePAY/Utils/MultiTransfer.sol';
const UNISWAP_V2_LIB_PATH = '../Uniswap/contracts/Uniswap/periphery/libraries/UniswapV2Library.sol';

/**
 * 마지막으로 배포된 컨트랙트의 주소를 가져옵니다.
 */
const getLastDeployedContractAddress = async (network, contractName) => {
    const filePath = `../output/${network}-history.log`;
    let text = (await fs.readFileSync(filePath, 'utf-8')).trim().split('\n');
    for (let i = text.length-1; i > -1; i--) {
        const obj = JSON.parse(text[i]);
        if (obj.contractName == contractName) {
            return obj.address;
        }
    }
    return '';
}

/**
 * 마지막으로 배포된 PACK 토큰 주소를 가져옵니다.
 */
const getLastDeployedPACTokenAddress = async (network, symbol) => {
    const filePath = `../output/${network}-history.log`;
    let text = (await fs.readFileSync(filePath, 'utf-8')).trim().split('\n');
    for (let i = text.length-1; i > -1; i--) {
        const obj = JSON.parse(text[i]);
        if (obj.tokenSymbol == symbol) {
            return obj.address;
        }
    }
    return '';
}

/**
 * 사용자에게 질문과 합께 커맨드 라인으로 입력 받는다.
 * @param {*} question 
 * @returns 
 */
const userInput = async (question, withResponse = true, mute = false) => {
    let rl;
    if (withResponse) {
        rl = readline.createInterface({
            terminal: withResponse,
            input: process.stdin,
            output: process.stdout
        });
    } else {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    if (mute) {
        rl.input.on('keypress', function (c, k) {
            var len = rl.line.length;
            readline.moveCursor(rl.output, -len, 0);
            readline.clearLine(rl.output, 1);
            for (var i = 0; i < len; i++) {
                rl.output.write('*');
            }
        });
    }
        
    return new Promise((resolve, reject) => {
        rl.question(`${question} `, (input) => {
            resolve(input);
            rl.close();
        });
    });
};

/**
 * 배포 스크립트 실행 파라미터 추출
 * @returns
 */
function getNetworkAndContractType() {
    const scriptParam = JSON.parse(process.env.npm_config_argv).original;
    const network = scriptParam[1];
    const contractType = scriptParam[2];
    return { network, contractType };
}

/**
 * 배포 스크립트 실행 파라미터 추출 3
 * @returns
 */
function getNetworkAndContractTypeWithName() {
    const scriptParam = JSON.parse(process.env.npm_config_argv).original;
    const network = scriptParam[1];
    const contractType = scriptParam[2];
    const contractName = scriptParam[3];
    return { network, contractType, contractName };
}

/**
 * 컨트랙트 배포 함수
 * @param {*} contractName
 * @returns 배포된 주소
 */
async function deploy(contractName, ...params) {
    const Contract = await hre.ethers.getContractFactory(contractName);
    const contract = await Contract.deploy(...params);
    await contract.deployed();
    return contract.address;
}

/**
 * JSON Object 를 파일에 추가한다.
 * @param {any}
 * @param {*} jsonObject
 */
function appendJsonFile(fileName, jsonObject) {
    fs.appendFileSync(fileName, JSON.stringify(jsonObject) + '\n');
}

/**
 * JSON Object 를 파일에 쓴다.
 * @param {any}
 * @param {*} jsonObject
 */
function writeJsonFile(fileName, jsonObject) {
    fs.writeFileSync(fileName, JSON.stringify(jsonObject));
}

/**
 * JSON Object 를 파일에서 읽어온다.
 * @param {*} fileName
 */
async function readJsonFile(fileName) {
    try {
        const jsonText = await fs.readFileSync(fileName);
        return JSON.parse(jsonText);
    } catch(e) {
        return null;
    }
}

/**
 * Uniswap 의 Core Factory의 바이트 코드에서 추출한 hex 값을 Periphery의 컨트랙트 소스 코드의 hex 값에 적용합니다.
 * @param {*} address
 */
async function modifyiUniswapPeripheryHex(newHex) {
    const text = await fs.readFileSync(UNISWAP_V2_LIB_PATH, 'utf-8');
    let lines = text.split('\n');
    lines[28] = "                        hex'" + newHex + "' // init code hash";
    const newText = lines.join('\n');
    await fs.writeFileSync(UNISWAP_V2_LIB_PATH, newText);
}

/**
 * MultiTransfer 컨트랙트에 DFM 주소를 하드코딩
 * @param {*} DFMaddress 
 */
async function modifyMultiTransfer(DFMaddress) {
const text = await fs.readFileSync(MULTITRANSFER_PATH, 'utf-8');
    let lines = text.split('\n');
    lines[10] = `    address DFM = ${DFMaddress};`;
    const newText = lines.join('\n');
    await fs.writeFileSync(MULTITRANSFER_PATH, newText);
}

/**
 * 컨트랙트에 전달된 파라미터에 따라 컨트랙트 이름을 변경하기 위한 유틸 함수
 * @returns
 */
function getContractPrefix() {
    const { contractType } = getNetworkAndContractType();
    let PREFIX = '';
    switch (contractType) {
        case 'bsc':
            PREFIX = 'BSC_';
            break;
        case 'kla':
            PREFIX = 'KLA_';
            break;
        case 'pol':
            PREFIX = 'POLYGON_'
    }
    return PREFIX;
}

/**
 * JSON 파일을 읽어서 Addresses 에 전달 할 변수로 가공한다.
 * @param {*} jsonFilePath
 */
function getBSCTokenIndexValueFromJson(address) {
    const setAddressesIndex = [
        100, // Native Token
        101, // DFM
        102, // USDT
        103, // Wrapped Native Token
        1200, // Uniswap v2 Router
        1201, // Uniswap v2 Factory
        1300, // Percentage
        10000, // TicketCommander v1
        10001, // CouponCommander v1
        10002, // SubscriptionCommander v1
        20000, // TicketCreator v1
        20001, // CouponCreator v1
        20002 // SuvscriptionCreator v1
    ];

    const PREFIX = getContractPrefix();

    const setAddressesValue = [
        '0x0000000000000000000000000000000000000000', // Native Token
        address.DFM, // DFM
        address.USDT, // USDT
        address.WTOKEN, // Wrapped Native Token
        address.UniswapRouter, // Uniswap v2 Router
        address.UniswapFactory, // Uniswap v2 Factory
        address.Percentage, // Percentage
        address[PREFIX + 'TicketCommander'], // TicketCommander v1
        address[PREFIX + 'CouponCommander'], // CouponCommander v1
        address[PREFIX + 'SubscriptionCommander'], // SubscriptionCommander v1
        address[PREFIX + 'TicketCreator'], // TicketCreator v1
        address[PREFIX + 'CouponCreator'], // CouponCreator v1
        address[PREFIX + 'SubscriptionCreator'] // SuvscriptionCreator v1
    ];

    return { setAddressesIndex, setAddressesValue };
}

/**
 * 파일을 백업합니다.
 *      사본 파일 패턴 : filePath/타임스탬프.fileName
 * @param {*} filePath
 */
async function backupFile(filePath, fileName) {
    const source = filePath + fileName;
    let target = filePath + moment(new Date()).format('YYYYMMDD_hhmmss') + '/';

    if (await fs.existsSync(source)) {
        await fs.mkdirSync(target, { recursive: true });
        target += fileName;
        await fs.copyFileSync(source, target);
    }
}

/**
 * 환경설정에 등록된 기본 계정을 리턴한다
 * @returns 
 */
async function getDefaultAccount() {
    let defaultAccount = await ethers.getSigners();
    return defaultAccount[0].address;
}

// 시간 지연
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 트랜잭션 처리 후의 로그를 리턴한다.
 * @param {*} tx 
 * @returns 
 */
async function getTransactionLogs(tx, eventName) {
    return (await tx.wait()).events?.filter((x) => x.event == eventName)[0].args;
}

/**
 * Payable 메서드 호출시 전송할 토큰 파라미터 캐스팅.
 * @param {*} number 
 * @returns 
 */
function getWeiParam(number) {
    return ethers.utils.parseUnits(number.toString(), 'wei');
}

module.exports = {
    UNISWAP_PREFIX,
    getContractPrefix,
    deploy,
    readJsonFile,
    writeJsonFile,
    appendJsonFile,
    getBSCTokenIndexValueFromJson,
    modifyiUniswapPeripheryHex,
    backupFile,
    getNetworkAndContractType,
    modifyMultiTransfer,
    getNetworkAndContractTypeWithName,
    userInput,
    getDefaultAccount,
    sleep,
    getLastDeployedContractAddress,
    getLastDeployedPACTokenAddress,
    getTransactionLogs,
    getWeiParam
};
