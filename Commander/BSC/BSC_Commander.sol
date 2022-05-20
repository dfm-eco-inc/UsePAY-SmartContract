// SPDX-License-Identifier: GNU LGPLv3
pragma solidity >= 0.7.0;
pragma experimental ABIEncoderV2;

import "../../Storage/WrapAddresses.sol";

contract Commander is WrapAddresses {
    
    event giftEvent(address indexed pack,address fromAddr ,address[] toAddr); // 0: pack indexed, 1: from, 2: to, 3: count
    event giveEvent(address indexed pack,address fromAddr ,address[] toAddr); // 0: pack indexed, 1: from, 2: to, 3: count
    
    
    function _transfer(uint16 tokenType, address _to , uint256 value ) internal {
        if ( tokenType == 100 ) {
            payable(_to).transfer(value);
        } else { 
            (bool success0,bytes memory tokenResult) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",uint16(tokenType)));
            require(success0,"0");
            (bool success, ) = address(abi.decode(tokenResult,(address))).call(abi.encodeWithSignature("transfer(address,uint256)",_to,value));
            require(success,"TOKEN transfer Fail");
        }
    }

    function _getBalance(uint16 tokenType) internal view returns (uint256) {
        uint balance = 0;
        if ( tokenType ==  100  ) {
            balance = address(this).balance;
        } else {
            (,bytes memory tokenResult) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",uint16(tokenType)));
            (,bytes memory result) = address(abi.decode(tokenResult,(address))).staticcall(abi.encodeWithSignature("balanceOf(address)",address(this)));
            balance = abi.decode(result,(uint256));
        }   
        return balance;
    }
    
    
    function _swap( uint16 _index, address _to, uint256 amountIn ) internal returns (uint256) {
        (,bytes memory result0 ) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",1200));
        (address routerAddr) = abi.decode(result0,(address));
        ( ,bytes memory resultDFM ) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",_index));
        // if ( _fromToken == address(0) ) {
            uint deadline = block.timestamp + 1000;
            address[] memory path = new address[](2);
            (, bytes memory resultWETH) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",uint16(103)));
            path[0] = abi.decode(resultWETH,(address));
            path[1] = abi.decode(resultDFM,(address));
            (bool success, bytes memory result) = address( routerAddr ).call{ value: amountIn }(abi.encodeWithSignature("swapExactETHForTokens(uint256,address[],address,uint256)",0,path,_to,deadline));
            (uint256[] memory amountOut) = abi.decode(result,(uint256[]));
            require( success , "swap ETH->TOKEN fail" );
            return amountOut[1];
        // } else {
        //     ( bool success1,) = address( _fromToken ).call( abi.encodeWithSignature( "approve(address,uint256)", routerAddr, amountIn ) );
        //     require( success1 , "tokenApprove Fail" );
        //     address[] memory path = new address[](3);
        //     (, bytes memory resultWETH) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",uint16(103)));
        //     path[0] = _fromToken;
        //     path[1] = abi.decode(resultWETH,(address));
        //     path[2] = _toToken;
        //     (bool successSwap, bytes memory resultSwap) = address( routerAddr ).call(abi.encodeWithSignature("swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",amountIn,0,path,_to,block.timestamp+1000));
        //     require( successSwap , "swap TOKEN->TOKEN Fail" );
        //     (uint256[] memory amountOut) = abi.decode(resultSwap,(uint256[]));
        //     return amountOut[1];
        // }
    }

    
    function checkFee(uint count) internal {
        uint8 n = 0;
        while (count >= 10) {
            count = count/10;
            n++;
        }
        require( msg.value > getPrice() * (n) , "C01");
    }

    function getPrice() internal view returns (uint256)
    {
        (,bytes memory resultRouter ) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",1200));
        (address uniswapRouter) = abi.decode(resultRouter,(address));
        address[] memory path = new address[](2);
        (,bytes memory wBnbResult) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",103));
        (,bytes memory usdtResult) = address(iAddresses).staticcall(abi.encodeWithSignature("viewAddress(uint16)",506)); // BUSD
        path[0] = abi.decode(usdtResult,(address));
        path[1] = abi.decode(wBnbResult,(address));
        (bool success, bytes memory result ) = address(uniswapRouter).staticcall(abi.encodeWithSignature("getAmountsOut(uint256,address[])",1000000000000000000,path));
        require(success,"callAmounts fail");
        uint[] memory a = abi.decode(result,(uint[]));
        return a[1];
    }
    
    function getCountFee(uint count) external view returns (uint256) {
        uint8 n = 0;
        if(count > 10) {
            while( count >= 10 ) {
                count = count/10;
                n++;
            }
            return getPrice() * n ;
        } else {
            return getPrice();
        }
    }
}