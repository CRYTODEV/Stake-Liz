const Web3Modal = window.Web3Modal.default;
const walletConnectProvider = window.WalletConnectProvider.default;

const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;

// Contracts


var pubChainId = 0;

var strConnectWallet = "<i class=\"fas fa-wallet pr-1\"></i>Connect Wallet";
var strDisconnectWallet = "<i class=\"fas fa-sign-out-alt\"></i>Disconnect Wallet";

const maxUint256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

var tokenPrice = 0;

var web3BaseUrl_main;
var web3_main;
var otherStakingContract;
var otherLIZContract;

var isMobile = false;

let chainId = 0;
let accounts;
let chainData;
let allowance;

var duration;
var avlLIZBalance;
var est_apy = 40;
var est_apr = 10;
var userDepositAmount;
var minimumAmount = 3000;
var depositType = 0;

var dataInterval;
var canClaim;


window.addEventListener('load', async () => {

   if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
         // true for mobile device
         isMobile = true;
   } else {
         isMobile = false;
         // false for not mobile device
   }

  init();

   var innerWidth = window.innerWidth;
   var innerHeight = window.innerHeight;
   if(innerWidth > 1000)
    $(".dropdown-toggle::after").addClass("nav-separete");

});

async function onConnect() {
  try {
    provider = null;
    provider = await web3Modal.connect();
    fetchAccountData();

  } catch(e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  // Subscribe to accounts change
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });

  // Subscribe to chainId change
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });

  // Subscribe to networkId change
  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });

}


async function onDisconnect() {

   selectedAccount = null;
   pubChainId = 0;

   jQuery(".connect-wallet").html(strConnectWallet);
   jQuery(".connect-wallet").removeAttr('data-toggle');
   jQuery(".connect-wallet").removeAttr('onclick');
   jQuery(".connect-wallet").removeAttr('data-target');

   jQuery(".connect-wallet").attr('onclick', "connectWallet()");


   if(provider) {
      try{
         await provider.close();
      } catch(e) {
         
      }
      provider = null;
      await web3Modal.clearCachedProvider();
  }

  clearInterval(dataInterval);
}

function connectWallet() {
   if (provider){
      onDisconnect();
   }else{
      onConnect();
   }
}



async function fetchAccountData() {

  if(!isMobile) {
    web3 = new Web3(window.ethereum);
    if (window.ethereum) {
        try {
            // Request account access if needed
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            chainId = await ethereum.request({ method: 'eth_chainId' });

        } catch (error) {
            console.log(error);
        }
    }

    changeNetwork();

    provider = window.ethereum;
  } else {
    web3 = new Web3(provider);
    chainId = await web3.eth.getChainId();
    // chainData = evmChains.getChain(chainId);
    accounts = await web3.eth.getAccounts();
  }
  
  jQuery(".connectWallet").removeClass("connectWallet");
  jQuery("#btn-approve").removeAttr("disabled");
  jQuery("#btn-confirm").removeAttr("disabled");

  if (chainId != 56 && chainId != 97) {
      onDisconnect();
      Swal.fire({
        icon: 'error',
        title: 'Wrong network',
        text: 'Change network Binance Smart Chain network'
      })
      return false;
  } else if(chainId == 56 && testMode) {
      onDisconnect();
      Swal.fire({
        icon: 'error',
        title: 'Wrong network',
        text: 'Change network to Binance Test Network'
      })
      return false;
  } else if(chainId == 97 && !testMode) {
      onDisconnect();
      Swal.fire({
        icon: 'error',
        title: 'Wrong network',
        text: 'Change network to Binance Main Network'
      })
      return false;
  }

  selectedAccount = accounts[0];

  pubChainId = chainId;

  jQuery(".connect-wallet").html('<div class="spinner-border text-dark" role="" ></div>');
  jQuery("#pubAccountAddress").html(selectedAccount);
  
  jQuery(".connect-wallet").html("<i class=\"fas fa-wallet pr-1\"></i>" + selectedAccount.substr(0, 7) + "..." + selectedAccount.substr(selectedAccount.length-4, selectedAccount.length));

  jQuery(".connect-wallet").attr("onclick", "openDisconnectModal()");
  jQuery(".connect-wallet").attr("data-toggle", "modal");
  jQuery(".connect-wallet").attr("data-target", "#disconnectModal");

  var showAvlLIZBalance = await otherLIZContract.methods.balanceOf(selectedAccount).call();
  var tmp_avlLIZBalance = parseFloat(web3_main.utils.fromWei(showAvlLIZBalance, 'nano')).toFixed(0);
  avlLIZBalance = tmp_avlLIZBalance;

  jQuery("#avlLIZAmount").html(tmp_avlLIZBalance);

  // check allowance
  checkAllowance();

  // get Interval Time
  var interValTime = await otherStakingContract.methods.intervaLTime().call();

  rewardCycle = interValTime;

  getUserData();

  initInterval = setInterval(function () {
     getUserData();
  }, interValTime * 1000);

  // jQuery("#tokenPrice").html(tmp_tokenPrice);

  stakingContract = new web3.eth.Contract(stakingAbi, stakingContractAddress);

  lizContract = new web3.eth.Contract(bep20Abi, liz);
  
}

async function getUserData() {

  var userInfo = await otherStakingContract.methods.userInfo(selectedAccount).call();
  var lockedAmount = parseFloat(web3_main.utils.fromWei(userInfo.amount, "nano"));
  userDepositAmount = userInfo.amount;
  jQuery("#lockedBalance").html(numberWithSpaces(lockedAmount));
  jQuery("#calcLockedBalance").html(numberWithSpaces(lockedAmount * tokenPrice));


  var claimAmount = await otherStakingContract.methods.pendingToken(selectedAccount).call();
  var tmp_calcUSDT = parseFloat(parseFloat(web3_main.utils.fromWei(claimAmount, "nano")) * tokenPrice).toFixed(7);
  jQuery("#claimBalance").html(tmp_calcUSDT);
  jQuery("#calcClaimBalance").html(tmp_calcUSDT);

  var canHarverst = await otherStakingContract.methods.canHarvest(selectedAccount).call();
  var canWithdraw = await otherStakingContract.methods.canWithdraw(selectedAccount).call();

  var userDepositTime = userInfo.depositTime;
  canClaim = canHarverst;

  console.log(userDepositTime);
    
  var deposit_date = new Date(userDepositTime * 1000);


  Date.prototype.addDays = function(days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
  }

  var strWithdrawtime;

  if(userInfo.depositType == 0)
    strWithdrawtime = getStrDate(deposit_date.addDays(90));

  if(userInfo.depositType == 1)
    strWithdrawtime = getStrDate(deposit_date.addDays(180));

  if(userInfo.depositType == 2)
    strWithdrawtime = getStrDate(deposit_date.addDays(365));

  $(".status").show();


  if(userDepositTime == 0) {
    $(".estTime").hide();
  } else {
    $(".estTime").show();
  }
  

  if(canWithdraw) {
    $(".withdraw_status").html("Available");
    $(".withdraw_status").addClass("available");
    $("#btn-withdraw").removeAttr("disabled");
    $(".withdraw_time").html(strWithdrawtime)
  } else {
    $(".withdraw_status").html("Locked");
    $(".withdraw_status").addClass("unavailable");
    $("#btn-withdraw").attr("disabled", "true");
    $(".withdraw_time").html(strWithdrawtime)
  }

  
  var claim_date = new Date();
  if(!canHarverst) {
    claim_date.setMinutes(deposit_date.getMinutes() + rewardCycle / 60);
  }
  
  if(canHarverst) {
    $(".claim_status").html("Available");
    $(".claim_status").addClass("available");
    $(".claim_status").removeClass("unavailable");
    $("#btn-claim").removeAttr("disabled");
    $(".claim_time").html("Just Now");
  } else {
    $(".claim_status").html("Locked");
    $(".claim_status").removeClass("available");
    $(".claim_status").addClass("unavailable");
    $("#btn-claim").attr("disabled", "true");
    $(".claim_time").html(getStrDate(claim_date));
  }

}

function openDisconnectModal() {
  jQuery(".copyAddressTip").hide();
}


async function changeNetwork() {
  var chainId = testMode ? 97 : 56;
  var result = await ethereum.request({
     method: 'wallet_switchEthereumChain',
     params: [{ chainId: "0x" + parseInt(chainId).toString(16) }],
  });
}

function selectMax() {
  
  if(avlLIZBalance == 0) {
    $(".error-msg").html("Insufficient balance");
    $(".error-msg").show();
    Swal.fire({
      icon: 'error',
      title: 'Insufficient LIZ Balance',
      text: 'Please buy the LIZ on the Binance Smart Chain',
      footer: '<a href="https://swap.lizcoin.io" target="_blank">Buy LIZ</a>'
    })
    return; 
  }
  $(".input-amount").val(avlLIZBalance);
  
  // validInput();
}

function validInput() {

    if(provider == null) {
      Swal.fire({
        icon: 'error',
        title: 'Transaction Fail',
        text: 'Transaction has been rejected'
      })
      return false;
    }

    $(".input-amount").removeClass("invalidInput");
    if(avlLIZBalance == 0) {
      $(".error-msg").html("Insufficient balance");
      $(".error-msg").show();
      $("#est_interest").html("0.000");
      return false; 
    }

    if($(".input-amount").val() != "" && (parseInt($(".input-amount").val()) > parseInt(avlLIZBalance) || $(".input-amount").val() <= 0)) {
      $(".error-msg").html("Invalid amount");
      $(".error-msg").show();
      $("#est_interest").html("0.000");
      return false;
    }

    if(parseInt($(".input-amount").val()) < minimumAmount) {
      $(".error-msg").html("Please enter higher amount than minimum amount");
      $(".error-msg").show();
      $("#est_interest").html("0.000");
      return false;
    }

    if($(".input-amount").val() == "") {
      $(".error-msg").hide();
      $("#est_interest").html("0.000");
      return false;
    }

    $(".error-msg").hide();
    // var est_interest = $(".input-amount").val() * est_apy / 100 * tokenPrice;
    var est_interest = $(".input-amount").val() * est_apr / 100 * tokenPrice;
    $("#est_interest").html(est_interest);
    return true;
}


function checkMax() {

  if(parseFloat(selectedCoinBalance) > 0) {
     jQuery("#selectMax").removeAttr("disabled");
     jQuery("#input-amount").removeAttr("disabled");
  } else {
     jQuery("#selectMax").attr("disabled", "true");
     jQuery("#input-amount").attr("disabled", "true");
  }

}

async function checkAllowance() {

  var allowanceAmount = await getAllowanceAmount();

  jQuery("#btn-approve").removeAttr("disabled");
  jQuery("#btn-confirm").removeAttr("disabled");

  if (allowanceAmount <= 0) {
        jQuery("#btn-approve").show();
        jQuery("#btn-confirm").hide();
        jQuery("#btn-approve").html("Approve");
  } else {
        jQuery("#btn-approve").hide();
        jQuery("#btn-confirm").show();
        jQuery("#btn-confirm").html("Confirm");
  }
}

async function getAllowanceAmount() {

  // approve LIZ token
  allowance = await otherLIZContract.methods.allowance(selectedAccount, stakingContractAddress).call();
  var allowanceAmount = new BigNumber(allowance).toNumber();

  return allowanceAmount;
}



async function init(){

  if (window.ethereum) {

      provider = window.ethereum;

      jQuery("#btn-connect-wallet").html("<i class='fas fa-spinner'></i>");

      // Subscribe to accounts change
      provider.on("accountsChanged", (accounts) => {
        fetchAccountData();
      });

      // Subscribe to chainId change
      provider.on("chainChanged", (chainId) => {
        fetchAccountData();
      });

      // Subscribe to networkId change
      provider.on("networkChanged", (networkId) => {
        fetchAccountData();
      });

      fetchAccountData();
      
  }
  calcDate();

  var showDate =  setInterval(function () {
    calcDate();
  }, 60000);
  

  const providerOptions = {
      walletconnect: {
        package: walletConnectProvider,
        options: {
          rpc: {
            56: 'https://bsc-dataseed.binance.org/',
            97: 'https://speedy-nodes-nyc.moralis.io/28eb04c22a0f92b22765e175/bsc/testnet/archive',
          },
          network: "binance", // --> this will be use to determine chain id 56
        },
      },

      fortmatic: {
        package: Fortmatic,
        options: {
          // Mikko's TESTNET api key
          key: "pk_test_391E26A3B43A3350"
        }
      }
    };

    web3Modal = new Web3Modal({
      cacheProvider: false, // optional
      providerOptions, // required
      // disableInjectedProvider: isMobile, // optional. For MetaMask / Brave / Opera.

    });

    web3BaseUrl_main = testMode ? 'https://speedy-nodes-nyc.moralis.io/28eb04c22a0f92b22765e175/bsc/testnet/archive' : 'https://speedy-nodes-nyc.moralis.io/28eb04c22a0f92b22765e175/bsc/mainnet';
    web3_main = new Web3(new Web3.providers.HttpProvider(web3BaseUrl_main));

    otherStakingContract = new web3_main.eth.Contract(stakingAbi, stakingContractAddress);
    otherLIZContract = new web3_main.eth.Contract(bep20Abi, liz);

    getLIZInfo();

    var showLIZInfo =  setInterval(function () {
        getLIZInfo();
    }, 10000);
}


async function getLIZInfo() {
  var tmp_totalLockedAmount = await otherStakingContract.methods.totalDepositAmount().call();
  var totalLockedAmount = parseFloat(web3_main.utils.fromWei(tmp_totalLockedAmount, "nano"));

  // liz price
  var BNTokenPrice = await otherStakingContract.methods.tokenPrice().call();

  var tmp_tokenPrice = parseFloat(web3_main.utils.fromWei(BNTokenPrice, 'ether'));

  tokenPrice = tmp_tokenPrice;

  $(".showTokenPrice").html(tokenPrice);

  $("#totalLockedBalance").html(numberWithSpaces(totalLockedAmount));

}

function numberWithSpaces(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(".");
}

function calcDate() {
  var date = new Date();
  
  var interestDate = 0;

  Date.prototype.addDays = function(days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
  }

  $("#interest-end-date").html(getStrDate(date.addDays(5)));
  $("#redemption-date").html(getStrDate(date.addDays(7)));
  $("#start-date").html(getStrDate(date));
  $("#value-date").html(getStrDate(date));


  // console.log(dateStr);
}

function getStrDate(date) {
  var dateStr =
    date.getFullYear() + "-" +
    ("00" + (date.getMonth() + 1)).slice(-2) + "-" +
    ("00" + date.getDate()).slice(-2) + " " + 
    
    ("00" + date.getHours()).slice(-2) + ":" +
    ("00" + date.getMinutes()).slice(-2)
  return dateStr;
}

jQuery(document).ready(function(){

  jQuery(".connectWallet").on("click", function(){
      if (provider){
         onDisconnect();
      } else {
         onConnect();
      }
  }); 

});


async function deposit() {

   if(!validInput()){
      $(".input-amount").addClass("invalidInput");
      $(".input-amount").focus();
      return;
   }
   var value = $(".input-amount").val();
   var amount = web3_main.utils.toWei(value, "nano");

   jQuery("#btn-confirm").addClass("disabled");
   jQuery("#btn-confirm").html("Processing...");
   try {
      var result;
      var data = stakingContract.methods.deposit(amount, depositType).encodeABI();
      var gasPrice = await web3_main.eth.getGasPrice();
      const tx = {
        from: selectedAccount,
        to: stakingContractAddress,
        gasPrice: gasPrice,
        data: data,
      };

      try {
        console.log(tx);
        result = await web3.eth.sendTransaction(tx);

        console.log(result.logs);

        var amount = result.logs[0].data;

        var amount_int = parseFloat(web3_main.utils.fromWei(amount, "ether"));
        if(result.status) {
           jQuery("#btn-confirm").removeClass("disabled");
           jQuery("#btn-confirm").html("Confirm");
           Swal.fire({
             icon: 'success',
             title: 'Success',
             text: 'Deposited Successfully Amount: ' + value + "LIZ"
           })
           fetchAccountData();
           return;
        } else {
           jQuery("#btn-confirm").removeClass("disabled");
           jQuery("#btn-confirm").html("Confirm");
           Swal.fire({
             icon: 'error',
             title: 'Transaction Fail',
             text: 'Transaction has been rejected'
           })
           fetchAccountData();
           return;
        }
      } catch (err) {
        jQuery("#btn-confirm").removeClass("disabled");
        jQuery("#btn-confirm").html("Confirm");
        console.log(err.message);
      }

      // result = await stakingContract.methods.deposit(amount, depositType).send({from: selectedAccount});

   } catch(e) {

    jQuery("#btn-confirm").removeClass("disabled");
    jQuery("#btn-confirm").html("Confirm");

   }
}


 function onlyNumberKey(evt) {      
     // Only ASCII character in that range allowed
     var ASCIICode = (evt.which) ? evt.which : evt.keyCode
     if (ASCIICode > 31 && (ASCIICode < 46 || ASCIICode > 57))
         return false;
     return true;
 }


async function approve() {
   jQuery("#btn-approve").addClass("disabled");
   jQuery("#btn-approve").html("Processing...");
   try{
      var approve;

      var data = lizContract.methods.approve(stakingContractAddress, maxUint256).encodeABI();
      var gasPrice = await web3_main.eth.getGasPrice();
      const tx = {
        from: selectedAccount,
        to: liz,
        gasPrice: gasPrice,
        data: data,
      };

      // approve = await lizContract.methods.approve(stakingContractAddress, maxUint256).send({from: selectedAccount});

      console.log(tx);
      approve = await web3.eth.sendTransaction(tx);
      if(approve.status) {
         jQuery("#btn-approve").hide();
         jQuery("#btn-confirm").show();
         fetchAccountData();
         return;
      } 
      
   } catch(Exception) {
     jQuery("#btn-approve").removeClass("disabled");
     jQuery("#btn-approve").html("Approve");
   }
}

async function claim() {
   jQuery("#btn-claim").addClass("disabled");
   jQuery("#btn-claim").html("Processing...");
   try {
      var result;
      var data = stakingContract.methods.harvest(0).encodeABI();
      var gasPrice = await web3_main.eth.getGasPrice();
      const tx = {
        from: selectedAccount,
        to: stakingContractAddress,
        gasPrice: gasPrice,
        data: data,
      };

      // result = await stakingContract.methods.harvest(0).send({from: selectedAccount});
      console.log(tx);
      result = await web3.eth.sendTransaction(tx);
      if(result.status) {
         jQuery("#btn-claim").removeClass("disabled");
         jQuery("#btn-claim").html("Claim");
         Swal.fire({
           icon: 'success',
           title: 'Success',
           text: 'Claimed Successfully USDT'
         })
         fetchAccountData();
         return;
      } else {
         jQuery("#btn-claim").removeClass("disabled");
         jQuery("#btn-claim").html("Claim");
         Swal.fire({
           icon: 'error',
           title: 'Transaction Fail',
           text: 'Transaction has been rejected'
         })
         fetchAccountData();
         return;
      }
   
   } catch(e) {
    console.log(e);
    jQuery("#btn-claim").removeClass("disabled");
    jQuery("#btn-claim").html("Claim");
   }
}


async function withdraw() {
   jQuery("#btn-withdraw").addClass("disabled");
   jQuery("#btn-withdraw").html("Processing...");
   try {
      var result;

      var data = stakingContract.methods.withdraw(userDepositAmount).encodeABI();
      var gasPrice = await web3_main.eth.getGasPrice();
      const tx = {
        from: selectedAccount,
        to: stakingContractAddress,
        gasPrice: gasPrice,
        data: data,
      };

      result = await web3.eth.sendTransaction(tx);
      // result = await stakingContract.methods.withdraw(userDepositAmount).send({from: selectedAccount});
      

      if(result.status) {
         jQuery("#btn-withdraw").removeClass("disabled");
         jQuery("#btn-withdraw").html("Withdraw");
         Swal.fire({
           icon: 'success',
           title: 'Success',
           text: 'Claimed Successfully USDT'
         })
         fetchAccountData();
         return;
      } else {
         jQuery("#btn-withdraw").removeClass("disabled");
         jQuery("#btn-withdraw").html("Withdraw");
         Swal.fire({
           icon: 'error',
           title: 'Transaction Fail',
           text: 'Transaction has been rejected'
         })
         fetchAccountData();
         return;
      }
   
   } catch(e) {
    console.log(e);
    jQuery("#btn-withdraw").removeClass("disabled");
    jQuery("#btn-withdraw").html("Withdraw");
   }
}



function searchAccount() {
    if( parseInt(pubChainId) == "56")
        window.open("https://bscscan.com/address/" + selectedAccount, "_newtab");
    if( parseInt(pubChainId) == "97")
        window.open("http://testnet.bscscan.com/address/" + selectedAccount, "_newtab");
}

function copyToClipboard(text) {
    var dummy = document.createElement("textarea");
    // to avoid breaking orgain page when copying more words
    // cant copy when adding below this code
    // dummy.style.display = 'none'
    document.body.appendChild(dummy);
    //Be careful if you use texarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    jQuery(".copyAddressTip").css("display", "block"); 

    clearInterval(showCopied);

    var showCopied =  setInterval(function () {
        jQuery(".copyAddressTip").hide(); 
    }, 3000);

    var hideCopied =  setInterval(function () {
        jQuery(".copyAddressTip").hide(); 
    }, 6000);

    var showCopied =  setInterval(function () {
        clearInterval(showCopied);
        clearInterval(hideCopied);
    }, 20000);
    
    
}

// Select Duration
function setDuration(type) {
  if(type == 0){
    $(".check-active").addClass("hide");
    $(".btn-active").removeClass("btn-active");
    $(".duration0 .check-active").removeClass("hide");
    $(".duration0").addClass("btn-active");
    duration = 90;
    // est_apy = 40;
    est_apr = 10;
    depositType = 0;
  }

  if(type == 1){
    $(".check-active").addClass("hide");
    $(".btn-active").removeClass("btn-active");
    $(".duration1 .check-active").removeClass("hide");
    $(".duration1").addClass("btn-active");
    duration = 180;
    // est_apy = 30;
    est_apr = 15;
    depositType = 1;
  }

  if(type == 2){
    $(".check-active").addClass("hide");
    $(".btn-active").removeClass("btn-active");
    $(".duration2 .check-active").removeClass("hide");
    $(".duration2").addClass("btn-active");
    duration = 365;
    // est_apy = 20;
    est_apr = 20;
    depositType = 2;
  }

  // $("#est_apy").html(est_apy);
  $("#est_apr").html(est_apr);

  validInput();
}
