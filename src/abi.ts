export const ERC20_ABI = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",

  // Authenticated Functions
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint amount) returns (bool)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint amount)",
];

export const UNISWAP_V2_ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline)",
];

export const WETH_ABI = [
  "function approve(address guy, uint wad)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

export const ACCOUNT_ABI = [
  "function execute(address to, uint256 value, bytes data)",
];
