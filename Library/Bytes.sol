// SPDX-License-Identifier: MIT
pragma solidity >= 0.7.0;
pragma experimental ABIEncoderV2;

contract Bytes {
    function addressToBytes(address a) private pure returns( bytes memory) {
        return abi.encodePacked(a);
    }
    
    
    function uintToBytes( uint24 a ) private pure returns( bytes memory ) {
        return abi.encodePacked(a);
    }
    
    function timeStampToBytes( uint256 a ) internal pure returns ( bytes memory ) {
        uint32 _a = uint32(a);
        return abi.encodePacked(_a);
    }
    
    function numToBytes( uint256 a ) internal pure returns( bytes memory ) {
        uint8 _a = uint8(a);
        return abi.encodePacked(_a);
    }
 
    function MergeBytes(bytes memory a, bytes memory b) internal pure returns (bytes memory c) {
        uint alen = a.length;
        uint totallen = alen + b.length;
        uint loopsa = (a.length + 31) / 32;
        uint loopsb = (b.length + 31) / 32;
        assembly {
            let m := mload(0x40)
            mstore(m, totallen)
            for {  let i := 0 } lt(i, loopsa) { i := add(1, i) } { mstore(add(m, mul(32, add(1, i))), mload(add(a, mul(32, add(1, i))))) }
            for {  let i := 0 } lt(i, loopsb) { i := add(1, i) } { mstore(add(m, add(mul(32, add(1, i)), alen)), mload(add(b, mul(32, add(1, i))))) }
            mstore(0x40, add(m, add(32, totallen)))
            c := m
        }
    }
    
    function numTimes(bytes memory _bytes ) internal view returns ( uint256 num ) {
        return ((_bytes.length - 4)/5);
    }
    function sliceBytes(bytes memory _bytes, uint256 _start, uint256 _length) internal pure returns (bytes memory ) {
        bytes memory tempBytes;
        assembly {
            switch iszero(_length)
                case 0 {

                    tempBytes := mload(0x40)
                    let lengthmod := and(_length, 31)
                    let mc := add(add(tempBytes, lengthmod), mul(0x20, iszero(lengthmod)))
                    let end := add(mc, _length)

                    for {
                        let cc := add(add(add(_bytes, lengthmod), mul(0x20, iszero(lengthmod))), _start)
                    } lt(mc, end) {
                        mc := add(mc, 0x20)
                        cc := add(cc, 0x20)
                    } {
                        mstore(mc, mload(cc))
                    }

                    mstore(tempBytes, _length)
                    mstore(0x40, and(add(mc, 31), not(31)))
                }
                default {
                    tempBytes := mload(0x40)
                    mstore(tempBytes, 0)
                    mstore(0x40, add(tempBytes, 0x20))
                }
        }
        return tempBytes;
    }
    
	function bytesToUint8(uint _offst, bytes memory _input) internal pure returns (uint8 _output) {
        assembly {
            _output := mload(add(_input, _offst))
        }
    } 
	function bytesToUint32(uint _offst, bytes memory _input) internal pure returns (uint32 _output) {
        
        assembly {
            _output := mload(add(_input, _offst))
        }
    } 
}