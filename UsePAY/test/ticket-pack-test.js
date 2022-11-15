const { ethers } = require('hardhat');
const helpers = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { beforeCommon, setAddresses, toggleContractStop } = require('./common/before-common');
const { deploy, getBalance } = require('./common/util');
const { MANAGERS, ADDRESSES } = require('./common/constants');
const { getTransactionLogs, getWeiParam, sleep } = require('../deploy/common/util');

describe('티켓팩 테스트', function () {
    before(async function () {
        // 공통 실행 코드
        const result = await beforeCommon();
        for (let key in result) this[key] = result[key];

        // Ticket 커맨더 생성
        this.TicketCommander = await deploy('TicketCommander');
        this.addressesTargets.push([ADDRESSES.TICKET_COMMANDER, this.TicketCommander.address]);
        console.log('    - 티켓 커맨더 배포');

        // Ticket 크리에이터 생성
        this.TicketCreator = await deploy('TicketCreator');
        this.addressesTargets.push([ADDRESSES.TICKET_CREATOR, this.TicketCreator.address]);
        console.log('    - 티켓 크리에이터 배포');

        // 필수 컨트랙트 주소 설정
        await setAddresses(this.Addresses, this.addressesTargets, this.confirmCount, this.unlockTime);

        // 팩 기본 정보
        this.packCreateTime = await helpers.time.latest();
        this.packInfoGovToken = {
            tokenType: ADDRESSES.PAC_TOKEN,
            price: '1000000000000000000',
            total: 10,
            maxCount: 10,
            noshowValue: 5,
            times0: this.packCreateTime,
            times1: this.packCreateTime + 300,
            times2: this.packCreateTime + 301,
            times3: this.packCreateTime + 86400
        };

        this.packInfoNativeToken = { ...this.packInfoGovToken };
        this.packInfoNativeToken.tokenType = ADDRESSES.NATIVE_TOKEN;

        // 기본팩 생성 - 판매 통화 : PAC
        feePrice = getWeiParam(await this.TicketCommander.getCountFee(this.packInfoGovToken.total));
        tx = await this.TicketCreator.createTicket(this.packInfoGovToken, 1, { value: feePrice });
        this.ticketPackGovTokenAddr = (await getTransactionLogs(tx, 'CreateTicketEvent')).packAddress;

        // 기본팩 생성 - 판매 통화 : ETH
        tx = await this.TicketCreator.createTicket(this.packInfoNativeToken, 2, { value: feePrice });
        this.ticketPackNativeTokenAddr = (await getTransactionLogs(tx, 'CreateTicketEvent')).packAddress;

        // 기본팩 프록시 연결
        this.packGov = await this.TicketCommander.attach(this.ticketPackGovTokenAddr);
        this.packNative = await this.TicketCommander.attach(this.ticketPackNativeTokenAddr);
    });

    it('viewInfo() - 팩 정보 조회', async function () {
        const packInfo = await this.packGov.viewInfo();
        for (let key in this.packInfo) {
            await expect(this.packInfo[key] == packInfo[key]).to.be.equal(true);
        }
    });

    it('viewOwner() - 팩 소유자 조회', async function () {
        const owner = await this.packGov.viewOwner();
        await expect(owner == this.defaultSigner.address).to.be.equal(true);
    });

    it('viewVersion() - 팩 배포 버전 조회', async function () {
        const version = await this.packGov.viewVersion();
        await expect(version > 1).to.be.equal(true);
    });

    it('viewQuantity() - 구매 가능한 수량 조회', async function () {
        const quantity = await this.packGov.viewQuantity();
        await expect(quantity >= 0).to.be.equal(true);
    });

    it('getCountFee() - 발행 수량에 범위 따른 수수료 부과', async function () {
        const basePrice = parseInt(await this.TicketCreator.getCountFee(1));
        await expect(parseInt(await this.TicketCreator.getCountFee(10))).to.be.equal(basePrice);
        await expect(parseInt(await this.TicketCreator.getCountFee(100))).to.be.equal(basePrice * 5);
        await expect(parseInt(await this.TicketCreator.getCountFee(1000))).to.be.equal(basePrice * 10);
    });

    it('createTicket() - 티켓팩 생성', async function () {
        // 테스트 팩 정보
        let packInfo = { ...this.packInfoGovToken };

        // 생성 수수료
        const basePrice = parseInt(await this.TicketCreator.getCountFee(1));
        let feePrice = getWeiParam(await this.TicketCommander.getCountFee(packInfo.total));

        // 정상 생성
        tx = await this.TicketCreator.createTicket(packInfo, 1, { value: feePrice });
        let log = await getTransactionLogs(tx, 'CreateTicketEvent');
        for (let key in packInfo) {
            await expect(packInfo[key] == log.packInfo[key]).to.be.equal(true);
        }

        // 수수료 없이 생성 불가
        await expect(this.TicketCreator.createTicket(packInfo, 2)).to.be.revertedWith('C01 - Not enough fee');

        // 수수료가 적은 경우
        feePrice = getWeiParam((await this.TicketCommander.getCountFee(packInfo.total)) - 100);
        await expect(this.TicketCreator.createTicket(packInfo, 3, { value: feePrice })).to.be.revertedWith(
            'C01 - Not enough fee'
        );
        
        // 수수료가 큰 경우
        feePrice = getWeiParam((await this.TicketCommander.getCountFee(packInfo.total)) + 100);
        tx = await this.TicketCreator.createTicket(packInfo, 4, { value: feePrice });
        let swappedAmount = (await getTransactionLogs(tx, 'CreateTicketEvent')).swappedAmount;
        await expect(swappedAmount.gt(0)).to.be.equal(true);

        // 최대 발행 수량이 큰 경우
        packInfo.total = 1001;
        feePrice = getWeiParam((await this.TicketCommander.getCountFee(packInfo.total)) + 100);
        await expect(this.TicketCreator.createTicket(packInfo, 5, { value: feePrice })).to.be.revertedWith(
            'C05 - Wrong total count'
        );

        // 발행 수량이 0인 경우
        packInfo.total = 0;
        feePrice = getWeiParam(await this.TicketCommander.getCountFee(packInfo.total));
        await expect(this.TicketCreator.createTicket(packInfo, 5, { value: feePrice })).to.be.revertedWith(
            'C05 - Wrong total count'
        );
    });

    it('viewTotalUsedCount() - 팩의 총 사용 수량 조회', async function () {
        await expect(parseInt(await this.packGov.viewTotalUsedCount())).to.be.equal(0);
    });

    it('buy() - 팩 구매', async function () {
        // 구매자 설정
        const buyer = new ethers.Wallet(MANAGERS[5].privateKey, ethers.provider);
        const price = this.packInfoNativeToken.price;

        // 일반 토큰으로 구매
        await this.packNative.connect(buyer).buy(1, 1, { value: price });
        await expect((await this.packNative.viewUser(buyer.address)).hasCount).to.be.equal(1);

        // 팩 토큰으로 구매
        let packBalance = await this.govToken.balanceOf(buyer.address);
        packBalance < price ? await this.govToken.transfer(buyer.address, price) : null; // 구매할 토큰이 부족하면 전송
        packBalance = await this.govToken.balanceOf(buyer.address);
        await this.govToken.connect(buyer).approve(this.packGov.address, price);
        await this.packGov.connect(buyer).buy(1, 2);
        await expect((await this.packGov.viewUser(buyer.address)).hasCount).to.be.equal(1);
        
        // 0 개 구매
        await expect(this.packNative.connect(buyer).buy(0, 3, { value: 0 })).to.be.revertedWith(
            'buyQuentity must be bigger than 0'
        );

        // 잔고 초과 구매
        buyCount = this.packInfoNativeToken.total + 1;
        newPrice = getWeiParam(buyCount * price).toString();
        await expect(this.packNative.connect(buyer).buy(buyCount, 4, { value: newPrice })).to.be.revertedWith(
            'B04 - Not enough quentity'
        );

        // 수수료 덜 보냈을 때 구매 
        newPrice = getWeiParam(price - 100).toString();
        await expect(this.packNative.connect(buyer).buy(1, 6, { value: newPrice })).to.be.revertedWith(
            'B03 - Not enough value'
        );
    });

    it('buy() - 팩 구매 가능시간 테스트', async function () {
        // 구매자 계정 설정
        let buyer = new ethers.Wallet(MANAGERS[2].privateKey, ethers.provider);

        // 구매 가능한 시간대 [미만]일 때 구매 (1/2) - 팩 생성
        let packCreateTime = (await helpers.time.latest()) + 500;
        testPackInfo = { ...this.packInfoNativeToken };
        testPackInfo.times0 = packCreateTime;
        testPackInfo.times1 = packCreateTime + 300;
        testPackInfo.times2 = packCreateTime + 301;
        testPackInfo.times3 = packCreateTime + 86400;

        feePrice = getWeiParam(await this.TicketCommander.getCountFee(testPackInfo.total));
        tx = await this.TicketCreator.createTicket(testPackInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateTicketEvent')).packAddress;
        pack = await this.TicketCommander.attach(address);

        // 구매 가능한 시간대 [미만]일 때 구매 (2/2) - 구매 하기
        await expect(pack.connect(buyer).buy(1, 1, { value: testPackInfo.price })).to.be.revertedWith(
            'B01 - Not available time for buy'
        );

        // 구매 가능한 시간대 [초과]일 때 구매 (2/2) - 팩 생성
        for (i = 0; i < 4; i++) testPackInfo[`times${i}`] -= 500;

        feePrice = getWeiParam(await this.TicketCommander.getCountFee(testPackInfo.total));
        tx = await this.TicketCreator.createTicket(testPackInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateTicketEvent')).packAddress;
        pack = await this.TicketCommander.attach(address);

        // 구매 가능한 시간대 [초과]일 때 구매 (2/2) - 구매 하기
        await ethers.provider.send('evm_setNextBlockTimestamp', [testPackInfo.times1 + 1]);
        await expect(pack.connect(buyer).buy(1, 1, { value: testPackInfo.price })).to.be.revertedWith(
            'B01 - Not available time for buy'
        );
    });

    it('give() - 구매한 팩 선물', async function () {
        // 계정 설정 - 인덱스 0번은 구매자, 나머지는 수신자
        let accounts = [];
        for (let i = 0; i < 3; i++) accounts.push(new ethers.Wallet(MANAGERS[i + 1].privateKey, ethers.provider));
        const buyer = accounts[0];
        const recievers = accounts.filter((_v, i) => i > 0).map((v) => v.address);

        // 팩 정보 만들기
        const packInfo = { ...this.packInfoNativeToken };
        const packTime = await helpers.time.latest();
        for (i = 0; i < 4; i++) packInfo[`times${i}`] = packTime + (i + 500);
        packInfo.times0 = packTime;
        packInfo.maxCount = 2;

        // 팩 생성
        feePrice = getWeiParam(await this.TicketCommander.getCountFee(packInfo.total));
        tx = await this.TicketCreator.createTicket(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateTicketEvent')).packAddress;
        pack = await this.TicketCommander.attach(address);

        // 팩 구매
        buyCount = recievers.length;
        buyPrice = getWeiParam(packInfo.price * buyCount);
        tx = await pack.connect(buyer).buy(buyCount, 1, { value: buyPrice });
        await expect((await getTransactionLogs(tx, 'BuyEvent')).buyQuantity).to.be.equal(buyCount);
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(buyCount);
        await expect(await pack.viewQuantity()).to.be.equal(packInfo.total - buyCount);

        // 정상 선물
        await pack.connect(buyer).give(recievers);
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(0);
        await expect((await pack.viewUser(recievers[0])).hasCount).to.be.equal(1);
        await expect((await pack.viewUser(recievers[1])).hasCount).to.be.equal(1);

        // 송 수신자가 같은 경우 선물 (1/2) - 추가 구매
        buyPrice = getWeiParam(packInfo.price * buyCount);
        tx = await pack.connect(buyer).buy(buyCount, 2, { value: buyPrice });
        await expect((await getTransactionLogs(tx, 'BuyEvent')).buyQuantity).to.be.equal(buyCount);
        await expect(await pack.viewQuantity()).to.be.equal(packInfo.total - buyCount * 2);

        // 송 수신자가 같은 경우 선물 (2/2) - 셀프 선물
        tx = await pack.connect(buyer).give([buyer.address]);
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(buyCount);

        // 수신자 보유량 초과 선물 - 같은 수신자 끼리
        await expect(pack.connect(buyer).give([recievers[0], recievers[0]])).to.be.revertedWith(
            'B05 - Exceeding the available quantity'
        );

        // 수신자 보유량 초과 선물
        await pack.connect(buyer).give([recievers[1]]);
        await expect(pack.connect(buyer).give([recievers[1]])).to.be.revertedWith(
            'B05 - Exceeding the available quantity'
        );
    });

    it('use() - 팩 사용', async function () {
        // 계정 설정 - 인덱스 0번은 구매자, 나머지는 수신자
        const buyer = new ethers.Wallet(MANAGERS[2].privateKey, ethers.provider);

        // 팩 정보 만들기
        packInfo = { ...this.packInfoNativeToken };
        packTime = await helpers.time.latest();
        for (i = 0; i < 4; i++) packInfo[`times${i}`] = packTime;
        packInfo.total = 2;
        packInfo.times1 += 10;
        packInfo.times2 += 11;
        packInfo.times3 += 20;

        // 팩 생성
        feePrice = getWeiParam(await this.TicketCommander.getCountFee(packInfo.total));
        tx = await this.TicketCreator.createTicket(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateTicketEvent')).packAddress;
        pack = await this.TicketCommander.attach(address);

        // 팩 구매
        buyPrice = getWeiParam(packInfo.price * packInfo.total);
        tx = await pack.connect(buyer).buy(packInfo.total, 1, { value: buyPrice });
        await expect((await getTransactionLogs(tx, 'BuyEvent')).buyQuantity).to.be.equal(packInfo.total);
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(packInfo.total);

        // 사용 시간 이전
        await expect(pack.connect(buyer).use(1)).to.be.revertedWith('U01 - Not available time for use');

        // 정상 사용
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times2 + 1]);
        tx = await pack.connect(buyer).use(1);
        await expect((await getTransactionLogs(tx, 'UseEvent')).useQuantity).to.be.equal(1);
        await expect((await pack.viewUser(buyer.address)).useCount).to.be.equal(1);

        // 사용 시간 초과
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times3 + 1]);
        await expect(pack.connect(buyer).use(1)).to.be.revertedWith('U01 - Not available time for use');

        // 보유 수량 없는팩 사용 (1/4) - 팩 생성
        packInfo = { ...this.packInfoNativeToken };
        packTime = await helpers.time.latest();
        for (i = 0; i < 4; i++) packInfo[`times${i}`] = packTime;
        packInfo.times1 += 10;
        packInfo.times2 += 11;
        packInfo.times3 += 20;
        feePrice = getWeiParam(await this.TicketCommander.getCountFee(packInfo.total));
        tx = await this.TicketCreator.createTicket(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateTicketEvent')).packAddress;
        pack = await this.TicketCommander.attach(address);

        // 보유 수량 없는팩 사용 (2/4) - 팩 구매
        await pack.connect(buyer).buy(1, 1, { value: getWeiParam(packInfo.price) });

        // 보유 수량 없는팩 사용 (3/4) - 팩 사용
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times2 + 1]);
        await pack.connect(buyer).use(1);

        // 보유 수량 없는팩 사용 (4/4) - 잔여 수량 없는 팩 사용
        await expect(pack.connect(buyer).use(1)).to.be.revertedWith('U02 - Not enough owned count');
    });

    it('refund() - Native Token 팩 환불', async function () {
        // 컨트랙 잠금 해제
        await toggleContractStop(this.EmergencyStop, this.confirmCount, false);

        // 계정 설정 - 인덱스 0번은 구매자, 나머지는 수신자
        const buyer = new ethers.Wallet(MANAGERS[4].privateKey, ethers.provider);

        // Native Token 팩 정보 만들기
        packInfo = { ...this.packInfoNativeToken };
        packTime = await helpers.time.latest();
        for (i = 0; i < 4; i++) packInfo[`times${i}`] = packTime;
        packInfo.total = 3;
        packInfo.times1 += 10;
        packInfo.times2 += 11;
        packInfo.times3 += 20;

        // Native Token 팩 생성
        feePrice = getWeiParam(await this.TicketCommander.getCountFee(packInfo.total));
        tx = await this.TicketCreator.createTicket(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateTicketEvent')).packAddress;
        pack = await this.TicketCommander.attach(address);

        // Native Token 팩 구매
        buyPrice = getWeiParam(packInfo.price * packInfo.total);
        tx = await pack.connect(buyer).buy(packInfo.total, 1, { value: buyPrice });
        await expect((await getTransactionLogs(tx, 'BuyEvent')).buyQuantity).to.be.equal(packInfo.total);
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(packInfo.total);
        await expect(parseFloat(await getBalance(address))).to.be.equal(parseFloat(packInfo.total));

        // 사용기간 만료 전 환불 - 100%  환불
        await pack.connect(buyer).requestRefund(1);
        await expect(parseFloat(await getBalance(address))).to.be.equal(parseFloat(packInfo.total - 1));
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(packInfo.total - 1);

        // 컨트랙 잠금시 기능 정지
        await toggleContractStop(this.EmergencyStop, this.confirmCount, true);
        await expect(pack.connect(buyer).requestRefund(1)).to.be.revertedWith('function not allowed');

        // 사용기간 만료 후 환불 - 노쇼 비율 제외한 환불
        await toggleContractStop(this.EmergencyStop, this.confirmCount, false);
        let ether = 1000000000000000000;
        const noShowAmount = ether - packInfo.noshowValue * 0.01 * ether; // 노쇼 수수료 제외 환불금
        const feeAmount = noShowAmount - noShowAmount * 0.05; // 관리 수수료 제외 환불금
        const RequestLimitMinute = 60; // 빠른 환불요청 대기 시간
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times3 + RequestLimitMinute + 1]);
        tx = await pack.connect(buyer).requestRefund(1);
        log = await getTransactionLogs(tx, 'RequestRefundEvent');
        await expect(parseInt(log.refundedAmount)).to.be.equal(feeAmount);
    });

    it('refund() - ERC-20 팩 환불', async function () {
        // 컨트랙 잠금 해제
        await toggleContractStop(this.EmergencyStop, this.confirmCount, false);

        // 계정 설정 - 인덱스 0번은 구매자, 나머지는 수신자
        const buyer = new ethers.Wallet(MANAGERS[5].privateKey, ethers.provider);

        // ERC-20 팩 정보 만들기
        packInfo = { ...this.packInfoGovToken };
        packTime = await helpers.time.latest();
        for (i = 0; i < 4; i++) packInfo[`times${i}`] = packTime;
        packInfo.total = 3;
        packInfo.times1 += 10;
        packInfo.times2 += 11;
        packInfo.times3 += 20;

        // ERC-20 팩 생성
        feePrice = getWeiParam(await this.TicketCommander.getCountFee(packInfo.total));
        tx = await this.TicketCreator.createTicket(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateTicketEvent')).packAddress;
        pack = await this.TicketCommander.attach(address);

        // ERC-20 팩 구매
        buyPrice = getWeiParam(packInfo.price * packInfo.total);
        let packBalance = await this.govToken.balanceOf(buyer.address);
        packBalance < buyPrice ? await this.govToken.transfer(buyer.address, buyPrice) : null; // 구매할 토큰이 부족하면 전송
        await this.govToken.connect(buyer).approve(pack.address, buyPrice); // 팩이 토큰을 가져가도록 허용
        tx = await pack.connect(buyer).buy(packInfo.total, 1);
        await expect((await getTransactionLogs(tx, 'BuyEvent')).buyQuantity).to.be.equal(packInfo.total);
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(packInfo.total);
        await expect(parseFloat(ethers.utils.formatEther(await this.govToken.balanceOf(address)))).to.be.equal(packInfo.total);

        // 사용기간 만료 전 환불 - 100%  환불
        let myBalance = await this.govToken.balanceOf(buyer.address);
        await pack.connect(buyer).requestRefund(1);
        await expect(parseFloat(ethers.utils.formatEther(await this.govToken.balanceOf(address)))).to.be.equal(
            parseFloat(packInfo.total - 1)
        );
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(packInfo.total - 1);
        myBalanceChanged = ethers.utils.formatEther((await this.govToken.balanceOf(buyer.address) - myBalance).toString());
        await expect(parseFloat(myBalanceChanged)).to.be.equal(1);

        // 컨트랙 잠금시 기능 정지
        await toggleContractStop(this.EmergencyStop, this.confirmCount, true);
        await expect(pack.connect(buyer).requestRefund(1)).to.be.revertedWith('function not allowed');

        // 사용기간 만료 후 환불 - 노쇼 비율 제외한 환불
        await toggleContractStop(this.EmergencyStop, this.confirmCount, false);
        let ether = 1000000000000000000;
        const noShowAmount = ether - packInfo.noshowValue * 0.01 * ether; // 노쇼 수수료 제외 환불금
        const feeAmount = noShowAmount - noShowAmount * 0.02; // 토큰 관리 수수료 제외 환불금
        const RequestLimitMinute = 60; // 빠른 환불요청 대기 시간
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times3 + RequestLimitMinute + 1]);
        myBalanceBefore = await this.govToken.balanceOf(buyer.address);
        tx = await pack.connect(buyer).requestRefund(1);
        myBalanceAfter = await this.govToken.balanceOf(buyer.address);
        gab = myBalanceAfter - myBalanceBefore;
        await expect(gab).to.be.equal(feeAmount);
    });

    it('calculate() - 미사용팩 수수료 정산', async function () {
        // 계정 설정 - 인덱스 0번은 구매자, 나머지는 수신자
        const issuer = new ethers.Wallet(MANAGERS[5].privateKey, ethers.provider);
        const buyer = new ethers.Wallet(MANAGERS[6].privateKey, ethers.provider);
        
        // ERC-20 팩 정보 만들기
        packInfo = { ...this.packInfoGovToken };
        packTime = await helpers.time.latest();
        for (i = 0; i < 4; i++) packInfo[`times${i}`] = packTime;
        packInfo.total = 3;
        packInfo.times1 += 10;
        packInfo.times2 += 11;
        packInfo.times3 += 20;

        // ERC-20 팩 생성 - 팩 가격만큼의 토큰 교환
        feePrice = getWeiParam(await this.TicketCommander.getCountFee(packInfo.total));
        tx = await this.TicketCreator.connect(issuer).createTicket(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateTicketEvent')).packAddress;
        pack = await this.TicketCommander.attach(address);

        // 팩 구매
        buyPrice = getWeiParam(packInfo.price * packInfo.total);
        let packBalance = await this.govToken.balanceOf(buyer.address);
        packBalance < buyPrice ? await this.govToken.transfer(buyer.address, buyPrice) : null; // 구매할 토큰이 부족하면 전송
        await this.govToken.connect(buyer).approve(pack.address, buyPrice); // 팩이 토큰을 가져가도록 허용
        tx = await pack.connect(buyer).buy(packInfo.total, 1);
        await expect((await getTransactionLogs(tx, 'BuyEvent')).buyQuantity).to.be.equal(packInfo.total);
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(packInfo.total);
        await expect(parseFloat(ethers.utils.formatEther(await this.govToken.balanceOf(address)))).to.be.equal(
            packInfo.total
        );

        // 소유자가 아닌 경우 정산 시도 실패
        await expect(pack.connect(buyer).calculate()).to.be.revertedWith('O01 - Only for issuer');

        // 컨트랙트 잠김 상태에서 정산 시도 실패
        await toggleContractStop(this.EmergencyStop, this.confirmCount, true);
        await expect(pack.connect(issuer).calculate()).to.be.revertedWith('function not allowed');

        // 팩 만료시간 이전 정산 시도 실패
        await toggleContractStop(this.EmergencyStop, this.confirmCount, false);
        await expect(pack.connect(issuer).calculate()).to.be.revertedWith('CT01 - Not available time for calculate');

        // 소유자가 정상 정산 시도 성공
        // 참고 : 만약 테스트가 실패한다면 테스트 네트워크의 버그일 수 있으니, 네트워크를 재시작해보세요.
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times3 + 1]);
        balance = await govToken.balanceOf(issuer.address);
        packBalance = await govToken.balanceOf(address);
        fee = packBalance / 100 * packInfo.noshowValue;
        tx = await pack.connect(issuer).calculate();
        log = await getTransactionLogs(tx, 'CalculateEvent');
        userBalanceGap = ((await govToken.balanceOf(issuer.address)) - balance).toString();
        await expect(userBalanceGap).to.be.equal(fee.toString());
        await expect(log.calculatedAmount).to.be.equal(fee.toString());

        // 이미 정산된 팩 정산 시도 실패
        await expect(pack.connect(issuer).calculate()).to.be.revertedWith('CT03 - Already calculated pack');
    });

    it('changeTotal() - 팩수량 변경', async function () {
        const issuer = this.defaultSigner;

        // ERC-20 팩 정보 만들기
        packInfo = { ...this.packInfoGovToken };
        packTime = await helpers.time.latest();
        for (i = 0; i < 4; i++) packInfo[`times${i}`] = packTime;
        packInfo.times1 += 10;
        packInfo.times2 += 11;
        packInfo.times3 += 20;

        // 팩 생성
        feePrice = getWeiParam(await this.TicketCommander.getCountFee(packInfo.total));
        tx = await this.TicketCreator.connect(issuer).createTicket(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateTicketEvent')).packAddress;
        pack = await this.TicketCommander.attach(address);

        const currentTotal = packInfo.total;

        // 보유수량보다 적은 수로 변경
        let targetCount = currentTotal - 5;
        await pack.changeTotal(targetCount);
        await expect((await pack.viewInfo()).total).to.be.equal(targetCount);

        // 현재 보유 수량보다 큰 수로 변경 - 수수료 보내지 않음.
        targetCount = currentTotal;
        await expect(pack.changeTotal(targetCount)).to.be.revertedWith('C01 - Not enough fee');

        // 현재 보유 수량보다 큰 수로 변경 - 수수료 부족한 경우.
        feePrice = getWeiParam((await pack.getCountFee(targetCount)) - 100);
        await expect(pack.changeTotal(targetCount, { value: feePrice })).to.be.revertedWith('C01 - Not enough fee');

        // 현재 보유 수량보다 큰 수로 변경 - 수수료 많은 경우
        feePrice = getWeiParam((await pack.getCountFee(targetCount)) + 100);
        tx = await pack.changeTotal(targetCount, { value: feePrice });
        const swappedAmount = (await getTransactionLogs(tx, 'ChangeTotalEvent')).swappedAmount;
        await expect(swappedAmount.gt(0)).to.be.equal(true);

        // 최대 보유 수량을 초과한 경우
        targetCount = 3001;
        feePrice = getWeiParam(await pack.getCountFee(targetCount));
        await expect(pack.changeTotal(targetCount, { value: feePrice })).to.be.revertedWith('C05 - Wrong total count');

        // 수량을 0개로 변경하는 경우
        targetCount = 0;
        feePrice = getWeiParam(await pack.getCountFee(0));
        await pack.changeTotal(targetCount, { value: feePrice });

        // 팩 소유자가 아닌 계정이 변경하려는 경우
        targetCount = 0;
        feePrice = getWeiParam(await pack.getCountFee(0));
        await expect(
            pack.connect(MANAGERS[1].address).changeTotal(targetCount, { value: feePrice })
        ).to.be.revertedWith('O01 - Only for issuer');

        // 원복
        feePrice = getWeiParam(await pack.getCountFee(currentTotal));
        await pack.changeTotal(currentTotal, { value: feePrice });
    });
});
