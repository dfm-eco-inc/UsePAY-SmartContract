const { ethers } = require('hardhat');
const helpers = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { beforeCommon, setAddresses, toggleContractStop } = require('./common/before-common');
const { deploy, getBalance } = require('./common/util');
const { MANAGERS, ADDRESSES } = require('./common/constants');
const { getTransactionLogs, getWeiParam, sleep } = require('../deploy/common/util');

describe('구독팩 테스트', function () {
    before(async function () {
        // 공통 실행 코드
        const result = await beforeCommon();
        for (let key in result) this[key] = result[key];

        // Subscription 커맨더 생성
        this.SubscriptionCommander = await deploy('SubscriptionCommander');
        this.addressesTargets.push([ADDRESSES.SUBSCR_COMMANDER, this.SubscriptionCommander.address]);
        console.log('    - 구독팩 커맨더 배포');

        // Ticket 크리에이터 생성
        this.SubscriptionCreator = await deploy('SubscriptionCreator');
        this.addressesTargets.push([ADDRESSES.SUBSCR_CREATOR, this.SubscriptionCreator.address]);
        console.log('    - 구독팩 크리에이터 배포');

        // 필수 컨트랙트 주소 설정
        await setAddresses(this.Addresses, this.addressesTargets, this.confirmCount, this.unlockTime);

        // 팩 기본 정보
        this.packCreateTime = await helpers.time.latest();
        this.packInfoGovToken = {
            tokenType: ADDRESSES.PAC_TOKEN,
            price: '1000000000000000000',
            total: 10,
            times0: this.packCreateTime,
            times1: this.packCreateTime + 300,
            times2: this.packCreateTime + 301,
            times3: this.packCreateTime + 86400
        };

        this.packInfoNativeToken = { ...this.packInfoGovToken };
        this.packInfoNativeToken.tokenType = ADDRESSES.NATIVE_TOKEN;

        // 기본팩 생성 - 판매 통화 : PAC
        feePrice = getWeiParam(await this.SubscriptionCommander.getCountFee(this.packInfoGovToken.total));
        tx = await this.SubscriptionCreator.createSubscription(this.packInfoGovToken, 1, { value: feePrice });
        this.packGovTokenAddr = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;

        // 기본팩 생성 - 판매 통화 : ETH
        tx = await this.SubscriptionCreator.createSubscription(this.packInfoNativeToken, 2, { value: feePrice });
        this.packNativeTokenAddr = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;

        // 기본팩 프록시 연결
        this.packGov = await this.SubscriptionCommander.attach(this.packGovTokenAddr);
        this.packNative = await this.SubscriptionCommander.attach(this.packNativeTokenAddr);
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
        const basePrice = parseInt(await this.SubscriptionCreator.getCountFee(1));
        await expect(parseInt(await this.SubscriptionCreator.getCountFee(10))).to.be.equal(basePrice);
        await expect(parseInt(await this.SubscriptionCreator.getCountFee(100))).to.be.equal(basePrice * 5);
        await expect(parseInt(await this.SubscriptionCreator.getCountFee(1000))).to.be.equal(basePrice * 10);
    });

    it('createSubscription() - 구독팩 생성', async function () {
        // 테스트 팩 정보
        let packInfo = { ...this.packInfoGovToken };

        // 생성 수수료
        const basePrice = parseInt(await this.SubscriptionCreator.getCountFee(1));
        let feePrice = getWeiParam(await this.SubscriptionCommander.getCountFee(packInfo.total));

        // 정상 생성
        tx = await this.SubscriptionCreator.createSubscription(packInfo, 1, { value: feePrice });
        let log = await getTransactionLogs(tx, 'CreateSubscriptionEvent');
        for (let key in packInfo) {
            await expect(packInfo[key] == log.packInfo[key]).to.be.equal(true);
        }

        // 수수료 없이 생성 불가
        await expect(this.SubscriptionCreator.createSubscription(packInfo, 2)).to.be.revertedWith(
            'C01 - Not enough fee'
        );

        // 수수료가 적은 경우
        feePrice = getWeiParam((await this.SubscriptionCommander.getCountFee(packInfo.total)) - 100);
        await expect(this.SubscriptionCreator.createSubscription(packInfo, 3, { value: feePrice })).to.be.revertedWith(
            'C01 - Not enough fee'
        );

        // 수수료가 큰 경우
        feePrice = getWeiParam((await this.SubscriptionCommander.getCountFee(packInfo.total)) + 100);
        tx = await this.SubscriptionCreator.createSubscription(packInfo, 4, { value: feePrice });
        let swappedAmount = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).swappedAmount;
        await expect(swappedAmount.gt(0)).to.be.equal(true);

        // 최대 발행 수량이 큰 경우
        packInfo.total = 1001;
        feePrice = getWeiParam((await this.SubscriptionCommander.getCountFee(packInfo.total)) + 100);
        await expect(this.SubscriptionCreator.createSubscription(packInfo, 5, { value: feePrice })).to.be.revertedWith(
            'C05 - Wrong total count'
        );

        // 발행 수량이 0인 경우
        packInfo.total = 0;
        feePrice = getWeiParam(await this.SubscriptionCommander.getCountFee(packInfo.total));
        await expect(this.SubscriptionCreator.createSubscription(packInfo, 5, { value: feePrice })).to.be.revertedWith(
            'C05 - Wrong total count'
        );
    });

    it('buy() - 팩 구매', async function () {
        // 구매자 설정
        const buyer = new ethers.Wallet(MANAGERS[2].privateKey, ethers.provider);
        let price = this.packInfoNativeToken.price;

        // 수수료 덜 보냈을 때 구매
        newPrice = getWeiParam(price - 100).toString();
        await expect(this.packNative.connect(buyer).buy({ value: newPrice })).to.be.revertedWith(
            'B03 - Not enough value'
        );

        // buyer가 일반 토큰으로 구매
        await this.packNative.connect(buyer).buy({ value: price });
        await expect((await this.packNative.viewUser(buyer.address)).hasCount).to.be.equal(1);

        // 1개 이상 구독팩을 구매하는 경우 오류
        await expect(this.packNative.connect(buyer).buy({ value: price })).to.be.revertedWith(
            'B00 - Already bought pack'
        );

        // ERC-20 팩 구매 테스트
        price = this.packInfoGovToken.price;

        // 수수료 덜 보냈을 때, (ERC-20 토큰 충전)
        let packBalance = await this.govToken.balanceOf(buyer.address);
        packBalance < price ? await this.govToken.transfer(buyer.address, price) : null; // 구매할 토큰이 부족하면 전송
        packBalance = await this.govToken.balanceOf(buyer.address);
        await this.govToken.connect(buyer).approve(this.packGov.address, (price - 100).toString()); // 팩이 가져갈 수 있는 토큰을 부족하게 설정
        await expect(this.packGov.connect(buyer).buy()).to.be.revertedWith('B03 - Not enough value');

        // buyer가 구매
        await this.govToken.connect(buyer).approve(this.packGov.address, price);
        await this.packGov.connect(buyer).buy();
        await expect((await this.packGov.viewUser(buyer.address)).hasCount).to.be.equal(1);

        // 1개 이상 구독팩을 구매하는 경우 오류
        await expect(this.packGov.connect(buyer).buy()).to.be.revertedWith('B00 - Already bought pack');
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

        feePrice = getWeiParam(await this.SubscriptionCommander.getCountFee(testPackInfo.total));
        tx = await this.SubscriptionCreator.createSubscription(testPackInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;
        pack = await this.SubscriptionCommander.attach(address);

        // 구매 가능한 시간대 [미만]일 때 구매 (2/2) - 구매 하기
        await expect(pack.connect(buyer).buy({ value: testPackInfo.price })).to.be.revertedWith(
            'B01 - Not available time for buy'
        );

        // 구매 가능한 시간대 [초과]일 때 구매 (2/2) - 팩 생성
        for (i = 0; i < 4; i++) testPackInfo[`times${i}`] -= 500;

        feePrice = getWeiParam(await this.SubscriptionCommander.getCountFee(testPackInfo.total));
        tx = await this.SubscriptionCreator.createSubscription(testPackInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;
        pack = await this.SubscriptionCommander.attach(address);

        // 구매 가능한 시간대 [초과]일 때 구매 (2/2) - 구매 하기
        await ethers.provider.send('evm_setNextBlockTimestamp', [testPackInfo.times1 + 1]);
        await expect(pack.connect(buyer).buy({ value: testPackInfo.price })).to.be.revertedWith(
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
        feePrice = getWeiParam(await this.SubscriptionCommander.getCountFee(packInfo.total));
        tx = await this.SubscriptionCreator.createSubscription(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;
        pack = await this.SubscriptionCommander.attach(address);

        // 구독팩은 한번에 하나만 선물 가능
        tx = await pack.connect(buyer).buy({ value: packInfo.price });
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(1);
        await expect(await pack.viewQuantity()).to.be.equal(packInfo.total - 1);
        await pack.connect(buyer).give([recievers[0]]);
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(0);
        await expect((await pack.viewUser(recievers[0])).hasCount).to.be.equal(1);

        // 한번에 여러명에게 선물하면 오류 - 구독팩은 하나만 소유 가능
        tx = await pack.connect(buyer).buy({ value: packInfo.price });
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(1);
        await expect(await pack.viewQuantity()).to.be.equal(packInfo.total - 2);
        await expect(pack.connect(buyer).give(recievers)).to.be.revertedWith(
            'Subscription packs can only be sent to one person'
        );

        // 송 수신자가 같은 경우 선물
        await pack.connect(buyer).give([buyer.address]);
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(1);

        // 수신자 보유량 초과 선물 - 같은 수신자 끼리
        await expect(pack.connect(buyer).give([recievers[1], recievers[1]])).to.be.revertedWith(
            'Subscription packs can only be sent to one person'
        );
    });

    it('refund() - Native Token 팩 2일내 환불', async function () {
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
        packInfo.times3 = packInfo.times2 + 86400 * 30; // 30 days

        // Native Token 팩 생성
        feePrice = getWeiParam(await this.SubscriptionCommander.getCountFee(packInfo.total));
        tx = await this.SubscriptionCreator.createSubscription(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;
        pack = await this.SubscriptionCommander.attach(address);
        beforeBalance = parseFloat(await getBalance(buyer.address));

        // 만료전 100% 환불 (1/2) - 팩 구매
        tx = await pack.connect(buyer).buy({ value: packInfo.price });
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(1);
        await expect(parseFloat(await getBalance(address))).to.be.equal(parseFloat(1));
        afterBalance = parseFloat(await getBalance(buyer.address));
        await expect(beforeBalance - afterBalance).to.be.gt(1);

        // 컨트랙 잠금시 기능 정지
        await toggleContractStop(this.EmergencyStop, this.confirmCount, true);
        await expect(pack.connect(buyer).requestRefund()).to.be.revertedWith('function not allowed');
        await toggleContractStop(this.EmergencyStop, this.confirmCount, false);

        // 만료전 100% 환불 (2/2) - 2일 내 환불
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times2 + (86400 * 2 - 5)]); // after 2 days
        await pack.connect(buyer).requestRefund();
        await expect(parseFloat(await getBalance(address))).to.be.equal(parseFloat(0));
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(0);
        refundBalance = parseFloat(await getBalance(buyer.address));
        await expect(refundBalance - afterBalance).to.be.gt(0.999);
    });

    it('refund() - Native Token 팩 만료 이후 환불', async function () {
        // 계정 설정
        const buyer = new ethers.Wallet(MANAGERS[4].privateKey, ethers.provider);

        // Native Token 팩 정보 만들기
        packInfo = { ...this.packInfoNativeToken };
        packTime = await helpers.time.latest();
        for (i = 0; i < 4; i++) packInfo[`times${i}`] = packTime;
        packInfo.total = 3;
        packInfo.times1 += 10;
        packInfo.times2 += 11;
        packInfo.times3 = packInfo.times2 + 86400 * 30; // 30 days

        // Native Token 팩 생성
        feePrice = getWeiParam(await this.SubscriptionCommander.getCountFee(packInfo.total));
        tx = await this.SubscriptionCreator.createSubscription(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;
        pack = await this.SubscriptionCommander.attach(address);
        beforeBalance = parseFloat(await getBalance(buyer.address));

        // 만료전 100% 환불 (1/2) - 팩 구매
        tx = await pack.connect(buyer).buy({ value: packInfo.price });
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(1);
        await expect(parseFloat(await getBalance(address))).to.be.equal(parseFloat(1));
        afterBalance = parseFloat(await getBalance(buyer.address));
        await expect(beforeBalance - afterBalance).to.be.gt(1);

        // 사용기간 만료 후 환불
        const RequestLimitMinute = 60; // 빠른 환불요청 대기 시간
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times3 + RequestLimitMinute + 1]);
        await expect(pack.connect(buyer).requestRefund()).to.be.revertedWith('N04 - Not available time for refund');
    });

    it('refund() - Native Token 30일 팩, 10일 후 환불', async function () {
        // 계정 설정
        const buyer = new ethers.Wallet(MANAGERS[4].privateKey, ethers.provider);

        // Native Token 팩 정보 만들기
        packInfo = { ...this.packInfoNativeToken };
        packTime = (await helpers.time.latest()) + 86400 * 50;
        for (i = 0; i < 4; i++) packInfo[`times${i}`] = packTime;
        packInfo.total = 3;
        packInfo.times1 += 10;
        packInfo.times2 += 11;
        packInfo.times3 = packInfo.times2 + 86400 * 30; // 30 days

        // Native Token 팩 생성
        feePrice = getWeiParam(await this.SubscriptionCommander.getCountFee(packInfo.total));
        tx = await this.SubscriptionCreator.createSubscription(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;
        pack = await this.SubscriptionCommander.attach(address);
        beforeBalance = parseFloat(await getBalance(buyer.address));

        // 만료전 66% 환불 (1/2) - 팩 구매
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times0 + 5]); // after 10 days
        tx = await pack.connect(buyer).buy({ value: packInfo.price });
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(1);
        await expect(parseFloat(await getBalance(address))).to.be.equal(parseFloat(1));
        afterBalance = parseFloat(await getBalance(buyer.address));
        await expect(beforeBalance - afterBalance).to.be.gt(1);

        // // 만료전 66% 환불 (2/2) - 10일 후 환불
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times2 + (86400 * 10 - 5)]); // after 10 days
        await pack.connect(buyer).requestRefund();
        refundBalance = parseFloat(await getBalance(buyer.address));
        await expect(refundBalance - afterBalance).to.be.gt(0.66);
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(0);
        await expect((await pack.viewUser(address)).hasCount).to.be.equal(0);
    });

    it('refund() - ERC-20 팩 2일내 환불', async function () {
        // 컨트랙 잠금 해제
        await toggleContractStop(this.EmergencyStop, this.confirmCount, false);

        // 계정 설정 - 인덱스 0번은 구매자, 나머지는 수신자
        const buyer = new ethers.Wallet(MANAGERS[4].privateKey, ethers.provider);

        // ERC-20 팩 정보 만들기
        packInfo = { ...this.packInfoGovToken };
        packTime = await helpers.time.latest();
        for (i = 0; i < 4; i++) packInfo[`times${i}`] = packTime;
        packInfo.total = 3;
        packInfo.times1 += 10;
        packInfo.times2 += 11;
        packInfo.times3 = packInfo.times2 + 86400 * 30; // 30 days

        // ERC-20 Token 팩 생성
        tx = await this.SubscriptionCreator.createSubscription(packInfo, 1, { value: packInfo.price });
        address = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;
        pack = await this.SubscriptionCommander.attach(address);

        // ERC-20 Token 입금
        let packBalance = await this.govToken.balanceOf(buyer.address);
        packBalance < packInfo.price ? await this.govToken.transfer(buyer.address, packInfo.price) : null; // 구매할 토큰이 부족하면 전송
        packBalance = await this.govToken.balanceOf(buyer.address);
        await this.govToken.connect(buyer).approve(address, packInfo.price); // 팩이 토큰을 가져가도록 허용

        // 만료전 100% 환불 (1/2) - 팩 구매
        tx = await pack.connect(buyer).buy();
        packBalance = await this.govToken.balanceOf(address);
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(1);
        await expect(parseFloat(ethers.utils.formatEther(await this.govToken.balanceOf(address)))).to.be.equal(
            parseFloat(1)
        );

        // 컨트랙 잠금시 기능 정지
        await toggleContractStop(this.EmergencyStop, this.confirmCount, true);
        await expect(pack.connect(buyer).requestRefund()).to.be.revertedWith('function not allowed');
        await toggleContractStop(this.EmergencyStop, this.confirmCount, false);

        // 만료전 100% 환불 (2/2) - 2일 내 환불
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times2 + (86400 * 2 - 5)]); // after 2 days
        await pack.connect(buyer).requestRefund();
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(0);
        await expect(parseFloat(ethers.utils.formatEther(await this.govToken.balanceOf(address)))).to.be.equal(
            parseFloat(0)
        );
        await expect(parseFloat(ethers.utils.formatEther(await this.govToken.balanceOf(buyer.address)))).to.be.equal(
            parseFloat(1)
        );
    });

    it('refund() - ERC-20 팩 만료 이후 환불', async function () {
        // 컨트랙 잠금 해제
        await toggleContractStop(this.EmergencyStop, this.confirmCount, false);

        // 계정 설정 - 인덱스 0번은 구매자, 나머지는 수신자
        const buyer = new ethers.Wallet(MANAGERS[4].privateKey, ethers.provider);

        // Native Token 팩 정보 만들기
        packInfo = { ...this.packInfoGovToken };
        packTime = await helpers.time.latest();
        for (i = 0; i < 4; i++) packInfo[`times${i}`] = packTime;
        packInfo.total = 3;
        packInfo.times1 += 10;
        packInfo.times2 += 11;
        packInfo.times3 = packInfo.times2 + 86400 * 30; // 30 days

        // ERC-20 Token 팩 생성
        tx = await this.SubscriptionCreator.createSubscription(packInfo, 1, { value: packInfo.price });
        address = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;
        pack = await this.SubscriptionCommander.attach(address);

        // ERC-20 Token 입금
        let packBalance = await this.govToken.balanceOf(buyer.address);
        packBalance < packInfo.price ? await this.govToken.transfer(buyer.address, packInfo.price) : null; // 구매할 토큰이 부족하면 전송
        packBalance = await this.govToken.balanceOf(buyer.address);
        await this.govToken.connect(buyer).approve(address, packInfo.price); // 팩이 토큰을 가져가도록 허용

        // 만료전 100% 환불 (1/2) - 팩 구매
        tx = await pack.connect(buyer).buy();
        packBalance = await this.govToken.balanceOf(address);
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(1);
        await expect(parseFloat(ethers.utils.formatEther(await this.govToken.balanceOf(address)))).to.be.equal(
            parseFloat(1)
        );

        // 사용기간 만료 후 환불
        const RequestLimitMinute = 60; // 빠른 환불요청 대기 시간
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times3 + RequestLimitMinute + 1]);
        await expect(pack.connect(buyer).requestRefund()).to.be.revertedWith('N04 - Not available time for refund');
    });

    it('refund() - ERC-20 30일 팩, 10일 후 환불', async function () {
        // 계정 설정
        const buyer = new ethers.Wallet(MANAGERS[4].privateKey, ethers.provider);

        // ERC-20 팩 정보 만들기
        packInfo = { ...this.packInfoGovToken };
        packTime = (await helpers.time.latest()) + 86400 * 50;
        for (i = 0; i < 4; i++) packInfo[`times${i}`] = packTime;
        packInfo.total = 3;
        packInfo.times1 += 10;
        packInfo.times2 += 11;
        packInfo.times3 = packInfo.times2 + 86400 * 30; // 30 days

        // ERC-20 Token 팩 생성
        tx = await this.SubscriptionCreator.createSubscription(packInfo, 1, { value: packInfo.price });
        address = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;
        pack = await this.SubscriptionCommander.attach(address);

        // ERC-20 Token 입금
        let packBalance = await this.govToken.balanceOf(buyer.address);
        packBalance < packInfo.price ? await this.govToken.transfer(buyer.address, packInfo.price) : null; // 구매할 토큰이 부족하면 전송
        packBalance = await this.govToken.balanceOf(buyer.address);
        await this.govToken.connect(buyer).approve(address, packInfo.price); // 팩이 토큰을 가져가도록 허용

        // // 만료전 66% 환불 (1/2) - 팩 구매
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times0 + 5]);
        tx = await pack.connect(buyer).buy();
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(1);
        await expect(parseFloat(ethers.utils.formatEther(await this.govToken.balanceOf(address)))).to.be.equal(
            parseFloat(1)
        );

        // 만료전 66% 환불 (2/2) - 10일 후 환불
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times2 + (86400 * 10 - 5)]); // after 10 days
        await pack.connect(buyer).requestRefund();
        packBalance = parseFloat(ethers.utils.formatEther(await this.govToken.balanceOf(address)));
        userBalance = parseFloat(ethers.utils.formatEther(await this.govToken.balanceOf(buyer.address)));
        await expect(userBalance).to.be.gt(0.66);
        await expect(packBalance).to.be.equal(0.33);
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(0);
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
        feePrice = getWeiParam(await this.SubscriptionCommander.getCountFee(packInfo.total));
        tx = await this.SubscriptionCreator.connect(issuer).createSubscription(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;
        pack = await this.SubscriptionCommander.attach(address);

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

    it('calculate() - 수익금 회수, 만료일 기준 30일 이내', async function () {
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
        feePrice = getWeiParam(await this.SubscriptionCommander.getCountFee(packInfo.total));
        tx = await this.SubscriptionCreator.connect(issuer).createSubscription(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;
        pack = await this.SubscriptionCommander.attach(address);

        // 팩 구매
        let packBalance = await this.govToken.balanceOf(buyer.address);
        packBalance < packInfo.price ? await this.govToken.transfer(buyer.address, packInfo.price) : null; // 구매할 토큰이 부족하면 전송
        await this.govToken.connect(buyer).approve(pack.address, packInfo.price); // 팩이 토큰을 가져가도록 허용
        tx = await pack.connect(buyer).buy();
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(1);
        await expect(parseFloat(ethers.utils.formatEther(await this.govToken.balanceOf(address)))).to.be.equal(1);

        // 팩 만료시간 이전 정산 시도 실패
        await expect(pack.connect(issuer).calculate()).to.be.revertedWith('CT01 - Not available time for calculate');

        // 소유자가 아닌 경우 정산 시도 실패
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times3 + 1]);
        await expect(pack.connect(buyer).calculate()).to.be.revertedWith('O01 - Only for issuer');

        // 컨트랙트 잠김 상태에서 정산 시도 실패
        await toggleContractStop(this.EmergencyStop, this.confirmCount, true);
        await expect(pack.connect(issuer).calculate()).to.be.revertedWith('function not allowed');
        await toggleContractStop(this.EmergencyStop, this.confirmCount, false);

        // 소유자가 정상 정산 시도 성공
        balance = await govToken.balanceOf(issuer.address);
        packBalance = await govToken.balanceOf(address);
        tx = await pack.connect(issuer).calculate();
        log = await getTransactionLogs(tx, 'CalculateEvent');
        userBalanceGap = ((await govToken.balanceOf(issuer.address)) - balance).toString();
        await expect(userBalanceGap).to.be.equal(packInfo.price.toString());
        await expect(log.calculatedAmount).to.be.equal(packInfo.price.toString());

        // 이미 정산된 팩 정산 시도 실패
        await expect(pack.connect(issuer).calculate()).to.be.revertedWith('CT03 - Already calculated pack');
    });

    it('calculate() - 수익금 회수, 만료일 기준 30일 이후', async function () {
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
        feePrice = getWeiParam(await this.SubscriptionCommander.getCountFee(packInfo.total));
        tx = await this.SubscriptionCreator.connect(issuer).createSubscription(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;
        pack = await this.SubscriptionCommander.attach(address);

        // 팩 구매
        let packBalance = await this.govToken.balanceOf(buyer.address);
        packBalance < packInfo.price ? await this.govToken.transfer(buyer.address, packInfo.price) : null; // 구매할 토큰이 부족하면 전송
        await this.govToken.connect(buyer).approve(pack.address, packInfo.price); // 팩이 토큰을 가져가도록 허용
        tx = await pack.connect(buyer).buy();
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(1);
        await expect(parseFloat(ethers.utils.formatEther(await this.govToken.balanceOf(address)))).to.be.equal(1);

        // 만료일 + 30일 이후 정산 시도
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times3 + (86400 * 31)]);
        await expect(pack.connect(issuer).calculate()).to.be.revertedWith('Only available within 30 days after times3');
    });

    it('start/confirm/launchCalculate() - ERC-20 팩, 직권 정산으로 수익금 회수, 만료일 기준 30일 이후', async function () {
        // 컨트랙트 잠굼 해제
        await toggleContractStop(this.EmergencyStop, this.confirmCount, false);

        // 계정 설정 - 인덱스 0번은 구매자, 나머지는 수신자
        this.defaultSigner = new ethers.Wallet(MANAGERS[2].privateKey, ethers.provider);
        const issuer = new ethers.Wallet(MANAGERS[5].privateKey, ethers.provider);
        const buyer = new ethers.Wallet(MANAGERS[6].privateKey, ethers.provider);

        // ERC-20 팩 정보 만들기
        packInfo = { ...this.packInfoGovToken };
        packTime = await helpers.time.latest() + (86400 * 60);
        for (i = 0; i < 4; i++) packInfo[`times${i}`] = packTime;
        packInfo.total = 3;
        packInfo.times1 += 10;
        packInfo.times2 += 11;
        packInfo.times3 += 20;

        // ERC-20 팩 생성 - 팩 가격만큼의 토큰 교환
        feePrice = getWeiParam(await this.SubscriptionCommander.getCountFee(packInfo.total));
        tx = await this.SubscriptionCreator.connect(issuer).createSubscription(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;
        pack = await this.SubscriptionCommander.attach(address);

        // 팩 구매
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times0 + 5]);
        let packBalance = await this.govToken.balanceOf(buyer.address);
        packBalance < packInfo.price ? await this.govToken.transfer(buyer.address, packInfo.price) : null; // 구매할 토큰이 부족하면 전송
        await this.govToken.connect(buyer).approve(pack.address, packInfo.price); // 팩이 토큰을 가져가도록 허용
        tx = await pack.connect(buyer).buy();
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(1);
        await expect(parseFloat(ethers.utils.formatEther(await this.govToken.balanceOf(address)))).to.be.equal(1);

        // 관리자가 아닌 계정은 멀티 사이닝 시작 실패
        await expect(pack.connect(buyer).startCalculate()).to.be.revertedWith('This address is not Manager');

        // 관리자가 아닌 계정은 직권 정산 실행 실패
        await expect(pack.connect(buyer).launchCalculate()).to.be.revertedWith('This address is not Manager');

        // 만료일 + 30일 이전에 호출 불가
        await expect(pack.connect(this.defaultSigner).startCalculate()).to.be.revertedWith(
            'Only available after 30 days from times3'
        );

        // 컨트랙트 잠굼 상태에서 호출 불가
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times3 + 86400 * 31]);
        await toggleContractStop(this.EmergencyStop, this.confirmCount, true);
        await expect(pack.connect(this.defaultSigner).startCalculate()).to.be.revertedWith('function not allowed');
        await toggleContractStop(this.EmergencyStop, this.confirmCount, false);

        // 멀티 사이닝 없이 직권 정산
        await expect(pack.connect(this.defaultSigner).launchCalculate()).to.be.revertedWith('Needed all confirmation');

        // 직권 정산 멀티사이닝 실행
        for (let i = 0; i < this.confirmCount; i++) {
            const wallet = new ethers.Wallet(MANAGERS[i].privateKey, ethers.provider);
            const signer = await pack.connect(wallet);
            if (i == 0) {
                await signer.startCalculate();
            } else {
                await signer.confirmCalculate();
            }
        }

        // 실행 지연 시간 없이 실행시 에러 
        await expect(pack.connect(this.defaultSigner).launchCalculate()).to.be.revertedWith(
            'Execution time is not reached'
        );

        // 직권 정산 전, 잔고 확인
        beforeManagerBalance = await this.govToken.balanceOf(this.defaultSigner.address);
        beforeIssuerBalance = await this.govToken.balanceOf(issuer.address);

        // 24시간 후로 강제 이동
        let currentBlockTime = await helpers.time.latest();
        currentBlockTime += this.unlockTime + 10;
        await ethers.provider.send('evm_setNextBlockTimestamp', [currentBlockTime]);

        // 직권 정산 실행 
        tx = await pack.connect(this.defaultSigner).launchCalculate();
        log = await getTransactionLogs(tx, 'LaunchCalculateEvent');
    
        // 직권 정산 후, 잔고 상황
        afterManagerBalance = await this.govToken.balanceOf(this.defaultSigner.address);
        afterIssuerBalance = await this.govToken.balanceOf(issuer.address);
        issuerBalanceGap = afterIssuerBalance - beforeIssuerBalance;
        managerBalanceGap = afterManagerBalance - beforeManagerBalance;
        packBalanace = await this.govToken.balanceOf(address);
        
        // 검증
        await expect(packBalance).to.be.equal(0);
        await expect(issuerBalanceGap.toString()).to.be.equal(log.calculatedAmount.toString()); // 98% 환불
        await expect(managerBalanceGap.toString()).to.be.equal(log.feeAmount.toString()); // 2% 수수료 
    });

    it('start/confirm/launchCalculate() - Native Token 팩, 직권 정산으로 수익금 회수, 만료일 기준 30일 이후', async function () {
        // 컨트랙트 잠굼 해제
        await toggleContractStop(this.EmergencyStop, this.confirmCount, false);

        // 계정 설정 - 인덱스 0번은 구매자, 나머지는 수신자
        this.defaultSigner = new ethers.Wallet(MANAGERS[2].privateKey, ethers.provider);
        const issuer = new ethers.Wallet(MANAGERS[5].privateKey, ethers.provider);
        const buyer = new ethers.Wallet(MANAGERS[6].privateKey, ethers.provider);

        // Native Token 팩 정보 만들기
        packInfo = { ...this.packInfoNativeToken };
        packTime = await helpers.time.latest();
        for (i = 0; i < 4; i++) packInfo[`times${i}`] = packTime;
        packInfo.total = 3;
        packInfo.times1 += 10;
        packInfo.times2 += 11;
        packInfo.times3 += 20;

        // Native token 팩 생성 - 팩 가격만큼의 토큰 교환
        feePrice = getWeiParam(await this.SubscriptionCommander.getCountFee(packInfo.total));
        tx = await this.SubscriptionCreator.connect(issuer).createSubscription(packInfo, 1, { value: feePrice });
        address = (await getTransactionLogs(tx, 'CreateSubscriptionEvent')).packAddress;
        pack = await this.SubscriptionCommander.attach(address);

        // 팩 구매
        tx = await pack.connect(buyer).buy({ value: packInfo.price });
        await expect((await pack.viewUser(buyer.address)).hasCount).to.be.equal(1);
        await expect(parseFloat(await getBalance(address))).to.be.equal(1);
        let packBalance = await getBalance(address);

        // 관리자가 아닌 계정은 멀티 사이닝 시작 실패
        await expect(pack.connect(buyer).startCalculate()).to.be.revertedWith('This address is not Manager');

        // 관리자가 아닌 계정은 직권 정산 실행 실패
        await expect(pack.connect(buyer).launchCalculate()).to.be.revertedWith('This address is not Manager');

        // 만료일 + 30일 이전에 호출 불가
        await expect(pack.connect(this.defaultSigner).startCalculate()).to.be.revertedWith(
            'Only available after 30 days from times3'
        );

        // 컨트랙트 잠굼 상태에서 호출 불가
        await ethers.provider.send('evm_setNextBlockTimestamp', [packInfo.times3 + 86400 * 31]);
        await toggleContractStop(this.EmergencyStop, this.confirmCount, true);
        await expect(pack.connect(this.defaultSigner).startCalculate()).to.be.revertedWith('function not allowed');
        await toggleContractStop(this.EmergencyStop, this.confirmCount, false);

        // 멀티 사이닝 없이 직권 정산
        await expect(pack.connect(this.defaultSigner).launchCalculate()).to.be.revertedWith('Needed all confirmation');

        // 직권 정산 멀티사이닝 실행
        for (let i = 0; i < this.confirmCount; i++) {
            const wallet = new ethers.Wallet(MANAGERS[i].privateKey, ethers.provider);
            const signer = await pack.connect(wallet);
            if (i == 0) {
                await signer.startCalculate();
            } else {
                await signer.confirmCalculate();
            }
        }

        // 실행 지연 시간 없이 실행시 에러
        await expect(pack.connect(this.defaultSigner).launchCalculate()).to.be.revertedWith(
            'Execution time is not reached'
        );

        // 직권 정산 전, 잔고 확인
        beforeIssuerBalance = await getBalance(issuer.address);
        beforeIssuerPACBalance = await this.govToken.balanceOf(issuer.address);

        // 24시간 후로 강제 이동
        let currentBlockTime = await helpers.time.latest();
        currentBlockTime += this.unlockTime + 10;
        await ethers.provider.send('evm_setNextBlockTimestamp', [currentBlockTime]);

        // 직권 정산 실행
        tx = await pack.connect(this.defaultSigner).launchCalculate();
        log = await getTransactionLogs(tx, 'LaunchCalculateEvent');

        // 직권 정산 후, 잔고 상황
        packBalance = await getBalance(address);
        afterIssuerBalance = await getBalance(issuer.address);
        afterIssuerPACBalance = await this.govToken.balanceOf(issuer.address);
        issuerBalanceGap = afterIssuerBalance - beforeIssuerBalance;
        issuerBalanceGap = parseFloat(ethers.utils.parseUnits(issuerBalanceGap.toString(), 'ether'));
        issuerPACGap = afterIssuerPACBalance - beforeIssuerPACBalance;
        aroundReturnWei = (packInfo.price / 100) * 89.8;

        // 검증
        await expect(parseInt(packBalance)).to.be.equal(0);
        await expect(parseFloat(issuerBalanceGap)).to.be.gt(aroundReturnWei); // 90% 환불
        await expect(issuerPACGap).to.be.gt(0); // 10% 거버넌스 토큰으로 환불
    });
});
