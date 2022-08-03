// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "../../Pack/CouponPack.sol";
import "../../Commander/KLAYTN/KLA_Commander.sol";

contract KLA_CouponCreator is KLA_Commander, Coupon {
    event createCouponEvent(address indexed pack, uint256 createNum, PackInfo packInfo); // 0: pack indexed, 2: createTime, 3: PackInfo

    function createCoupon(PackInfo calldata _packInfo, uint256 _createNum) external payable {
        require(_packInfo.total <= 3000, "C05");
        checkFee(packInfo.total);
        (, bytes memory managerAddress) = address(iAddresses).staticcall(
            abi.encodeWithSignature("viewAddress(uint16)", 0)
        );
        _transfer(100, abi.decode(managerAddress, (address)), msg.value);
        CouponPack pers = new CouponPack(_packInfo, msg.sender);
        emit createCouponEvent(address(pers), _createNum, _packInfo);
    }

    function viewVersion() external view returns (uint8) {
        return ver;
    }
}
