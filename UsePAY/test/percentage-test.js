const { ethers } = require('hardhat');
const { expect } = require('chai');
const { getTransactionLogs, getWeiParam } = require('../deploy/common/util');
const { MANAGERS, ADDRESSES } = require('./common/constants');
const { beforeCommon, setAddresses } = require('./common/before-common');
const { deploy } = require('./common/util');
const BigNumber = require('bignumber.js');

describe('Percentage 테스트', function () {
    before(async function () {
        this.percentage = await deploy('Percentage');
    });

    it('getPercentValue()', async function () {
        for (let i = 0; i <= 100; i++) {
            const price = '1234567890123456789';
            const result = await this.percentage.getPercentValue(price + '', i);

            BigNumber.config({ ROUNDING_MODE: 5 }); // HALF DOWN

            const bPrice = new BigNumber(price);
            const b1Price = bPrice.div(100);
            const bnPrice = b1Price.multipliedBy(i);
            const bRound = bnPrice.toFixed(0);

            expect(result).to.be.equal(bRound);
        }

        expect(true).to.be.true;
    });

    it('getTimePercent()', async function () {
        const startTime = 1667260800; //  1, Nov, 2022 AM 12:00:00
        const endTime   = 1668038400; // 10, Nov, 2022 AM 12:00:00

        const timeGap   = new BigNumber(endTime - startTime);
        const percent   = timeGap.div(100);

        BigNumber.config({ ROUNDING_MODE: 4 }); // HALF UP

        const TEST_START = [0, 3850, 11650, timeGap-30];
        const INCREASE_UNIT = 1;

        for (let j=0; j<TEST_START.length; j++) {
            for (let i = 0; i <= 50; i += INCREASE_UNIT) {
                const START = TEST_START[j] + i;

                if (START > timeGap) {
                    await expect(this.percentage.getTimePercent(timeGap.toString(), START)).to.be.revertedWith(
                        'getTimePercent Error'
                    );
                } else {
                    const currentPercent = new BigNumber(START).div(percent).toFixed(0);
                    const result = await this.percentage.getTimePercent(timeGap.toString(), START);
                    
                    expect(currentPercent).to.be.equal(result);
                }
            }
        }
    });
});
