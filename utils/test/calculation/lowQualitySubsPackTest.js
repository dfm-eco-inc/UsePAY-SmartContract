const lib = require("./modules/lib");

async function main() {
    const web3 = lib.getWeb3();
    const accounts = lib.getAccounts();

    // 잔고 검사
    const isContinue = await lib.checkBalance(accounts);
    if(!isContinue) {
        console.log('모든 계정의 잔고는 0.5 이상이어야 합니다.');
        process.exit(-1);
    }

    // 팩생성
    const {keyIdx, packInfo, packAddress} = await lib.createPack(accounts.issuer);
    console.log('팩 완료')

    // 팩 구매
    const buyers = [];
    try {
        for (let i = 0; i < accounts.buyers.length; i++) {
            const newKeyIdx = await lib.getDBKeyIdx();
            lib.buyPack(web3, packInfo.price, packAddress, accounts.buyers[i], newKeyIdx);
            buyers.push(accounts.buyers[i].publicKey);
        }
        await lib.sleep(500);
    } catch (e) {
        console.log(e.message);
        process.exit(-1);
    }

    // 데몬 처리 대기
    while(true) {
        const result = await lib.isBuyPackProcessed(buyers, packAddress)
        if(result) break;
        console.log('팩 구매 데몬 처리 대기 ...')
        await lib.sleep(3000);
    }

    // 팩환불
    let refunders = [];
    for (let i = 0; i < accounts.buyers.length - 1; i++) {
        refunders.push(accounts.buyers[i].publicKey);
        lib.refundPack(web3, packAddress, accounts.buyers[i]);
    }
    await lib.sleep(500);

    // 데몬 처리 대기
    while(true) {
        const result = await lib.isPackRefunded(refunders, packAddress)
        if(result) break;
        console.log('팩 환불 데몬 처리 대기 ...')
        await lib.sleep(3000);
    }
    console.log('정산팩 생성 완료')
}

main().then(() => process.exit(0)).catch((e) => {
    if(e.message.includes('replacement transaction underpriced')) {
        console.log('다른 트랙잭션이 실행중이거나, 가스비가 맞지 않습니다.')
    }
    console.log(e.message);
});
