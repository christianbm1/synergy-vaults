//Checks, Effects, Interactions
require("dotenv").config();
const { expect } = require("chai");
const hre = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");
const s = require("@metamask/eth-sig-util");

let provider;
let impCRS;
let impBUSD;
let impBNB;

let FARM;
let VAULT;
let DIST;
let busdToken;
let crystalToken;
let diamondToken;
let pairToken;

const crystal = '0xa1A5AD28C250B9383c360c0f69aD57D70379851e';
const busd = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
const diamond = '0xcAE4F3977c084aB12B73a920e670e1665B3fA7D5';
const pair = '0x3411F287C3FC5fbC1Be9fcC324d47541EBF220c6';

const purse = '0x958432f1dD53E23d8B4FEfbC483177BCff3F6fb6';
const uniswap_router = '0x10ED43C718714eb63d5aA57B78B54704E256024E';

async function mineNBlocks(n) {
  for (let index = 0; index < n; index++) {
    await ethers.provider.send('evm_mine');
  }
}
async function CreateMessage(obj) {
  const privateKey1Buffer = Buffer.from(
    process.env.testKey,
    "hex"
  );
  const msgParams = {
    domain: {
      chainId: obj.chainid,
      name: "SYNERGY",
      verifyingContract: ethers.utils.getAddress(obj.verifAddress),
      version: "1",
    },
    message: {
      _twap: obj._twap,
      _nonce: obj._nonce,
      _fee: obj._fee
    },
    primaryType: "TWAP",
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      TWAP: [
        { name: "_twap", type: "uint256" },
        { name: "_nonce", type: "uint256" },
        { name: "_fee", type: "uint256" },
      ],
    },
  };

  const sHash = s.signTypedData({
    privateKey: privateKey1Buffer,
    data: msgParams,
    version: s.SignTypedDataVersion.V4,
  });
  return sHash;
}
//fund wallets used in testing
const fundpurse = async () => {
  await busdToken.connect(impBUSD).transfer(purse, ethers.utils.parseEther('1000'));
  await busdToken.connect(impBUSD).transfer(addr1.address, ethers.utils.parseEther('1000'));
  await busdToken.connect(impBUSD).transfer(addr2.address, ethers.utils.parseEther('1000'));
  await busdToken.connect(impBUSD).transfer(addr3.address, ethers.utils.parseEther('1000'));
  try {
    await crystalToken.connect(impCRS).transfer(purse, ethers.utils.parseEther('500'));
    await crystalToken.connect(impCRS).transfer(deployer.address, ethers.utils.parseEther('1500'));
    await crystalToken.connect(impCRS).transfer('0xBDd0174cA7C66DAe44a8485Cf9f339dE671Dfb81', ethers.utils.parseEther('2000'));

  } catch (e) {
    console.log("Funding Error - overspent wallets");
  }

  //console.log(res1);
  //console.log(res2);

  /*const tx = {
    from: impBUSD.address,
    to: purse,
    value: ethers.utils.parseEther('1000'),
  }*/

  //const res3 = await impBUSD.sendTransaction(tx);
}

before(async function () {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x41050e6543E88f7F1487cdfBB295ddf0a343c043"],
    });

    impCRS = await ethers.getSigner("0x41050e6543E88f7F1487cdfBB295ddf0a343c043");

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x8894e0a0c962cb723c1976a4421c95949be2d4e3"],
    });

    impBUSD = await ethers.getSigner("0x8894e0a0c962cb723c1976a4421c95949be2d4e3");

    [deployer, addr1, addr2, addr3, addr4, addr5, addr6, addr7, ...addrs] =
      await hre.ethers.getSigners();

    provider = ethers.provider;
    console.log(`Deployer Address: ${deployer.address}`);
    console.log(`deployer Balance: ${await ethers.provider.getBalance(deployer.address)}`);
    console.log(`addr1 Address: ${addr1.address}`);
    console.log(`addr2 Address: ${addr2.address}`);
    console.log(`addr3 Address: ${addr3.address}`);
    console.log(`addr4 Address: ${addr4.address}`);
    console.log(`addr1 Balance: ${await ethers.provider.getBalance(addr1.address)}`);

    console.log(`impCRS Address: ${impCRS.address}`);
    console.log(`impCRS Balance: ${await provider.getBalance(impCRS.address)}`);

    console.log(`impBUSD Address: ${impBUSD.address}`);
    console.log(`impBUSD Balance: ${await provider.getBalance(impBUSD.address)}`);

    busdToken = await ethers.getContractAt(
      "Token",
      busd
    );

    crystalToken = await ethers.getContractAt(
      "Token",
      crystal
    );

    diamondToken = await ethers.getContractAt(
      "Token",
      diamond
    );

    pairToken = await ethers.getContractAt(
      "Token",
      pair
    );

    FARM = await ethers.getContractAt(
      "DIARewardPool",
      '0xb2C5A04A71426756FCAbD0439E3738373C0A5064'
    );

    await fundpurse();
  });
  describe("Synergy Magic Vault Smart Contract Testing", function () {
    before((done) => {
      setTimeout(done, 2000);
      console.log('before being ran');
    });
    describe("Contract Deployment", async function () {
      /*console.log(`Purse BNB Balance: ${await provider.getBalance(purse)}`);
      console.log(`Purse BUSD Balance: ${await busdToken.balanceOf(purse)}`);
      console.log(`Purse CRS Balance: ${await crystalToken.balanceOf(purse)}`);
      console.log(`Deployer CRS Balance: ${await crystalToken.balanceOf(deployer.address)}`);*/
      it("successfully deploy contract", async function () {
        const Contract = await ethers.getContractFactory("BurningVault");
        VAULT = await Contract.deploy(
          uniswap_router,
          deployer.address,
          'SYNERGY',
          '1'
        );
        expect(VAULT).to.be.an('object');
        console.log(`CONTRACT DEPLOYED AT: ${VAULT.address}`);
      });
      it("the owner is the deployer", async function(){
        const response = await VAULT.owner();
        expect(response).to.be.equal(deployer.address);
      });
      it("correct busd address is set", async function(){
        expect( await VAULT.busd()).to.be.equal(busd);
      });
      it("correct crystal address is set", async function(){
        expect( await VAULT.crystal()).to.be.equal(crystal);
      });
      it("correct diamond address is set", async function(){
        expect( await VAULT.diamond()).to.be.equal('0xcAE4F3977c084aB12B73a920e670e1665B3fA7D5');
      });
      it("correct pool id is set", async function(){
        expect( await VAULT.pid()).to.be.equal(0);
      });
      it("correct pair address is calcualted", async function(){
        expect( await VAULT.pair()).to.be.equal('0x3411F287C3FC5fbC1Be9fcC324d47541EBF220c6');
      });
    });
    describe("Check Owner Allowed Features", async function(){
      describe("Transfer Owenership", async function(){
        it("non-owner cannot transfer ownership 1/2", async function(){
          await expect(VAULT.connect(addr1).transferOwnership(addr2.address)).to.be.reverted;
        });
        it("owner can transfer ownership 1/2", async function (){
          expect( await VAULT.connect(deployer).transferOwnership(addr1.address)).to.be.an('object');
        });
        it("non-owner cannot transfer ownership 2/2", async function(){
          await expect(VAULT.connect(addr2).transferOwnership(addr3.address)).to.be.reverted;
        });
        it("owner can transfer ownership 2/2", async function (){
          expect( await VAULT.connect(addr1).transferOwnership(deployer.address)).to.be.an('object');
        });
      });
      describe("Setting PoolID", async function(){
        it("non owner cannot set poolid", async function(){
          await expect(VAULT.connect(addr1).setPoolId(1)).to.be.reverted;
        });
        it("onwer cannot set to same poolid", async function(){
          await expect(VAULT.connect(deployer).setPoolId(0)).to.be.reverted;
        });
        it("onwer can successfully set poolid 1/2", async function(){
          expect(await VAULT.connect(deployer).setPoolId(1)).to.be.an('object');
        });
        it("the copied poolid info matches whats in the farm 1/2", async function(){
          const farmActual = await FARM.poolInfo(1);
          const response = await VAULT.copiedPoolInfo();

          expect(response.token).to.be.equal(farmActual.token);
          expect(response.allocPoint.toString()).to.be.equal(farmActual.allocPoint.toString());
          expect(response.lastRewardTime.toString()).to.be.equal(farmActual.lastRewardTime.toString());
          expect(response.accDIAPerShare.toString()).to.be.equal(farmActual.accDIAPerShare.toString());
        });
        it("onwer can successfully set poolid 2/2", async function(){
          expect(await VAULT.connect(deployer).setPoolId(0)).to.be.an('object');
        });
        it("the copied poolid info matches whats in the farm 2/2", async function(){
          const farmActual = await FARM.poolInfo(0);
          const response = await VAULT.copiedPoolInfo();

          expect(response.token).to.be.equal(farmActual.token);
          expect(response.allocPoint.toString()).to.be.equal(farmActual.allocPoint.toString());
          expect(response.lastRewardTime.toString()).to.be.equal(farmActual.lastRewardTime.toString());
          expect(response.accDIAPerShare.toString()).to.be.equal(farmActual.accDIAPerShare.toString());
        });
      });
      describe("Witdrawing BUSD", function(){
        let busdBefore;
        let amountSent = '1000';
        before(async () => {
          await busdToken.connect(impBUSD).transfer(VAULT.address, ethers.utils.parseEther(amountSent));
        });
        beforeEach(async () => {
          busdBefore = await busdToken.balanceOf(deployer.address);
        });
        it("Has busd available to withdraw", async function(){
          expect(await busdToken.balanceOf(VAULT.address)).to.be.equal(ethers.utils.parseEther(amountSent));
        });
        it("non-owner cannot withdraw", async function(){
          await expect(VAULT.connect(addr1).ownerWithdrawBUSD()).to.be.reverted;
        });
        it("owner can successfully withdraw", async function(){ 
          expect(await VAULT.connect(deployer).ownerWithdrawBUSD()).to.be.an('object');
          const diff = ethers.utils.formatEther((await busdToken.balanceOf(deployer.address)).toString()) - ethers.utils.formatEther(busdBefore.toString());
          expect(diff.toString()).to.be.equal(amountSent);
        });
      });
      describe("Witdrawing Crystal", function(){
        let crystalBefore;
        let amountSent = '5';
        before(async () => {
          await crystalToken.connect(impCRS).transfer(VAULT.address, ethers.utils.parseEther(amountSent));
        });
        beforeEach(async () => {
          crystalBefore = await crystalToken.balanceOf(deployer.address);
        });
        it("Has crystals available to withdraw", async function(){
          expect(await crystalToken.balanceOf(VAULT.address)).to.be.equal(ethers.utils.parseEther('5'));
        });
        it("non-owner cannot withdraw", async function(){
          await expect(VAULT.connect(addr1).ownerWithdrawCrystals()).to.be.reverted;
        });
        it("owner can successfully withdraw", async function(){ 
          expect(await VAULT.connect(deployer).ownerWithdrawCrystals()).to.be.an('object');
          const diff = ethers.utils.formatEther((await crystalToken.balanceOf(deployer.address)).toString()) - ethers.utils.formatEther(crystalBefore.toString());
          expect(diff.toString()).to.be.equal(amountSent);
        });
      });
      describe("Witdrawing Diamond", function(){

      });
      describe("Witdrawing LPs", function(){});
    });
    describe("Check Deposit Feature", async function(){
      describe("Fails: Deposit Function", async function(){
        it("Fails if amount deposited is less than 0", async function(){
          await expect(VAULT.depositBUSD('0xad3c3cfd315d1238a2d44754a364c3981d6cc22bd5bcbdb297cc76407f06adf2325fe5aaf0671a383bb7a4e3dce7ad45b660f9bd7e4b5e9361e57bb1900986591b', 100, 1, 0, 0)).to.be.reverted;
        });
        it("Fails if the caller does not have the amount deposited", async function(){
          await expect(VAULT.depositBUSD('0xad3c3cfd315d1238a2d44754a364c3981d6cc22bd5bcbdb297cc76407f06adf2325fe5aaf0671a383bb7a4e3dce7ad45b660f9bd7e4b5e9361e57bb1900986591b', 100, 1, 0, ethers.utils.parseEther('1000000000'))).to.be.reverted;
        });
        it("Fails if caller has not set contract allowance", async function(){
          await expect(VAULT.depositBUSD('0xad3c3cfd315d1238a2d44754a364c3981d6cc22bd5bcbdb297cc76407f06adf2325fe5aaf0671a383bb7a4e3dce7ad45b660f9bd7e4b5e9361e57bb1900986591b', 100, 1, 0, 1000)).to.be.reverted;
        });
      });
      
      describe("Deposit Function Success", function(){
        let amountToDeposit = ethers.utils.parseEther('100');
        let signature;
        let _twap = (100).toString();
        let _time;

        before(async () => {
          _time = (ethers.provider.blockNumber + 5).toString();
          await busdToken.connect(addr1).approve(VAULT.address, amountToDeposit);

          console.log(`Blocknumber: ${ethers.provider.blockNumber}`);
          console.log(`Paassed in Blocknumber: ${_time}`);

          signature = await CreateMessage({
            verifAddress: VAULT.address,
            chainid: 31337,
            _twap: _twap,
            _nonce: 0,
            _fee: 0
          });
          //console.log((await crystalToken.balanceOf(VAULT.address)).toString());
        });
        it("user deposit success 1 / 2", async function(){
          //console.log((await crystalToken.balanceOf(VAULT.address)).toString());
          expect( await VAULT.connect(addr1).depositBUSD(signature, _twap, 0, 0, amountToDeposit) ).to.be.an('object');
        });
        it("User is added as an investor", async function(){
          const response = await VAULT.userInfo(addr1.address);
          expect(response.busdInvested).to.be.greaterThan(0);
        });
        it("Deposit is added to CRS/BUSD Farm", async function(){
          const response = await VAULT.userInfo(addr1.address);
          const farmAns = await FARM.userInfo(0, VAULT.address);
          expect(farmAns.amount).to.be.equal(response.lpsPlanted);
          expect(farmAns.rewardDebt).to.be.equal(response.rewardDebt);
        });
        it("User can see Pending Shares", async function(){
          const ans = await VAULT.pendingShare(addr1.address);
          expect(ans).to.be.an('object');
        });
      });
      /*describe("Make several deposits", function(){
        let amountToDeposit = ethers.utils.parseEther('50');
        beforeEach(async () => {
          await mineNBlocks(10);
        });
        it("user deposit success 1 / 3", async function(){
          //console.log((await crystalToken.balanceOf(VAULT.address)).toString());
          await busdToken.connect(addr1).approve(VAULT.address, amountToDeposit);
          expect( await VAULT.connect(addr1).depositBUSD(amountToDeposit) ).to.be.an('object');
          const ans = await diamondToken.balanceOf(VAULT.address);
          console.log(ethers.utils.formatEther(ans));
        });
        /*it("diamonds are released", async function(){
          const ans = await diamondToken.balanceOf(VAULT.address);
          console.log(ethers.utils.formatEther(ans));
        });*/
        /*it("user deposit success 2 / 3", async function(){
          //console.log((await crystalToken.balanceOf(VAULT.address)).toString());
          await busdToken.connect(addr2).approve(VAULT.address, amountToDeposit);
          expect( await VAULT.connect(addr2).depositBUSD(amountToDeposit) ).to.be.an('object');
          const ans = await diamondToken.balanceOf(VAULT.address);
          console.log(ethers.utils.formatEther(ans));
        });*/
        /*it("diamonds are released", async function(){
          const ans = await diamondToken.balanceOf(VAULT.address);
          console.log(ethers.utils.formatEther(ans));
        });*/
        /*it("user deposit success 3 / 3", async function(){
          //console.log((await crystalToken.balanceOf(VAULT.address)).toString());
          await busdToken.connect(addr3).approve(VAULT.address, amountToDeposit);
          expect( await VAULT.connect(addr3).depositBUSD(amountToDeposit) ).to.be.an('object');
          const ans = await diamondToken.balanceOf(VAULT.address);
          console.log(ethers.utils.formatEther(ans));
        });*/
        /*it("diamonds are released", async function(){
          const ans = await diamondToken.balanceOf(VAULT.address);
          console.log(ethers.utils.formatEther(ans));
        });
      });*/
    });
    describe("Check Withdraw Feature", async function(){
      describe("Fails: Withdraw Function", async function(){
        it("Fails if amount invested is less than or equal to 0", async function(){
          await expect(VAULT.connect(addr1).withdrawBUSD('0xad3c3cfd315d1238a2d44754a364c3981d6cc22bd5bcbdb297cc76407f06adf2325fe5aaf0671a383bb7a4e3dce7ad45b660f9bd7e4b5e9361e57bb1900986591b',0,0,0, '0')).to.be.revertedWith("Insufficient Withdrawl");
        });
        it("Fails if amount to withdraw is greater than what was initially invested", async function(){
          await expect(VAULT.connect(addr1).withdrawBUSD('0xad3c3cfd315d1238a2d44754a364c3981d6cc22bd5bcbdb297cc76407f06adf2325fe5aaf0671a383bb7a4e3dce7ad45b660f9bd7e4b5e9361e57bb1900986591b',0,0,0, ethers.utils.parseEther('10000'))).to.be.revertedWith("Insufficient Withdrawl");
        });
      });
      describe("Withdraw Function Success", async function(){
        let busdBefore;
        let crystalBefore;
        let diamondBefore;
        before(async () => {
          busdBefore = await busdToken.balanceOf(addr1.address);
          crystalBefore = await crystalToken.balanceOf(addr1.address);
          diamondBefore = await diamondToken.balanceOf(addr1.address);
        });

        it("Deposit withdrawl success", async function(){

          const nonce = await VAULT.nonce();

          let signature = await CreateMessage({
            verifAddress: VAULT.address,
            chainid: 31337,
            _twap: 100,
            _nonce: nonce.toString(),
            _fee: 0
          });
          const user = await VAULT.userInfo(addr1.address);
          expect(await VAULT.connect(addr1).withdrawBUSD(signature, 100, nonce.toString(), 0, user.lpsPlanted.toString()))
        })
        it("User is removed from investment/reward list", async function(){
          const response = await VAULT.userInfo(addr1.address);
          expect(response.busdInvested).to.be.equal(0);
        });
        it("User received BUSD", async function(){
          let busdAfter = await busdToken.balanceOf(addr1.address);
          expect(busdAfter).to.be.greaterThan(busdBefore);
        });
        it("User received Crystal", async function(){
          let crystalAfter = await busdToken.balanceOf(addr1.address);
          expect(crystalAfter).to.be.greaterThan(crystalBefore);
        });
        it("User received Diamond Rewards", async function(){
          let diamondAfter = await busdToken.balanceOf(addr1.address);
          expect(diamondAfter).to.be.greaterThan(diamondBefore);
        });
      });
    });
});