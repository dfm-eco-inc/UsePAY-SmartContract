# Solidity API

## Commander

### GiveEvent

```solidity
event GiveEvent(address packAddress, address senderAddress, address[] receiverAddress)
```

### blockReEntry

```solidity
modifier blockReEntry()
```

### haltInEmergency

```solidity
modifier haltInEmergency()
```

### requestLimit

```solidity
modifier requestLimit(uint256 limitTimestamp)
```

### getCountFee

```solidity
function getCountFee(uint256 count) public view returns (uint256)
```

### getPrice

```solidity
function getPrice() public view returns (uint256)
```

### getAddress

```solidity
function getAddress(uint16 index) internal view returns (address)
```

### isHalted

```solidity
function isHalted() internal view returns (bool)
```

### checkFee

```solidity
function checkFee(uint256 count) internal
```

### _getBalance

```solidity
function _getBalance(address addr) internal view returns (uint256)
```

### _transfer

```solidity
function _transfer(uint16 tokenType, address to, uint256 amount) internal
```

### _swap

```solidity
function _swap(uint16 index, address to, uint256 amount) internal returns (uint256)
```

## CouponCommander

### ChangeTotalEvent

```solidity
event ChangeTotalEvent(address, uint256 previousTotal, uint256 changedTotal, uint256 feePrice, uint256 swappedAmount)
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### changeTotal

```solidity
function changeTotal(uint32 newQuantity) external payable
```

### viewInfo

```solidity
function viewInfo() external view returns (struct Coupon.PackInfo)
```

### viewQuantity

```solidity
function viewQuantity() external view returns (uint256)
```

### viewOwner

```solidity
function viewOwner() external view returns (address)
```

### viewVersion

```solidity
function viewVersion() external pure returns (uint8)
```

## EmergencyStop

### MultiSign

```solidity
struct MultiSign {
  uint256 count;
  bool stoppedState;
  address[] confirmers;
}
```

### isContractStopped

```solidity
bool isContractStopped
```

### numConfirmationsRequired

```solidity
uint256 numConfirmationsRequired
```

### multiSign

```solidity
struct EmergencyStop.MultiSign multiSign
```

### ToggleContractStoppedEvent

```solidity
event ToggleContractStoppedEvent(bool isContractStopped)
```

### constructor

```solidity
constructor() public
```

### confirmToggleContractStopped

```solidity
function confirmToggleContractStopped() external
```

### toggleContractStopped

```solidity
function toggleContractStopped() external
```

### getContractStopped

```solidity
function getContractStopped() external view returns (bool)
```

## SubscriptionCommander

### MultiSign

```solidity
struct MultiSign {
  uint256 count;
  uint256 unlockTimestamp;
  address[] confirmers;
}
```

### unlockSeconds

```solidity
uint256 unlockSeconds
```

### numConfirmationsRequired

```solidity
uint256 numConfirmationsRequired
```

### multiSign

```solidity
struct SubscriptionCommander.MultiSign multiSign
```

### LaunchCalculateEvent

```solidity
event LaunchCalculateEvent(address starterAddress, address packAddress, address owner, uint256 balance, uint256 calculatedAmount, uint256 swappedAmount, uint256 feeAmount)
```

### StartCalculateEvent

```solidity
event StartCalculateEvent(address starterAddress)
```

### CancelCalculateEvent

```solidity
event CancelCalculateEvent(address cancelerAddress)
```

### ConfirmCalculateEvent

```solidity
event ConfirmCalculateEvent(address confirmerAddress)
```

### CalculateEvent

```solidity
event CalculateEvent(address packAddress, address owner, uint256 calculatedAmount)
```

### BuyEvent

```solidity
event BuyEvent(address packAddress, address buyer)
```

### RequestRefundEvent

```solidity
event RequestRefundEvent(address packAddress, address buyer, uint256 refundedAmount, uint256 swappedTokenAmount)
```

### ChangeTotalEvent

```solidity
event ChangeTotalEvent(address, uint256 previousTotal, uint256 changedTotal, uint256 feePrice, uint256 swappedAmount)
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### onCalculateTime

```solidity
modifier onCalculateTime()
```

### canBuy

```solidity
modifier canBuy()
```

### canUse

```solidity
modifier canUse()
```

### constructor

```solidity
constructor() public
```

### buy

```solidity
function buy() external payable
```

### give

```solidity
function give(address[] to) external
```

### requestRefund

```solidity
function requestRefund() external
```

### startCalculate

```solidity
function startCalculate() external
```

### cancelCalculate

```solidity
function cancelCalculate() external
```

### confirmCalculate

```solidity
function confirmCalculate() external
```

### launchCalculate

```solidity
function launchCalculate() external
```

### calculate

```solidity
function calculate() external
```

### changeTotal

```solidity
function changeTotal(uint32 newQuantity) external payable
```

### viewInfo

```solidity
function viewInfo() external view returns (struct Subscription.PackInfo)
```

### viewOwner

```solidity
function viewOwner() external view returns (address)
```

### viewQuantity

```solidity
function viewQuantity() external view returns (uint256)
```

### viewUser

```solidity
function viewUser(address userAddr) external view returns (struct Subscription.pack)
```

### viewVersion

```solidity
function viewVersion() external pure returns (uint8)
```

### getTimePercent

```solidity
function getTimePercent(uint256 totalTime, uint256 passedTime) private view returns (uint256)
```

### percentValue

```solidity
function percentValue(uint256 value, uint256 percent) private view returns (uint256)
```

### refund

```solidity
function refund(address to, uint256 amount, uint8 percent) private returns (uint256, uint256)
```

## TicketCommander

### BuyEvent

```solidity
event BuyEvent(address packAddress, uint256 txUniqueNumber, address buyer, uint256 buyQuantity)
```

### UseEvent

```solidity
event UseEvent(address packAddress, address userAddress, uint256 useQuantity)
```

### CalculateEvent

```solidity
event CalculateEvent(address, address owner, uint256 calculatedAmount)
```

### RequestRefundEvent

```solidity
event RequestRefundEvent(address packAddress, address buyer, uint256 quantity, uint256 refundedAmount, uint256 swappedTokenAmount)
```

### ChangeTotalEvent

```solidity
event ChangeTotalEvent(address, uint256 previousTotal, uint256 changedTotal, uint256 feePrice, uint256 swappedAmount)
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### onCalculateTime

```solidity
modifier onCalculateTime()
```

### canUse

```solidity
modifier canUse(uint256 useQuantity)
```

### canBuy

```solidity
modifier canBuy(uint256 buyQuantity)
```

### buy

```solidity
function buy(uint32 buyQuantity, uint256 txUniqueNumber) external payable
```

### give

```solidity
function give(address[] to) external
```

### use

```solidity
function use(uint32 useQuantity) external
```

### requestRefund

```solidity
function requestRefund(uint32 refundQuantity) external
```

### calculate

```solidity
function calculate() external
```

### changeTotal

```solidity
function changeTotal(uint32 newQuantity) external payable
```

### viewInfo

```solidity
function viewInfo() external view returns (struct Ticket.PackInfo)
```

### viewUser

```solidity
function viewUser(address _addr) external view returns (struct Ticket.pack)
```

### viewQuantity

```solidity
function viewQuantity() external view returns (uint256)
```

### viewOwner

```solidity
function viewOwner() external view returns (address)
```

### viewVersion

```solidity
function viewVersion() external pure returns (uint8)
```

### viewTotalUsedCount

```solidity
function viewTotalUsedCount() external view returns (uint32)
```

### percentValue

```solidity
function percentValue(uint256 value, uint8 percent) private view returns (uint256)
```

### refund

```solidity
function refund(address to, uint256 amount, uint8 percent) private returns (uint256, uint256)
```

## CouponCreator

### CreateCouponEvent

```solidity
event CreateCouponEvent(address packAddress, uint256 txUniqueNumber, struct Coupon.PackInfo packInfo)
```

### createCoupon

```solidity
function createCoupon(struct Coupon.PackInfo packInfo, uint256 txUniqueNumber) external
```

### viewVersion

```solidity
function viewVersion() external pure returns (uint8)
```

## SubscriptionCreator

### CreateSubscriptionEvent

```solidity
event CreateSubscriptionEvent(address packAddress, uint256 txUniqueNumber, struct Subscription.PackInfo packInfo, uint256 feePrice, uint256 swappedAmount)
```

### createSubscription

```solidity
function createSubscription(struct Subscription.PackInfo packInfo, uint256 txUniqueNumber) external payable
```

### viewVersion

```solidity
function viewVersion() external pure returns (uint8)
```

## TicketCreator

### CreateTicketEvent

```solidity
event CreateTicketEvent(address packAddress, uint256 txUniqueNumber, struct Ticket.PackInfo packInfo, uint256 feePrice, uint256 swappedAmount)
```

### createTicket

```solidity
function createTicket(struct Ticket.PackInfo packInfo, uint256 txUniqueNumber) external payable
```

### viewVersion

```solidity
function viewVersion() external pure returns (uint8)
```

## AggregatorV3Interface

Chainlink Data Feed Consumer Interface for getting token price
https://github.com/smartcontractkit/chainlink/blob/develop/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol

### decimals

```solidity
function decimals() external view returns (uint8)
```

### description

```solidity
function description() external view returns (string)
```

### version

```solidity
function version() external view returns (uint256)
```

### getRoundData

```solidity
function getRoundData(uint80 _roundId) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
```

### latestRoundData

```solidity
function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
```

## FullMath

### POSITIVE_INFINITY

```solidity
bytes16 POSITIVE_INFINITY
```

### POSITIVE_ZERO

```solidity
bytes16 POSITIVE_ZERO
```

### NEGATIVE_ZERO

```solidity
bytes16 NEGATIVE_ZERO
```

### NaN

```solidity
bytes16 NaN
```

### mul

```solidity
function mul(bytes16 x, bytes16 y) internal pure returns (bytes16)
```

### div

```solidity
function div(bytes16 x, bytes16 y) internal pure returns (bytes16)
```

### fromUInt

```solidity
function fromUInt(uint256 x) internal pure returns (bytes16)
```

### toUInt

```solidity
function toUInt(bytes16 x) internal pure returns (uint256)
```

### mostSignificantBit

```solidity
function mostSignificantBit(uint256 x) private pure returns (uint256)
```

## IERC20

### Approval

```solidity
event Approval(address owner, address spender, uint256 value)
```

### Transfer

```solidity
event Transfer(address from, address to, uint256 value)
```

### name

```solidity
function name() external view returns (string)
```

### symbol

```solidity
function symbol() external view returns (string)
```

### decimals

```solidity
function decimals() external view returns (uint8)
```

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

### approve

```solidity
function approve(address spender, uint256 value) external returns (bool)
```

### transfer

```solidity
function transfer(address to, uint256 value) external returns (bool)
```

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 value) external returns (bool)
```

## IUniswapV2Router01

### factory

```solidity
function factory() external pure returns (address)
```

### WETH

```solidity
function WETH() external pure returns (address)
```

### addLiquidity

```solidity
function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)
```

### addLiquidityETH

```solidity
function addLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)
```

### removeLiquidity

```solidity
function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB)
```

### removeLiquidityETH

```solidity
function removeLiquidityETH(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external returns (uint256 amountToken, uint256 amountETH)
```

### removeLiquidityWithPermit

```solidity
function removeLiquidityWithPermit(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint256 amountA, uint256 amountB)
```

### removeLiquidityETHWithPermit

```solidity
function removeLiquidityETHWithPermit(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint256 amountToken, uint256 amountETH)
```

### swapExactTokensForTokens

```solidity
function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)
```

### swapTokensForExactTokens

```solidity
function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)
```

### swapExactETHForTokens

```solidity
function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) external payable returns (uint256[] amounts)
```

### swapTokensForExactETH

```solidity
function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)
```

### swapExactTokensForETH

```solidity
function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)
```

### swapETHForExactTokens

```solidity
function swapETHForExactTokens(uint256 amountOut, address[] path, address to, uint256 deadline) external payable returns (uint256[] amounts)
```

### quote

```solidity
function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) external pure returns (uint256 amountB)
```

### getAmountOut

```solidity
function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) external pure returns (uint256 amountOut)
```

### getAmountIn

```solidity
function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) external pure returns (uint256 amountIn)
```

### getAmountsOut

```solidity
function getAmountsOut(uint256 amountIn, address[] path) external view returns (uint256[] amounts)
```

### getAmountsIn

```solidity
function getAmountsIn(uint256 amountOut, address[] path) external view returns (uint256[] amounts)
```

## Percentage

### getTimePercent

```solidity
function getTimePercent(uint256 a, uint256 b) external pure returns (uint256)
```

### getPercentValue

```solidity
function getPercentValue(uint256 amount, uint256 percent) external pure returns (uint256)
```

## CouponPack

### constructor

```solidity
constructor(struct Coupon.PackInfo newPackInfo, address ownerAddress) public
```

### fallback

```solidity
fallback() external payable
```

## SubscriptionPack

### constructor

```solidity
constructor(struct Subscription.PackInfo newPackInfo, address ownerAddress) public
```

### fallback

```solidity
fallback() external payable
```

## TicketPack

### constructor

```solidity
constructor(struct Ticket.PackInfo newPackInfo, address ownerAddress) public
```

### fallback

```solidity
fallback() external payable
```

## Ticket

### pack

```solidity
struct pack {
  uint32 hasCount;
  uint32 useCount;
}
```

### PackInfo

```solidity
struct PackInfo {
  uint8 noshowValue;
  uint16 tokenType;
  uint32 total;
  uint32 times0;
  uint32 times1;
  uint32 times2;
  uint32 times3;
  uint32 maxCount;
  uint256 price;
}
```

### isCalculated

```solidity
bool isCalculated
```

### ver

```solidity
uint8 ver
```

### totalUsedCount

```solidity
uint32 totalUsedCount
```

### quantity

```solidity
uint32 quantity
```

### owner

```solidity
address owner
```

### packInfo

```solidity
struct Ticket.PackInfo packInfo
```

### buyList

```solidity
mapping(address => struct Ticket.pack) buyList
```

## Coupon

### PackInfo

```solidity
struct PackInfo {
  uint32 total;
  uint32 maxCount;
  uint32 times0;
  uint32 times1;
  uint32 times2;
  uint32 times3;
}
```

### ver

```solidity
uint8 ver
```

### quantity

```solidity
uint32 quantity
```

### owner

```solidity
address owner
```

### packInfo

```solidity
struct Coupon.PackInfo packInfo
```

## Subscription

### pack

```solidity
struct pack {
  uint32 hasCount;
}
```

### PackInfo

```solidity
struct PackInfo {
  uint16 tokenType;
  uint32 total;
  uint32 times0;
  uint32 times1;
  uint32 times2;
  uint32 times3;
  uint256 price;
}
```

### ver

```solidity
uint8 ver
```

### quantity

```solidity
uint32 quantity
```

### owner

```solidity
address owner
```

### packInfo

```solidity
struct Subscription.PackInfo packInfo
```

### buyList

```solidity
mapping(address => struct Subscription.pack) buyList
```

## WrapAddresses

### isReEntry

```solidity
bool isReEntry
```

### requestTime

```solidity
uint256 requestTime
```

### ADR_ADDRESSES

```solidity
address ADR_ADDRESSES
```

### ADR_CREATOR

```solidity
uint8 ADR_CREATOR
```

### ADR_NATIVE_TOKEN

```solidity
uint8 ADR_NATIVE_TOKEN
```

### ADR_WRAPPED_NATIVE_TOKEN

```solidity
uint8 ADR_WRAPPED_NATIVE_TOKEN
```

### ADR_PAC_TOKEN

```solidity
uint8 ADR_PAC_TOKEN
```

### ADR_UNISWAP_ROUTER

```solidity
uint16 ADR_UNISWAP_ROUTER
```

### ADR_PERCENTAGE

```solidity
uint16 ADR_PERCENTAGE
```

### ADR_EMERGENCY_STOP

```solidity
uint16 ADR_EMERGENCY_STOP
```

### ADR_CHAINLINK_DATAFEED

```solidity
uint16 ADR_CHAINLINK_DATAFEED
```

### ADR_TICKET_COMMANDER

```solidity
uint16 ADR_TICKET_COMMANDER
```

### ADR_COUPON_COMMANDER

```solidity
uint16 ADR_COUPON_COMMANDER
```

### ADR_SUBSCR_COMMANDER

```solidity
uint16 ADR_SUBSCR_COMMANDER
```

### MAX_TICKET_QTY

```solidity
uint16 MAX_TICKET_QTY
```

### MAX_SUBSCRIPTION_QTY

```solidity
uint16 MAX_SUBSCRIPTION_QTY
```

### MAX_COUPON_QTY

```solidity
uint16 MAX_COUPON_QTY
```

### onlyManager

```solidity
modifier onlyManager(address _addr)
```

### viewUnlockSeconds

```solidity
function viewUnlockSeconds() internal view returns (uint256)
```

### viewNumOfConfirmation

```solidity
function viewNumOfConfirmation() internal view returns (uint256)
```

### checkManager

```solidity
function checkManager(address _addr) internal view
```

## WMATIC

### name

```solidity
string name
```

### symbol

```solidity
string symbol
```

### decimals

```solidity
uint8 decimals
```

### Approval

```solidity
event Approval(address src, address guy, uint256 wad)
```

### Transfer

```solidity
event Transfer(address src, address dst, uint256 wad)
```

### Deposit

```solidity
event Deposit(address dst, uint256 wad)
```

### Withdrawal

```solidity
event Withdrawal(address src, uint256 wad)
```

### balanceOf

```solidity
mapping(address => uint256) balanceOf
```

### allowance

```solidity
mapping(address => mapping(address => uint256)) allowance
```

### receive

```solidity
receive() external payable
```

### deposit

```solidity
function deposit() public payable
```

### withdraw

```solidity
function withdraw(uint256 wad) public
```

### totalSupply

```solidity
function totalSupply() public view returns (uint256)
```

### approve

```solidity
function approve(address guy, uint256 wad) public returns (bool)
```

### transfer

```solidity
function transfer(address dst, uint256 wad) public returns (bool)
```

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 wad) public returns (bool)
```

## WETH

### name

```solidity
string name
```

### symbol

```solidity
string symbol
```

### decimals

```solidity
uint8 decimals
```

### Approval

```solidity
event Approval(address src, address guy, uint256 wad)
```

### Transfer

```solidity
event Transfer(address src, address dst, uint256 wad)
```

### Deposit

```solidity
event Deposit(address dst, uint256 wad)
```

### Withdrawal

```solidity
event Withdrawal(address src, uint256 wad)
```

### balanceOf

```solidity
mapping(address => uint256) balanceOf
```

### allowance

```solidity
mapping(address => mapping(address => uint256)) allowance
```

### receive

```solidity
receive() external payable
```

### deposit

```solidity
function deposit() public payable
```

### withdraw

```solidity
function withdraw(uint256 wad) public
```

### totalSupply

```solidity
function totalSupply() public view returns (uint256)
```

### approve

```solidity
function approve(address guy, uint256 wad) public returns (bool)
```

### transfer

```solidity
function transfer(address dst, uint256 wad) public returns (bool)
```

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 wad) public returns (bool)
```

## ERC1155UsePAYMinterPauser

### name

```solidity
string name
```

### constructor

```solidity
constructor(string collectionName, string metadataUri) public
```

## ERC721UsePAYMinterPauserAutoId

### constructor

```solidity
constructor(string name, string symbol, string baseTokenURI) public
```

## TicketCreator

### CreateTicketEvent

```solidity
event CreateTicketEvent(address packAddress, uint256 txUniqueNumber, struct Ticket.PackInfo packInfo)
```

### createTicket

```solidity
function createTicket(struct Ticket.PackInfo packInfo, uint256 txUniqueNumber) external payable
```

### viewVersion

```solidity
function viewVersion() external pure returns (uint8)
```

## MultiTransfer

UsePAY 여러 사용자에게 동시에 토큰을 보내는 컨트랙트 - CalcReferrerContract

### TransferInfo

```solidity
struct TransferInfo {
  address to;
  uint256 amount;
}
```

### governanceTokenAddress

```solidity
address governanceTokenAddress
```

### TokenTransferEvent

```solidity
event TokenTransferEvent(address sender, struct MultiTransfer.TransferInfo[] receiver)
```

### GovernanceTokenTransferEvent

```solidity
event GovernanceTokenTransferEvent(address sender, struct MultiTransfer.TransferInfo[] receiver)
```

### constructor

```solidity
constructor(address tokenAddress) public
```

### multiTransfer

```solidity
function multiTransfer(address tokenAddress, struct MultiTransfer.TransferInfo[] to) external payable
```

### transferGovernanceToken

```solidity
function transferGovernanceToken(struct MultiTransfer.TransferInfo[] to) external payable
```

### _transfer

```solidity
function _transfer(address tokenAddress, struct MultiTransfer.TransferInfo[] to) private
```

## TOKEN_SYMBOL

### constructor

```solidity
constructor() public
```

### deposit

```solidity
function deposit() external payable
```

### withdraw

```solidity
function withdraw(uint256 _amount) external
```

## ERC20

_Implementation of the {IERC20} interface.

This implementation is agnostic to the way tokens are created. This means
that a supply mechanism has to be added in a derived contract using {_mint}.
For a generic mechanism see {ERC20PresetMinterPauser}.

TIP: For a detailed writeup see our guide
https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226[How
to implement supply mechanisms].

We have followed general OpenZeppelin Contracts guidelines: functions revert
instead returning `false` on failure. This behavior is nonetheless
conventional and does not conflict with the expectations of ERC20
applications.

Additionally, an {Approval} event is emitted on calls to {transferFrom}.
This allows applications to reconstruct the allowance for all accounts just
by listening to said events. Other implementations of the EIP may not emit
these events, as it isn't required by the specification.

Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
functions have been added to mitigate the well-known issues around setting
allowances. See {IERC20-approve}._

### _balances

```solidity
mapping(address => uint256) _balances
```

### _allowances

```solidity
mapping(address => mapping(address => uint256)) _allowances
```

### _totalSupply

```solidity
uint256 _totalSupply
```

### _name

```solidity
string _name
```

### _symbol

```solidity
string _symbol
```

### constructor

```solidity
constructor(string name_, string symbol_) public
```

_Sets the values for {name} and {symbol}.

The default value of {decimals} is 18. To select a different value for
{decimals} you should overload it.

All two of these values are immutable: they can only be set once during
construction._

### name

```solidity
function name() public view virtual returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() public view virtual returns (string)
```

_Returns the symbol of the token, usually a shorter version of the
name._

### decimals

```solidity
function decimals() public view virtual returns (uint8)
```

_Returns the number of decimals used to get its user representation.
For example, if `decimals` equals `2`, a balance of `505` tokens should
be displayed to a user as `5.05` (`505 / 10 ** 2`).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}._

### totalSupply

```solidity
function totalSupply() public view virtual returns (uint256)
```

_See {IERC20-totalSupply}._

### balanceOf

```solidity
function balanceOf(address account) public view virtual returns (uint256)
```

_See {IERC20-balanceOf}._

### transfer

```solidity
function transfer(address to, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transfer}.

Requirements:

- `to` cannot be the zero address.
- the caller must have a balance of at least `amount`._

### allowance

```solidity
function allowance(address owner, address spender) public view virtual returns (uint256)
```

_See {IERC20-allowance}._

### approve

```solidity
function approve(address spender, uint256 amount) public virtual returns (bool)
```

_See {IERC20-approve}.

NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on
`transferFrom`. This is semantically equivalent to an infinite approval.

Requirements:

- `spender` cannot be the zero address._

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not
required by the EIP. See the note at the beginning of {ERC20}.

NOTE: Does not update the allowance if the current allowance
is the maximum `uint256`.

Requirements:

- `from` and `to` cannot be the zero address.
- `from` must have a balance of at least `amount`.
- the caller must have allowance for ``from``'s tokens of at least
`amount`._

### increaseAllowance

```solidity
function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool)
```

_Atomically increases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address._

### decreaseAllowance

```solidity
function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool)
```

_Atomically decreases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.
- `spender` must have allowance for the caller of at least
`subtractedValue`._

### transfer

```solidity
function transfer(address from, address to, uint256 amount) internal virtual
```

_Moves `amount` of tokens from `from` to `to`.

This internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

- `from` cannot be the zero address.
- `to` cannot be the zero address.
- `from` must have a balance of at least `amount`._

### _mint

```solidity
function _mint(address account, uint256 amount) internal virtual
```

_Creates `amount` tokens and assigns them to `account`, increasing
the total supply.

Emits a {Transfer} event with `from` set to the zero address.

Requirements:

- `account` cannot be the zero address._

### _burn

```solidity
function _burn(address account, uint256 amount) internal virtual
```

_Destroys `amount` tokens from `account`, reducing the
total supply.

Emits a {Transfer} event with `to` set to the zero address.

Requirements:

- `account` cannot be the zero address.
- `account` must have at least `amount` tokens._

### _approve

```solidity
function _approve(address owner, address spender, uint256 amount) internal virtual
```

_Sets `amount` as the allowance of `spender` over the `owner` s tokens.

This internal function is equivalent to `approve`, and can be used to
e.g. set automatic allowances for certain subsystems, etc.

Emits an {Approval} event.

Requirements:

- `owner` cannot be the zero address.
- `spender` cannot be the zero address._

### _spendAllowance

```solidity
function _spendAllowance(address owner, address spender, uint256 amount) internal virtual
```

_Updates `owner` s allowance for `spender` based on spent `amount`.

Does not update the allowance amount in case of infinite allowance.
Revert if not enough allowance is available.

Might emit an {Approval} event._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Hook that is called before any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
will be transferred to `to`.
- when `from` is zero, `amount` tokens will be minted for `to`.
- when `to` is zero, `amount` of ``from``'s tokens will be burned.
- `from` and `to` are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### _afterTokenTransfer

```solidity
function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Hook that is called after any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
has been transferred to `to`.
- when `from` is zero, `amount` tokens have been minted for `to`.
- when `to` is zero, `amount` of ``from``'s tokens have been burned.
- `from` and `to` are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

## IERC20

_Interface of the ERC20 standard as defined in the EIP._

### Transfer

```solidity
event Transfer(address from, address to, uint256 value)
```

_Emitted when `value` tokens are moved from one account (`from`) to
another (`to`).

Note that `value` may be zero._

### Approval

```solidity
event Approval(address owner, address spender, uint256 value)
```

_Emitted when the allowance of a `spender` for an `owner` is set by
a call to {approve}. `value` is the new allowance._

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_Returns the amount of tokens in existence._

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

_Returns the amount of tokens owned by `account`._

### transfer

```solidity
function transfer(address to, uint256 amount) external returns (bool)
```

_Moves `amount` tokens from the caller's account to `to`.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

_Returns the remaining number of tokens that `spender` will be
allowed to spend on behalf of `owner` through {transferFrom}. This is
zero by default.

This value changes when {approve} or {transferFrom} are called._

### approve

```solidity
function approve(address spender, uint256 amount) external returns (bool)
```

_Sets `amount` as the allowance of `spender` over the caller's tokens.

Returns a boolean value indicating whether the operation succeeded.

IMPORTANT: Beware that changing an allowance with this method brings the risk
that someone may use both the old and the new allowance by unfortunate
transaction ordering. One possible solution to mitigate this race
condition is to first reduce the spender's allowance to 0 and set the
desired value afterwards:
https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

Emits an {Approval} event._

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 amount) external returns (bool)
```

_Moves `amount` tokens from `from` to `to` using the
allowance mechanism. `amount` is then deducted from the caller's
allowance.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

## IERC20Metadata

_Interface for the optional metadata functions from the ERC20 standard.

_Available since v4.1.__

### name

```solidity
function name() external view returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() external view returns (string)
```

_Returns the symbol of the token._

### decimals

```solidity
function decimals() external view returns (uint8)
```

_Returns the decimals places of the token._

## Context

_Provides information about the current execution context, including the
sender of the transaction and its data. While these are generally available
via msg.sender and msg.data, they should not be accessed in such a direct
manner, since when dealing with meta-transactions the account sending and
paying for execution may not be the actual sender (as far as an application
is concerned).

This contract is only required for intermediate, library-like contracts._

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

## TOKEN_SYMBOL

### name

```solidity
string name
```

### symbol

```solidity
string symbol
```

### decimals

```solidity
uint8 decimals
```

### Approval

```solidity
event Approval(address src, address guy, uint256 wad)
```

### Transfer

```solidity
event Transfer(address src, address dst, uint256 wad)
```

### Deposit

```solidity
event Deposit(address dst, uint256 wad)
```

### Withdrawal

```solidity
event Withdrawal(address src, uint256 wad)
```

### balanceOf

```solidity
mapping(address => uint256) balanceOf
```

### allowance

```solidity
mapping(address => mapping(address => uint256)) allowance
```

### receive

```solidity
receive() external payable
```

### deposit

```solidity
function deposit() public payable
```

### withdraw

```solidity
function withdraw(uint256 wad) public
```

### totalSupply

```solidity
function totalSupply() public view returns (uint256)
```

### approve

```solidity
function approve(address guy, uint256 wad) public returns (bool)
```

### transfer

```solidity
function transfer(address dst, uint256 wad) public returns (bool)
```

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 wad) public returns (bool)
```

## Ticket

### pack

```solidity
struct pack {
  uint32 hasCount;
  uint32 useCount;
}
```

### PackInfo

```solidity
struct PackInfo {
  uint8 noshowValue;
  uint16 tokenType;
  uint32 total;
  uint32 times0;
  uint32 times1;
  uint32 times2;
  uint32 times3;
  uint32 maxCount;
  uint256 price;
}
```

### isCalculated

```solidity
bool isCalculated
```

### ver

```solidity
uint8 ver
```

### totalUsedCount

```solidity
uint32 totalUsedCount
```

### quantity

```solidity
uint32 quantity
```

### owner

```solidity
address owner
```

### packInfo

```solidity
struct Ticket.PackInfo packInfo
```

### buyList

```solidity
mapping(address => struct Ticket.pack) buyList
```

## Coupon

### pack

```solidity
struct pack {
  uint32 hasCount;
  uint32 useCount;
}
```

### PackInfo

```solidity
struct PackInfo {
  uint32 total;
  uint32 maxCount;
  uint32 times0;
  uint32 times1;
  uint32 times2;
  uint32 times3;
}
```

### ver

```solidity
uint8 ver
```

### quantity

```solidity
uint32 quantity
```

### owner

```solidity
address owner
```

### packInfo

```solidity
struct Coupon.PackInfo packInfo
```

### buyList

```solidity
mapping(address => struct Coupon.pack) buyList
```

## Subscription

### pack

```solidity
struct pack {
  uint32 hasCount;
}
```

### PackInfo

```solidity
struct PackInfo {
  uint16 tokenType;
  uint32 total;
  uint32 times0;
  uint32 times1;
  uint32 times2;
  uint32 times3;
  uint256 price;
}
```

### ver

```solidity
uint8 ver
```

### quantity

```solidity
uint32 quantity
```

### owner

```solidity
address owner
```

### packInfo

```solidity
struct Subscription.PackInfo packInfo
```

### buyList

```solidity
mapping(address => struct Subscription.pack) buyList
```

## Addresses

### MultiSign

```solidity
struct MultiSign {
  uint256 count;
  uint256 unlockTimestamp;
  uint16[] index;
  address[] addr;
  address[] confirmers;
}
```

### unlockSeconds

```solidity
uint256 unlockSeconds
```

### numConfirmationsRequired

```solidity
uint256 numConfirmationsRequired
```

### addresses

```solidity
mapping(uint16 => address) addresses
```

### multiSign

```solidity
struct Addresses.MultiSign multiSign
```

### StartSetAddressesEvent

```solidity
event StartSetAddressesEvent(address starterAddress, address[] newAddress, uint16[] idx)
```

### CancelSetAddressesEvent

```solidity
event CancelSetAddressesEvent(address cancelerAddress)
```

### ConfirmSetAddressesEvent

```solidity
event ConfirmSetAddressesEvent(address confirmerAddress)
```

### LaunchSetAddressesEvent

```solidity
event LaunchSetAddressesEvent(address launcherAddress, address[] newAddress, uint16[] idx)
```

### onlyManager

```solidity
modifier onlyManager()
```

### constructor

```solidity
constructor(address[] managerAddresses, uint256 confirmationCount, uint256 unlockDelaySeconds) public
```

### startSetAddresses

```solidity
function startSetAddresses(uint16[] index, address[] newAddress) external
```

### cancelSetAddresses

```solidity
function cancelSetAddresses() external
```

### confirmSetAddresses

```solidity
function confirmSetAddresses() external
```

### launchSetAddresses

```solidity
function launchSetAddresses() external
```

### viewConfirmSetAddressStatus

```solidity
function viewConfirmSetAddressStatus() external view returns (struct Addresses.MultiSign)
```

### viewAddress

```solidity
function viewAddress(uint16 index) external view returns (address)
```

### viewNumOfConfirmation

```solidity
function viewNumOfConfirmation() external view returns (uint256)
```

### viewUnlockSeconds

```solidity
function viewUnlockSeconds() external view returns (uint256)
```

### checkManager

```solidity
function checkManager(address targetAddress) public view returns (bool)
```

