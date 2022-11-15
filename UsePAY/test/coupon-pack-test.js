const { ethers } = require('hardhat');
const { expect } = require('chai');
const { getTransactionLogs, getWeiParam } = require('../deploy/common/util');
const { MANAGERS, ADDRESSES } = require('./common/constants');
const { beforeCommon, setAddresses } = require('./common/before-common');
const { deploy } = require('./common/util');

describe('쿠폰팩 테스트', function () {
    // 쿠폰팩 테스트
    before(async function () {
        // 공통 실행 코드 
        const result = await beforeCommon();
        for (let key in result) this[key] = result[key];

        // Coupon 커맨더 생성
        this.CouponCommander = await deploy('CouponCommander');
        this.addressesTargets.push([ADDRESSES.COUPON_COMMANDER, this.CouponCommander.address]);
        console.log('    - 쿠폰 커맨더 배포');

        // Coupon 크리에이터 생성
        this.CouponCreator = await deploy('CouponCreator');
        this.addressesTargets.push([ADDRESSES.COUPON_CREATOR, this.CouponCreator.address]);
        console.log('    - 쿠폰 크리에이터 배포');

        // 필수 컨트랙트 주소 설정
        await setAddresses(this.Addresses, this.addressesTargets, this.confirmCount, this.unlockTime);

        // 쿠폰팩 생성
        const currentTimestamp = Math.floor(Date.now() / 1000);
        this.packInfo = {
            total: 10,
            maxCount: 10,
            times0: currentTimestamp - 86400,
            times1: currentTimestamp - 1,
            times2: currentTimestamp,
            times3: currentTimestamp + 86400
        };
        tx = await this.CouponCreator.createCoupon(this.packInfo, 1);
        this.couponPackAddress = (await getTransactionLogs(tx, 'CreateCouponEvent')).packAddress;
        console.log('    - 신규 쿠폰팩 생성');

        // 쿠폰팩 프록시 연결
        this.pack = await this.CouponCommander.attach(this.couponPackAddress);
    });

    it('viewInfo() - 팩 정보 조회', async function () {
        const packInfo = await this.pack.viewInfo();
        for (let key in this.packInfo) {
            await expect(this.packInfo[key] == packInfo[key]).to.be.equal(true);
        }
    });

    it('viewOwner() - 팩 소유자 조회', async function () {
        const owner = await this.pack.viewOwner();
        await expect(owner == this.defaultSigner.address).to.be.equal(true);
    });

    it('viewVersion() - 팩 배포 버전 조회', async function () {
        const version = await this.pack.viewVersion();
        await expect(version > 1).to.be.equal(true);
    });

    it('viewQuantity() - 구매 가능한 수량 조회', async function () {
        const quantity = await this.pack.viewQuantity();
        await expect(quantity >= 0).to.be.equal(true);
    });
    
    it("getCountFee() - 발행 수량에 범위 따른 수수료 부과", async function () {
        const basePrice = parseInt(await this.CouponCreator.getCountFee(1));
        await expect(parseInt(await this.CouponCreator.getCountFee(10))).to.be.equal(basePrice);
        await expect(parseInt(await this.CouponCreator.getCountFee(100))).to.be.equal(basePrice * 5);
        await expect(parseInt(await this.CouponCreator.getCountFee(1000))).to.be.equal(basePrice * 10);
    });

    it('changeTotal() - 팩수량 변경', async function () {
        // 현재 보유량
        const pack = this.pack;
        const currentTotal = (await pack.viewInfo()).total;

        // 보유수량보다 적은 수로 변경
        let targetCount = currentTotal - 5;
        await pack.changeTotal(targetCount);
        await expect((await pack.viewInfo()).total).to.be.equal(targetCount);

        // 현재 보유 수량보다 큰 수로 변경 - 수수료 보내지 않음.
        targetCount = currentTotal;
        await expect(pack.changeTotal(targetCount)).to.be.revertedWith('C01 - Not enough fee');
        
        // 현재 보유 수량보다 큰 수로 변경 - 수수료 부족한 경우.
        let feePrice = getWeiParam((await pack.getCountFee(targetCount)) - 100);
        await expect(pack.changeTotal(targetCount, { value: feePrice })).to.be.revertedWith('C01 - Not enough fee');

        // 현재 보유 수량보다 큰 수로 변경 - 수수료 많은 경우
        feePrice = getWeiParam(await pack.getCountFee(targetCount) + 100);
        tx = await pack.changeTotal(targetCount, { value: feePrice });
        const swappedAmount = (await getTransactionLogs(tx, 'ChangeTotalEvent')).swappedAmount
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
        await expect(pack.connect(MANAGERS[1].address).changeTotal(targetCount, { value: feePrice })).to.be.revertedWith('O01 - Only for issuer');

        // 원복 
        feePrice = getWeiParam(await pack.getCountFee(currentTotal));
        await pack.changeTotal(currentTotal, { value: feePrice });
    });
});
