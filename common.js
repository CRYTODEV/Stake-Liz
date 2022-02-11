const testMode = true;

let web3;
let web3Modal;
let provider;
let selectedAccount;

// PRX
let prx = testMode ? "0x579a42aaf266a73dff0182ec3e76b7c28c15db83" : "0x71238884764fc000e35456e285d888080dbef2b0";

// Tokens
let usdt = testMode ? "0xc06073Aa93C99163105Ba28cC8d7B3c5c0C522e5" : "0x55d398326f99059ff775485246999027b3197955";
let usdc = testMode ? "0x7d077FdCDbE6CDFf146E69162c3CE9D71317578b" : "0x55d398326f99059ff775485246999027b3197955";

// Swap Contract
let swapContractAddress = testMode ? "0xea51d958260fbC145A9b4dF678709047A050c698" : "0x4160B6539d1674aB09F07257E41b230932b76D9A";

// Staking Contract
let stakingContractAddress = testMode ? "0x712a6EF7B48072D1c605EDca727E39D0D1aeD697" : "0xf5DC0809cF642Cc3Fd10F8FAb4cBa80B5B5fAb8a";
