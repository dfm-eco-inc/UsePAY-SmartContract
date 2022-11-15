/**
 * 현재 메인넷 가스가격 계산기
 * 
 * total_gas 를 입력하면 현재 가장 낮은 가스가격으로 총 비용을 계산합니다.
 * 가스 총량은 네트워크별로 다릅니다. 
 * 
 * 낮은 가스비 시간대를 선택해서 배포해야 합니다. 또는 낮은 가스비로 걸어둡니다. 
 *   ETH Chart : https://etherscan.io/chart/gasprice
 *   BNB Chart : https://bscscan.com/chart/gasprice
 * MATIC Chart : https://polygonscan.com/chart/gasprice
 * 
 * 테스트 결과
 * 
 *      Contract total gas: 1600000
 *      ethereum_gasstation price : 0.028 ETH, (current gas price: 17.5 GWEI)
 *      etethereum_scan price : 0.0112 ETH, (current gas price: 7 GWEI)
 *      polygon price : 0.04816 MATIC, (current gas price: 30.1 GWEI)
 *      polygon_scan price : 0.04816 MATIC, (current gas price: 30.1 GWEI)
 *      polygonMumbai price : 0.01939307432352 MATIC, (current gas price: 12.120671452200002 GWEI)
 *      bnb price : 0.008 BNB, (current gas price: 5 GWEI)
 */

// BSC Testnet
//테스트 트랜잭션 : https://testnet.bscscan.com/tx/0xb13bb8d834b0b62c335cc6501f0b9c8bfe1b1eac9689e12d93fcd7ddb6872a30
// 배포 이전 잔고 : 13.417893965395418611
// 배포 이후 잔고 : 13.402210635395418611
//      잔고 차액 : 0.01568333
//    소요 가스량 : 1568333 gas
//  가스 프라이스 : 10 gwei
//트랜잭션 수수료 : 0.01568333 BNB

// Matic Testnet
//테스트 트랜잭션 : https://mumbai.polygonscan.com/tx/0xc147f7557d7587c197c829f6447cd59417b4646bb7a40f71cd6bc15773b783b0
//   소요 가스량 : 1582633 gas
//  가스 프라이스 : 28.59473784 gwei (28594737840 wei)
// 트랜잭션 수수료 : 0.04525497573193272 MATIC
const axios = require('axios');
// const total_gas = 1568333; // ERC20PresetPauser.sol, 옵티마이징 7번, Remix
const total_gas = 1600000; // ERC20PresetPauser.sol, 옵티마이징 7번, Remix

// 2억 : 200000000000000000000000000 Wei
const urls = {
    ethereum_gasstation : {
        url : "https://ethgasstation.info/api/ethgasAPI.json",
        id : 'safeLowWait',
        token: 'ETH'
    },
    etethereum_scan: {
        url: "https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=AMWBJYJN7Q9ZWHF19EZJZFM8G8IEJ6VT3C",
        id : 'result.SafeGasPrice',
        token: 'ETH'
    },
    polygon: {
        url : "https://gasstation-mainnet.matic.network/",
        id : 'safeLow',
        token: 'MATIC'
    },
    polygon_scan: {
        url: "https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=26QEVNDEC4Y9MYCC23RZ9N7NCU3UVJXH7W",
        id : 'result.SafeGasPrice',
        token: 'MATIC'
    },
    polygonMumbai: {
        url : "https://gasstation-mumbai.matic.today/v2",
        id : 'safeLow.maxPriorityFee',
        token: 'MATIC'
    },
    "bnb": {
        url: "https://api.bscscan.com/api?module=gastracker&action=gasoracle&apikey=8P6H62T27N1T89BSQF648V4JYC2X2IW7NZ",
        id: "result.SafeGasPrice",
        token: 'BNB'
    }
}

const getUrl = async (url, id) => {
    const {data} = await axios.get(url);
    if (id.includes(".")) {
        const items = id.split(".");
        return data[items[0]][items[1]]
    } else {
        return data[id];
    }
}

const main = async () => {
    console.log(`Contract total gas: ${total_gas}`);

    for(let network in urls) {
        const t = urls[network];
        const r = await getUrl(t.url, t.id);
        const result = r * 1000000000 * total_gas / 1000000000000000000;

        console.log(`${network} price : ${result} ${t.token}, (current gas price: ${r} GWEI)`);
    }
}

main().then(() => process.exit(0)).catch(console.log);
