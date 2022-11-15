const Web3 = require("web3");
const axios = require('axios');
const fs = require("fs");
const pool = require('./database');
const { env } = require('./config');

// 설정 불러오기
const { NETWORK, CONTRACT_TYPE, ENDPOINT, ETHER_PER_WEI, DFM_MINT, ETH_AMOUNT, ACCOUNTS_FILE_PATH } = env;
const { GAS_PRICE, GAS_LIMIT, PACK_PRICE, DFM, UniswapRouter, UniswapTokenPair, POLYGON_SubscriptionCreator } = env;
const ADDRESS = { DFM, UniswapRouter, UniswapTokenPair, POLYGON_SubscriptionCreator, isPackRefunded };
const PATH_PREFIX = __dirname + "/../../../";

/**
 * Web3 인스턴스를 받는다.
 * @returns
 */
function getWeb3() {
    return new Web3(ENDPOINT);
}

/**
 * 폴리곤 Mumbai 낮은 가비스 가져오기
 * @returns 
 */
async function mumbaiGasPrice() {
    const {data} = await axios.get('https://gasstation-mumbai.matic.today/v2');
    console.log(data);
    return parseInt(data.standard.maxPriorityFee * 1000000000);
}

/**
 * 계정을 생성하거나 불러온다.
 * @param {*} web3 
 * @returns 
 */
async function getAccounts(web3) {
    if (fs.existsSync(ACCOUNTS_FILE_PATH)) {
        accounts = JSON.parse(
            await fs.readFileSync(ACCOUNTS_FILE_PATH, "utf-8")
        );
    } else {
        accounts = newAccounts(getWeb3(web3), 6);
        await fs.writeFileSync(ACCOUNTS_FILE_PATH, JSON.stringify(accounts));
    }
    return accounts;
}

/**
 * 새로운 어카운트를 생성한다.
 * @param {*} web3
 * @param {*} count
 * @returns
 */
function newAccounts(web3, count) {
    const accounts = [];
    for (let i = 0; i < count; i++) {
        accounts.push(web3.eth.accounts.create(web3.utils.randomHex(32)));
    }
    return accounts;
}

/**
 * DFM 민팅
 * @param {*} amount
 */
async function mintDFM(web3, amount, account) {
    const abiPath = `${PATH_PREFIX}./output/${CONTRACT_TYPE}/${NETWORK}/abi/ERC20PresetMinterPauser.abi.json`;
    const abi = JSON.parse(await fs.readFileSync(abiPath, "utf-8"));
    const Contract = new web3.eth.Contract(abi, ADDRESS.DFM);
    const amountWei = amount * ETHER_PER_WEI;

    const txObj = {
        from: account.address,
        to: Contract.options.address,
        gas: GAS_LIMIT,
        gasPrice: GAS_PRICE
    };

    const currentBalance = await dfmBalance(web3, account.address);
    const newBalance = amountWei - currentBalance;

    if (newBalance > 0) {
        const receipt = await new Promise((resolve, reject) => {
            Contract.methods
            .mint(account.address, newBalance + "")
            .send(txObj).on('receipt', receipt => {
                resolve(receipt);
            }).on('error', e => {
                reject(e);
            });
        })
    }

    const lastBalance =
        (await dfmBalance(web3, account.address)) / ETHER_PER_WEI;
    console.log("DFM Balance : " + lastBalance);
}

/**
 * DFM 잔고를 리턴
 * @param {*} web3
 * @param {*} address
 * @returns
 */
async function dfmBalance(web3, address) {
    const abiPath = `${PATH_PREFIX}./output/${CONTRACT_TYPE}/${NETWORK}/abi/ERC20PresetMinterPauser.abi.json`;
    const abi = JSON.parse(await fs.readFileSync(abiPath, "utf-8"));
    const Contract = new web3.eth.Contract(abi, ADDRESS.DFM);
    const currentBalane = await Contract.methods.balanceOf(address).call();
    return currentBalane;
}

/**
 * 계정에서 DFM을 가져갈 수 있도록 Approve 한다
 * @param {*} web3
 * @param {*} fromAddress
 * @param {*} toAddress
 * @param {*} amount
 */
async function approveDFM(web3, fromAccount, toAddress, amount) {
    const abiPath = `${PATH_PREFIX}./output/${CONTRACT_TYPE}/${NETWORK}/abi/ERC20PresetMinterPauser.abi.json`;
    const abi = JSON.parse(await fs.readFileSync(abiPath, "utf-8"));
    const Contract = new web3.eth.Contract(abi, ADDRESS.DFM);
    amount *= ETHER_PER_WEI;

    const txObj = {
        from: fromAccount.address,
        to: Contract.options.address,
        gas: GAS_LIMIT,
        gasPrice: GAS_PRICE
    };

    const {transactionHash} = await new Promise((resolve, reject) => {
        Contract.methods
        .approve(toAddress, amount + "").send(txObj)
        .on('receipt', receipt => resolve(receipt))
        .on('error', e => reject(e));
    });
}

/**
 * Uniswap 에 유동성 풀을 추가한다.
 * @param {*} web3
 * @param {*} amountDfm
 * @param {*} amountToken
 * @param {*} account
 */
async function addLiquidity(web3, amountDfm, amountToken, account) {
    const abiPath = `${PATH_PREFIX}./output/${CONTRACT_TYPE}/${NETWORK}/abi/UniswapV2Router02.abi.json`;
    const abi = JSON.parse(await fs.readFileSync(abiPath, "utf-8"));
    const Contract = new web3.eth.Contract(abi, ADDRESS.UniswapRouter);
    const after5MinTimestamp = Math.floor(Date.now() / 1000) + 60 * 5;

    amountToken *= ETHER_PER_WEI;
    const txObj = {
        from: account.address,
        to: Contract.options.address,
        gas: GAS_LIMIT,
        gasPrice: GAS_PRICE,
        value: amountToken + "",
    };

    amountDfm *= ETHER_PER_WEI;
    const {transactionHash} = await new Promise((resolve, reject) => {
        Contract.methods
        .addLiquidityETH(
            ADDRESS.DFM,
            amountDfm + "",
            0,
            0,
            account.address,
            after5MinTimestamp
        ).send(txObj)
        .on('receipt', receipt => resolve(receipt))
        .on('error', e => reject(e));
    });
}

/**
 * 유동성 규모 리턴
 * @param {*} web3
 * @param {*} tokenPairAddress
 */
async function liquidityBalances(web3) {
    const abiPath = `${PATH_PREFIX}./output/${CONTRACT_TYPE}/${NETWORK}/abi/UniswapV2Pair.abi.json`;
    const abi = JSON.parse(await fs.readFileSync(abiPath, "utf-8"));
    const Contract = new web3.eth.Contract(abi, ADDRESS.UniswapTokenPair);
    const result = await Contract.methods.getReserves().call();
    return {
        token0: result["0"] / ETHER_PER_WEI,
        token1: result["1"] / ETHER_PER_WEI,
    };
}

/**
 * 구독팩 생성
 * @param {*} packinfo
 * @param {*} create_num
 */
async function createSubscriptionPack(web3, packInfo, account, keyidx) {
    const abiPath = `${PATH_PREFIX}./output/${CONTRACT_TYPE}/${NETWORK}/abi/POLYGON_SubscriptionCreator.abi.json`;
    const abi = JSON.parse(await fs.readFileSync(abiPath, "utf-8"));
    const Contract = new web3.eth.Contract(abi,ADDRESS.POLYGON_SubscriptionCreator);

    // 팩 수수료 0.0001 ETH
    const txObj = {
        from: account.address,
        to: Contract.options.address,
        gas: GAS_LIMIT,
        gasPrice: GAS_PRICE,
        value: PACK_PRICE + "",
    };

    const txResult = await Contract.methods
        .createSubscription(packInfo, keyidx)
        .send(txObj);

    const { pack } = txResult.events.createSubscriptionEvent.returnValues;
    return pack;
}

/**
 * 팩 구매
 * @param {*} web3
 * @param {*} price
 * @param {*} packAddress
 * @param {*} userAccount
 */
async function buyPack(web3, price, packAddress, userAccount, keyidx) {
    const abiPath = `${PATH_PREFIX}./output/${CONTRACT_TYPE}/${NETWORK}/abi/POLYGON_SubscriptionCommander.abi.json`;
    const abi = JSON.parse(await fs.readFileSync(abiPath, "utf-8"));
    const Contract = new web3.eth.Contract(abi, packAddress);
    const encoded = Contract.methods.buy(keyidx).encodeABI();
    const txObj = {
        from: userAccount.address,
        to: Contract.options.address,
        gas: GAS_LIMIT,
        gasPrice: GAS_PRICE,
        data: encoded,
        value: price + "",
    };

    const receipt = await new Promise((resolve, reject) => {
        web3.eth.accounts.signTransaction(txObj, userAccount.privateKey).then(signed => {
            web3.eth.sendSignedTransaction(signed.rawTransaction)
            .on('receipt', r => resolve(r))
            .on('error', e => reject(e));
        });
    });

    console.log(`buy pack: ${receipt.transactionHash}`);
}

/**
 * 환불 요청
 * @param {*} web3
 * @param {*} packAddress
 * @param {*} userAccount
 */
async function refundPack(web3, packAddress, userAccount) {
    const abiPath = `${PATH_PREFIX}./output/${CONTRACT_TYPE}/${NETWORK}/abi/POLYGON_SubscriptionCommander.abi.json`;
    const abi = JSON.parse(await fs.readFileSync(abiPath, "utf-8"));
    const Contract = new web3.eth.Contract(abi, packAddress);
    const encoded = Contract.methods.requestRefund().encodeABI();
    const txObj = {
        from: userAccount.address,
        to: Contract.options.address,
        data: encoded,
        gas: GAS_LIMIT,
        gasPrice: GAS_PRICE
    };
    const receipt = await new Promise((resolve, reject) => {
        web3.eth.accounts.signTransaction(txObj, userAccount.privateKey).then(signed => {
            web3.eth.sendSignedTransaction(signed.rawTransaction)
            .on('receipt', r => resolve(r))
            .on('error', e => reject(e));
        });
    });
    console.log(`refund pack: ${receipt.transactionHash}`);
}

/**
 * 구독팩 활성화 상태
 * @param {*} web3
 * @param {*} packAddress
 * @returns
 */
async function disabledPackCheck(web3, packAddress) {
    const abiPath = `${PATH_PREFIX}./output/${CONTRACT_TYPE}/${NETWORK}/abi/POLYGON_SubscriptionCommander.abi.json`;
    const abi = JSON.parse(await fs.readFileSync(abiPath, "utf-8"));
    const Contract = new web3.eth.Contract(abi, packAddress);
    const result = await Contract.methods.viewIsLive().call();
    return result;
}

/**
 * 계정 잔고 확인
 * @param {*} accounts
 */
async function checkBalance(web3, accounts) {
    let balances = {};
    for (let i = 0; i < accounts.length; i++) {
        const addr = accounts[i].address;
        balances[addr] = web3.utils.fromWei(
            await web3.eth.getBalance(addr),
            "ether"
        );
    }
    console.log(balances);
}

/**
 * 관리자 직권정산 시간을 수정한다.
 * @param {*} web3
 * @param {*} packAddress
 * @param {*} accounts
 * @param {*} param3
 * @param {*} */
async function setManagerCalcDate(web3, packAddress, account) {
    const abiPath = `${PATH_PREFIX}./output/${CONTRACT_TYPE}/${NETWORK}/abi/POLYGON_SubscriptionCommander.abi.json`;
    const abi = JSON.parse(await fs.readFileSync(abiPath, "utf-8"));
    const Contract = new web3.eth.Contract(abi, packAddress);
    const txObj = {
        from: account.address,
        to: Contract.options.address,
        gas: GAS_LIMIT,
        gasPrice: GAS_PRICE
    };

    await new Promise((resolve, reject) => {
        Contract.methods
        .setRefundByManagerFromDeactivate(0).send(txObj)
        .on('receipt', receipt => resolve(receipt))
        .on('error', e => reject(e));
    });

    await new Promise((resolve, reject) => {
        Contract.methods
        .setRefundByManagerFromUseEnd(0).send(txObj)
        .on('receipt', receipt => resolve(receipt))
        .on('error', e => reject(e));
    });

    await new Promise((resolve, reject) => {
        Contract.methods
        .setRefundTimestampForAll(0).send(txObj)
        .on('receipt', receipt => resolve(receipt))
        .on('error', e => reject(e));
    });
}

/**
 * 불만족팩 직권 정산 실행
 * @param {*} web3 
 * @param {*} packAddress 
 * @param {*} accounts 
 */
async function noShowRefund(web3, packAddress, fromAccount, accountList) {
    const abiPath = `${PATH_PREFIX}./output/${CONTRACT_TYPE}/${NETWORK}/abi/POLYGON_SubscriptionCommander.abi.json`;
    const abi = JSON.parse(await fs.readFileSync(abiPath, "utf-8"));
    const Contract = new web3.eth.Contract(abi, packAddress);
    const txObj = {
        from: fromAccount.address,
        to: Contract.options.address,
        gas: GAS_LIMIT,
        gasPrice: GAS_PRICE
    };

    const receipt = await new Promise((resolve, reject) => {
        Contract.methods
        .noShowRefund(accountList).send(txObj)
        .on('receipt', receipt => resolve(receipt))
        .on('error', e => reject(e));
    });
}

/**
 * 현재 시간
 * @returns
 */
function getCurrentTimestamp() {
    return Math.floor(Date.now() / 1000);
}

/**
 * 블럭 시간을 가져온다 - 개발장비 시간과 블럭 시간이 다를 수 있음
 * @param {*} web3
 * @returns
 */
async function getBlockTime(web3) {
    const no = await web3.eth.getBlockNumber();
    const info = await web3.eth.getBlock(no);
    return info.timestamp;
}

/**
 * 밀리초 슬립
 * @param {*} t
 * @returns
 */
function sleep(t) {
    return new Promise((resolve) => setTimeout(resolve, t));
}

/**
 * DB 에 Insert Query를 실행한다.
 * @param {*} sql 
 * @param {*} params 
 * @returns 
 */
async function insertQuery(sql, params) {
    try {
        await new Promise((resolve, reject) => {
            pool.getConnection(async function(err, conn) {
                if(err) return reject(err);
                await conn.beginTransaction();
                await conn.query(sql, params, (err) => {
                    if(err) {
                        conn.rollback();
                        conn.release();
                        return reject(err);
                    } else {
                        conn.commit();
                        conn.release();
                        return resolve();
                    }
                });
            });
        });
        return true;
    } catch(e) {
        console.log(e);
        return false;
    }
}

/**
 * DB 조회 쿼리
 * @param {*} sql 
 * @param {*} params 
 * @returns 
 */
async function selectQuery(sql, params) {
    try {
        const rows = await new Promise((resolve, reject) => {
            pool.getConnection(async function(err, conn) {
                if(err) return reject(err);
                await conn.beginTransaction();
                await conn.query(sql, params, (err, rows) => {
                    if(err) {
                        conn.rollback();
                        conn.release();
                        return reject(err);
                    } else {
                        conn.commit();
                        conn.release();
                        return resolve(rows);
                    }
                });
            });
        });
        return rows;
    } catch(e) {
        console.log(e);
        return false;
    }
}

/**
 * MySQL 에서 DB KeyIdx 값을 갱신하고 가져온다.
 * @returns 
 */
async function getDBKeyIdx() {
    const uSql = " UPDATE txidxdata SET idx =  idx + 1 ";
    const sql = " SELECT idx FROM txidxdata ";
    const keyidx = await new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if(err) return reject(err);
            conn.query(uSql, (err, r) => { 
                if(err) return reject(err);
                if(!err) {
                    conn.query(sql, (err, r) => { 
                        if(!err) {
                            conn.release();
                            return resolve(r[0].idx);
                        }
                    });
                }
            });
        });
    });
    return keyidx;
}

/**
 * 구독 팩을 NodeSync 테이블에 입력한다.
 * @param {*} issuer 
 * @param {*} packInfo 
 * @returns 
 */
async function saveNodeSync(issuer, packInfo, keyidx) {
    const body = {
        keyidx: keyidx,
        issuer: issuer,
        network: 'Matic',
        packgbn: 'P003',  //구독권
        name: 'Test pack from hardhat',
        description: 'Test from hardhat',
        category: 'test',
        quantity: packInfo.total,
        buysdate: packInfo.times0,
        buyedate: packInfo.times1,
        usesdate: packInfo.times2,
        useedate: packInfo.times3,
        price: packInfo.price.toString(),
        noshow: 0,
        maxbuy: 0,
        token: packInfo.tokenType,
        program: 'Test program',
        searchyn: 'N',
        status: 'Y',
        nonce: 1,
        recommender: '',
        imgfile: '',
        nation: 'KR',
        location: 'DFM eco inc. head offce ',
        certification: ''
    };

    const params = [body.network, body.nonce, body.issuer, body.packgbn, body.name, 
                  body.description,body.category,Number(body.quantity), body.buysdate, body.buyedate, 
                  body.usesdate, body.useedate, body.price, Number(body.noshow), Number(body.maxbuy), 
                  Number(body.token), body.searchyn, body.imgfile, body.nation, body.location,
                  body.certification, body.program, body.keyidx, body.recommender]; 

    let sql = " INSERT INTO nodesync (network, nonce, issuer, packgbn, name, "; 
    sql += " description, category, quantity, buysdate, buyedate, ";
    sql += " usesdate, useedate, price, noshow, maxbuy, "; 
    sql += " token, searchyn, imgfile, nation, location, ";
    sql += " certification,program, keyidx, recommender, cre_date) ";
    sql += " VALUES (?,?,?,?,?,    ?,?,?,?,?,    ?,?,?,?,?,    ?,?,?,?,?,    ?,?,?,?,NOW()) ";
    
    return await insertQuery(sql, params);
}

/**
 * 팩이 데몬에 의해서 처리되었는지 DB에서 조회.
 * @param {*} packAddress 
 */
async function isPackProcessed(packAddress) {
    const sql = "select * from packinfo where address = ?";
    const rows = await selectQuery(sql, [packAddress]);
    return rows.length == 1;
}

/**
 * 팩이 데몬에 의해서 처리되었는지 DB에서 조회.
 * @param {*} packAddress 
 */
async function isBuyPackProcessed(buyers, packAddress) {
    const sql = "select * from buypack where network = 'Matic' and targetpack = ? and buyer in ('" + buyers.join("','") + "')";
    const rows = await selectQuery(sql, [packAddress]);
    return rows.length == buyers.length;
}

/**
 * 팩이 데몬에 의해서 처리되었는지 DB에서 조회.
 * @param {*} packAddress 
 */
async function isPackRefunded(owners, packAddress) {
    const sql = "select * from refundpack where network = 'Matic' and targetpack = ? and owner in (?)";
    const rows = await selectQuery(sql, [packAddress, owners]);
    return rows.length == owners.length;
}

/**
 * 팩 구매 정보를 DB에 입력한다.
 * @param {*} buyer 
 * @param {*} packAddress 
 */
async function saveBuySync(buyer, packAddress, keyidx) {
    const body = {
        nonce: 1,
        buyer: buyer,
        targetpack: packAddress,
        quantity: 1,
        id: buyer,
        network: 'Matic',
        keyidx: keyidx
    };

    var params = [body.network, body.nonce, body.buyer, body.id, body.keyidx];
    var sql = 'INSERT INTO buysync (network, nonce, buyer, id, cre_date, keyidx) ';
    sql += ' VALUES (?,?,?,?,NOW(),?) ';
    await insertQuery(sql, params);
}

// 외부로 보내기
module.exports = {
    getWeb3, getAccounts, mintDFM, dfmBalance, approveDFM, addLiquidity, liquidityBalances,
    createSubscriptionPack, buyPack, refundPack, disabledPackCheck, checkBalance, getBlockTime,
    getCurrentTimestamp, sleep, setManagerCalcDate, noShowRefund, saveNodeSync, saveBuySync,
    isPackProcessed, isBuyPackProcessed, isPackRefunded, mumbaiGasPrice, getDBKeyIdx
}