const testMode = false;

let web3;
let web3Modal;
let provider;
let selectedAccount;

// LIZ
let liz = testMode ? "0x3950914d4BafD73F9Ec1DF976D72D0bb9f451808" : "0x496f4b10a8b2557ee30f1b7c06bfc7227a56c4f2";

// Tokens
let usdt = testMode ? "0xc06073Aa93C99163105Ba28cC8d7B3c5c0C522e5" : "0x55d398326f99059ff775485246999027b3197955";
let usdc = testMode ? "0x7d077FdCDbE6CDFf146E69162c3CE9D71317578b" : "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d";
let busd = testMode ? "0x7d077FdCDbE6CDFf146E69162c3CE9D71317578b" : "0xe9e7cea3dedca5984780bafc599bd69add087d56";

// Staking Contract
let stakingContractAddress = testMode ? "0x6318F1a0d0Be399840ea668Ff2b1cD9c627037Dd" : "0xf2046d0371B69a2a9BD7B1Ba9ac4215fDa5Ec58a";
