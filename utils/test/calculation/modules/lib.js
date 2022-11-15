const Web3 = require("web3");
const fs = require("fs");
const createPool = require('./database');

require('dotenv').config({ path: __dirname + "/../config/.env" });
require('dotenv').config({ path: __dirname + `/../config/${process.env.ENV_FILE}` });
const { env } = process;
const pool = createPool(env);

/**
 * Web3 인스턴스를 받는다.
 * @returns
 */
function getWeb3() {
    return new Web3(env.RPC_ENDPOINT);
}

/**
 * 계정을 생성하거나 불러온다.
 * @param {*} web3 
 * @returns 
 */
function getAccounts() {
    return {
        issuer: {
            publicKey  : env.ISSUER_PUBLIC_KEY,
            privateKey : env.ISSUER_PRIVATE_KEY
        },
        buyers: [{
                publicKey  : env.BUYER1_PUBLIC_KEY,
                privateKey : env.BUYER1_PRIVATE_KEY
            }, {
                publicKey  : env.BUYER2_PUBLIC_KEY,
                privateKey : env.BUYER2_PRIVATE_KEY
            }, {
                publicKey  : env.BUYER3_PUBLIC_KEY,
                privateKey : env.BUYER3_PRIVATE_KEY
            }
        ]
    }
}

/**
 * 구독팩을 생성한다.
 */
async function createPack(issuer, isLowquality = true) {
    const current = Math.floor(Date.now() / 1000);
    const packInfo = {
        total: env.PACK_TOTAL,
        times0: current - 600,
        times1: current + 180,
        times2: current,
        times3: isLowquality ? current + 180 : current,
        price: env.PACK_PRICE + '',
        tokenType: '100'
    }

    // DB에 저장
    keyIdx = await getDBKeyIdx();
    await saveNodeSync(issuer.publicKey, packInfo, keyIdx);

    // 팩 발행
    const packAddress = await createSubscriptionPack(packInfo, issuer, keyIdx);
    console.log(`Pack created : ${packAddress}`);
    console.log(`Database Key : ${keyIdx}`);

    // 직권 정산 일자 강제 설정
    await setManagerCalcDate(packAddress, issuer, isLowquality);
    console.log(`직권 정산 기간 해제`);

    // 데몬 처리 대기
    while(true) {
        if(await isPackProcessed(packAddress)) break;
        console.log('팩 데몬 처리 대기 ...')
        await sleep(1000);
    }

    return {keyIdx, packInfo, packAddress};
}

/**
 * 컨트랙트 인스턴스와 트랜잭션 객체를 리턴
 * @param {*} web3 
 * @param {*} abiPath 
 * @param {*} address 
 * @param {*} account 
 * @returns 
 */
async function getContractObject(web3, abiPath, address, account) {
    const abi = JSON.parse(await fs.readFileSync(abiPath, "utf-8"));
    const checkedAddress = web3.utils.toChecksumAddress(address);
    const contract = new web3.eth.Contract(abi, checkedAddress);
    
    const from = account.publicKey;
    const to = checkedAddress;
    const nonce = await web3.eth.getTransactionCount(from);
    const gasPrice = await web3.eth.getGasPrice();

    const { baseFeePerGas } = await web3.eth.getBlock("latest");
    const priorityFeePerGas = env.PRIORITY_FEE;
    const maxPriorityFeePerGas = baseFeePerGas + priorityFeePerGas;

    const txObj = { nonce, from, to, gasLimit : 0, data: '', maxPriorityFeePerGas, priorityFeePerGas };
    return {contract, txObj};
}

/**
 * 트랜잭션 송신
 * @param {*} web3 
 * @param {*} txObj 
 * @param {*} account 
 * @returns 
 */
async function sendTransaction(web3, txObj, account, contract) {
    try {
        const signedTx = await web3.eth.accounts.signTransaction(txObj, account.privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        const {blockNumber} = await web3.eth.getTransactionReceipt(receipt.transactionHash);
        const events = await contract.getPastEvents('allEvents', {
            fromBlock: blockNumber,
            toBlock: blockNumber
        });
        console.log(`Transaction Hash: ${receipt.transactionHash}`)
        console.log(`Block number: ${blockNumber}`)
        return events;
    } catch (e) {
        console.log(e.message);
        return null;
    }
}

/**
 * 구독팩 생성
 * @param {*} packinfo
 * @param {*} create_num
 */
async function createSubscriptionPack(packInfo, account, keyIdx) {
    const web3 = getWeb3();
    const abiPath = `${__dirname}/../../../../${env.SUBSCRIPTION_CREATOR_ABI_PATH}`
    const {contract, txObj} = await getContractObject(web3, abiPath, env.SUBSCRIPTION_CREATOR, account);
    
    txObj.value = env.PACK_PRICE + "";
    const {from, value} = txObj;


    txObj.data = await contract.methods.createSubscription(packInfo, keyIdx).encodeABI();
    txObj.gasLimit = Math.round(
        await contract.methods.createSubscription(packInfo, keyIdx).estimateGas({from, value})
    );

    const events = await sendTransaction(web3, txObj, account, contract);
    if (events == null) {
        console.log('팩 발행 실패!');
        process.exit(-1);
    }

    const { pack } = events[0].returnValues;
    return pack;
}

/**
 * 팩 구매
 * @param {*} web3
 * @param {*} price
 * @param {*} packAddress
 * @param {*} userAccount
 */
async function buyPack(web3, price, packAddress, account, keyidx) {
    const abiPath = `${__dirname}/../../../../${env.SUBSCRIPTION_COMMANDER_ABI_PATH}`
    const {contract, txObj} = await getContractObject(web3, abiPath, packAddress, account);
    const {from} = txObj;

    txObj.value = env.PACK_PRICE + "";
    txObj.data = await contract.methods.buy(keyidx).encodeABI();

    const {value} = txObj;
    txObj.gasLimit = Math.round(
        await contract.methods.buy(keyIdx).estimateGas({from, value})
    );

    // DB에 저장
    await saveBuySync(account.publicKey, packAddress, keyidx);

    // 팩 구매
    const events = await sendTransaction(web3, txObj, account, contract);
    if (events == null) {
        console.log('팩 구매 실패!');
    }

    console.log(`팩 구매.`);
}

/**
 * 환불 요청
 * @param {*} web3
 * @param {*} packAddress
 * @param {*} userAccount
 */
async function refundPack(web3, packAddress, userAccount) {
    const abiPath = `${__dirname}/../../../../${env.SUBSCRIPTION_COMMANDER_ABI_PATH}`
    const {contract, txObj} = await getContractObject(web3, abiPath, packAddress, userAccount);
    const {from} = txObj;

    txObj.nonce = await web3.eth.getTransactionCount(from);
    txObj.gasLimit = Math.round(await contract.methods.requestRefund().estimateGas({from}));
    txObj.data = await contract.methods.requestRefund().encodeABI();

    const events = await sendTransaction(web3, txObj, userAccount, contract);
    if (events == null) {
        console.log('팩 환불 실패!');
        process.exit(-1);
    }   
        console.log('팩 환불');
}

/**
 * 계정 잔고 확인
 * @param {*} accounts
 */
async function checkBalance(accounts) {
    const balances = {};
    const web3 = getWeb3();
    const MIN_VAL = 0.5;

    let result = true;

    const issuer = web3.utils.fromWei(await web3.eth.getBalance(accounts.issuer.publicKey), "ether");
    balances['issuer'] = issuer;
    if (issuer < MIN_VAL) result = false;

    for (let i in accounts.buyers) {
        const buyer = accounts.buyers[i];
        balances[`buyer${i}`] = web3.utils.fromWei(await web3.eth.getBalance(buyer.publicKey), "ether");
        if (balances[`buyer${i}`] < MIN_VAL) result = false;
    }

    if (!result) {
        console.log(balances);
        console.log('계좌에 잔고가 부족합니다.')
        process.exit(-1);
    } else {
        console.log('Balance is Okay');
    }
    return result;
}

/**
 * 관리자 직권정산 시간을 수정한다.
 * @param {*} web3
 * @param {*} packAddress
 * @param {*} accounts
 * @param {*} param3
 * @param {*} */
async function setManagerCalcDate(packAddress, account, isLowquality = true) {
    const web3 = getWeb3();
    const abiPath = `${__dirname}/../../../../${env.SUBSCRIPTION_COMMANDER_ABI_PATH}`
    const {contract, txObj} = await getContractObject(web3, abiPath, packAddress, account);
    const {from} = txObj;

    if(isLowquality) {
        // 기간 해제
        txObj.data = await contract.methods.setRefundByManagerFromDeactivate(0).encodeABI();
        txObj.gasLimit = Math.round(await contract.methods.setRefundByManagerFromDeactivate(0).estimateGas({from}));
        let events = await sendTransaction(web3, txObj, account, contract);
        if (events == null) {
            console.log('직권 정산 시간 수정 실패');
            process.exit(-1);
        }

        // 기간 해제
        txObj.nonce = await web3.eth.getTransactionCount(from);    
        txObj.data = await contract.methods.setRefundByManagerFromUseEnd(0).encodeABI();
        txObj.gasLimit = Math.round(await contract.methods.setRefundByManagerFromUseEnd(0).estimateGas({from}));
        events = await sendTransaction(web3, txObj, account, contract);
        if (events == null) {
            console.log('직권 정산 시간 수정 실패');
            process.exit(-1);
        }
    } else {
        txObj.data = await contract.methods.setRefundTimestampForAll(0).encodeABI();
        txObj.gasLimit = Math.round(await contract.methods.setRefundTimestampForAll(0).estimateGas({from}));
        events = await sendTransaction(web3, txObj, account, contract);
        if (events == null) {
            console.log('직권 정산 시간 수정 실패');
            process.exit(-1);
        }
    }
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
    const sql = "select * from buypack where network = 'Matic' and targetpack = ? and buyer in (?)";
    const rows = await selectQuery(sql, [packAddress, buyers]);
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
    getWeb3, getAccounts, checkBalance, createPack, saveNodeSync, sleep, buyPack, isBuyPackProcessed, refundPack,
    isPackProcessed, saveBuySync, isPackRefunded, getDBKeyIdx
}