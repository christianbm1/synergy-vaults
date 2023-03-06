//Checks, Effects, Interactions

const { expect } = require("chai");
const hre = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

let provider;
let impCRS;
let impBUSD;
let impBNB;

let FARM;
let VAULT;
let BURNING;
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
        const Contract = await ethers.getContractFactory("MagicVault");
        VAULT = await Contract.deploy(
          uniswap_router,
          '0xBDd0174cA7C66DAe44a8485Cf9f339dE671Dfb81',
          '0x1d3571BadF6140445f9441f2df8170BC5d0886ec'
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
      it("correct vault address is set", async function(){
        expect( await VAULT.burningVault()).to.be.equal('0x1d3571BadF6140445f9441f2df8170BC5d0886ec');
      });
      it("correct treasury address is set", async function(){
        expect( await VAULT.treasury()).to.be.equal('0xBDd0174cA7C66DAe44a8485Cf9f339dE671Dfb81');
      });
      it("correct treasury fee is set", async function(){
        expect( await VAULT.treasuryFee()).to.be.equal(300);
      });
      it("correct vault fee is set", async function(){
        expect( await VAULT.vaultFee()).to.be.equal(200);
      });
      it("correct total fee is set", async function(){
        expect( await VAULT.depositFee()).to.be.equal(500);
      });
      it("correct performance fee is set", async function(){
        expect( await VAULT.performanceFee()).to.be.equal(2500);
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
      describe("Setting Treasury Address", async function(){
        it("non owner cannot set address", async function(){
          await expect(VAULT.connect(addr1).setTreasuryAccount(addr2.address)).to.be.reverted;
        });
        it("owner cannot set the treasury account to the 0 address", async function(){
          await expect(VAULT.connect(deployer).setTreasuryAccount(ethers.constants.AddressZero)).to.be.reverted;
        });
        it("owner cannot set the treasury address to the vaults address", async function(){
          await expect(VAULT.connect(deployer).setTreasuryAccount(VAULT.address)).to.be.reverted;
        });
        it("owner can successfully change the treasury address 1/2", async function(){
          expect( await VAULT.setTreasuryAccount(addr1.address)).to.be.an('object');
        });
        it("owner can successfully change the treasury address 2/2", async function(){
          expect( await VAULT.setTreasuryAccount('0xBDd0174cA7C66DAe44a8485Cf9f339dE671Dfb81')).to.be.an('object');
        });
      });
      describe("Setting Burning Vault Address", async function(){
        it("non owner cannot set address", async function(){
          await expect(VAULT.connect(addr1).setBurningVaultAccount(addr2.address)).to.be.reverted;
        });
        it("owner cannot set the burning vault account to the 0 address", async function(){
          await expect(VAULT.connect(deployer).setBurningVaultAccount(ethers.constants.AddressZero)).to.be.reverted;
        });
        it("owner cannot set the burning vault address to the vaults address", async function(){
          await expect(VAULT.connect(deployer).setBurningVaultAccount(VAULT.address)).to.be.reverted;
        });
        it("owner can successfully change the burning vault address 1/2", async function(){
          expect( await VAULT.setBurningVaultAccount(addr1.address)).to.be.an('object');
        });
        it("owner can successfully change the burning vault address 2/2", async function(){
          expect( await VAULT.setBurningVaultAccount('0x1d3571BadF6140445f9441f2df8170BC5d0886ec')).to.be.an('object');
        });
      });
      describe("Setting Treasury Fee", async function(){
        it("non owner cannot set fee", async function(){
          await expect(VAULT.connect(addr1).setDepositTreasuryFee(500)).to.be.reverted;
        });
        it("onwer cannot set to same fee", async function(){
          await expect(VAULT.connect(deployer).setDepositTreasuryFee(300)).to.be.reverted;
        });
        it("onwer can successfully set fee 1/2", async function(){
          expect(await VAULT.connect(deployer).setDepositTreasuryFee(400)).to.be.an('object');
        });
        it("onwer can successfully set fee 2/2", async function(){
          expect(await VAULT.connect(deployer).setDepositTreasuryFee(300)).to.be.an('object');
        });
      });
      describe("Setting Burning Vault Fee", async function(){
        it("non owner cannot set fee", async function(){
          await expect(VAULT.connect(addr1).setDepositVaultFee(500)).to.be.reverted;
        });
        it("onwer cannot set to same fee", async function(){
          await expect(VAULT.connect(deployer).setDepositVaultFee(200)).to.be.reverted;
        });
        it("onwer can successfully set fee 1/2", async function(){
          expect(await VAULT.connect(deployer).setDepositVaultFee(100)).to.be.an('object');
        });
        it("onwer can successfully set fee 2/2", async function(){
          expect(await VAULT.connect(deployer).setDepositVaultFee(200)).to.be.an('object');
        });
      });
      describe("Setting Performance Fee", async function(){
        it("non owner cannot set fee", async function(){
          await expect(VAULT.connect(addr1).setPerformanceFee(5000)).to.be.reverted;
        });
        it("onwer cannot set to same fee", async function(){
          await expect(VAULT.connect(deployer).setPerformanceFee(2500)).to.be.reverted;
        });
        it("onwer can successfully set fee 1/2", async function(){
          expect(await VAULT.connect(deployer).setPerformanceFee(2000)).to.be.an('object');
        });
        it("onwer can successfully set fee 2/2", async function(){
          expect(await VAULT.connect(deployer).setPerformanceFee(2500)).to.be.an('object');
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
      describe("Despositing Crystals", async function(){
        it("non-owners cannot use the crystal deposit function", async function(){
          await expect(VAULT.connect(impCRS).fundVaultWithCrystals('100')).to.be.reverted;
        });
        it("fails if owner sends in 0, less or nothing", async function(){
          
          try {
            await expect(VAULT.fundVaultWithCrystals()).to.be.reverted;
          } catch{}
          
          await expect(VAULT.fundVaultWithCrystals('0')).to.be.reverted;
          await expect(VAULT.fundVaultWithCrystals('10')).to.be.reverted;
        })
        it("succeeds if owner sends correct ammount", async function(){
          await crystalToken.approve(VAULT.address, ethers.utils.parseEther('1000'));
          expect(await VAULT.fundVaultWithCrystals(ethers.utils.parseEther('1000'))).to.be.an('object');
        })
      });
      /*describe("Funding Vault with Crystal", async function(){
        it("fund with crystals fails on non-owner", async function(){
          //const resp = await VAULT.connect(impCRS).fundVaultWithCrystals(ethers.utils.parseEther('10'));
          await expect(VAULT.connect(impCRS).fundVaultWithCrystals(ethers.utils.parseEther('10'))).to.be.reverted;
        });
        it("fund with crystals works for owner", async function(){
          const approve = await crystalToken.connect(deployer).approve(VAULT.address, ethers.utils.parseEther('1000'));
          //console.log(approve);
          const resp = await VAULT.connect(deployer).fundVaultWithCrystals(ethers.utils.parseEther('1000'));
          expect(resp).to.be.an('object');
          const amtAfter = await crystalToken.balanceOf(VAULT.address);
          console.log(`amt after: ${amtAfter}`);
          expect(amtAfter.toString()).to.be.equal(ethers.utils.parseEther('1000'));
        });
      });*/
    });
    describe("Check Deposit Feature", async function(){
      describe("Fails: Deposit Function", async function(){
        it("Fails if amount deposited is less than 0", async function(){
          await expect(VAULT.depositBUSD(0)).to.be.reverted;
        });
        it("Fails if the caller does not have the amount deposited", async function(){
          await expect(VAULT.depositBUSD(ethers.utils.parseEther('1000000000'))).to.be.reverted;
        });
        it("Fails if caller has not set contract allowance", async function(){
          await expect(VAULT.depositBUSD(1000)).to.be.reverted;
        });
      });
      
      /*describe("Deposit Function Success", function(){
        let amountToDeposit = ethers.utils.parseEther('100');
        let treasuryBefore;
        let vaultBefore;
        let treasuryTax = (amountToDeposit * 0.03).toString();
        let vaultTax = (amountToDeposit * 0.02).toString();
        before(async () => {
          await busdToken.connect(addr1).approve(VAULT.address, amountToDeposit);
          treasuryBefore = await busdToken.balanceOf(await VAULT.treasury());
          vaultBefore = await busdToken.balanceOf(await VAULT.burningVault());
          //console.log((await crystalToken.balanceOf(VAULT.address)).toString());
        });
        it("user deposit success 1 / 2", async function(){
          //console.log((await crystalToken.balanceOf(VAULT.address)).toString());
          expect( await VAULT.connect(addr1).depositBUSD(amountToDeposit) ).to.be.an('object');
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
        it("BUSD Fee is sent to Treasury Account", async function(){
          treasuryAfter = await busdToken.balanceOf(await VAULT.treasury());
          expect((treasuryAfter.toString() - treasuryBefore.toString()).toString()).to.be.equal(treasuryTax);
        });
        it("BUSD Fee is sent to Vault Account", async function(){
          vaultAfter = await busdToken.balanceOf(await VAULT.burningVault());
          expect((vaultAfter.toString() - vaultBefore.toString()).toString()).to.be.equal(vaultTax);
        });
        it("User can see Pending Shares", async function(){
          const ans = await VAULT.pendingShare(addr1.address);
          expect(ans).to.be.an('object');
        });
      });*/
      describe("Make several deposits", function(){
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
        it("user deposit success 2 / 3", async function(){
          //console.log((await crystalToken.balanceOf(VAULT.address)).toString());
          await busdToken.connect(addr2).approve(VAULT.address, amountToDeposit);
          expect( await VAULT.connect(addr2).depositBUSD(amountToDeposit) ).to.be.an('object');
          const ans = await diamondToken.balanceOf(VAULT.address);
          console.log(ethers.utils.formatEther(ans));
        });
        /*it("diamonds are released", async function(){
          const ans = await diamondToken.balanceOf(VAULT.address);
          console.log(ethers.utils.formatEther(ans));
        });*/
        it("user deposit success 3 / 3", async function(){
          //console.log((await crystalToken.balanceOf(VAULT.address)).toString());
          await busdToken.connect(addr3).approve(VAULT.address, amountToDeposit);
          expect( await VAULT.connect(addr3).depositBUSD(amountToDeposit) ).to.be.an('object');
          const ans = await diamondToken.balanceOf(VAULT.address);
          console.log(ethers.utils.formatEther(ans));
        });
        /*it("diamonds are released", async function(){
          const ans = await diamondToken.balanceOf(VAULT.address);
          console.log(ethers.utils.formatEther(ans));
        });*/
      });
    });
    describe("Check Withdraw Feature", async function(){
      describe("Fails: Withdraw Function", async function(){
        it("Fails if amount invested is less than or equal to 0", async function(){
          await expect(VAULT.connect(addr1).withdrawBUSD('0')).to.be.revertedWith("Insufficient Withdrawl");
        });
        it("Fails if amount to withdraw is greater than what was initially invested", async function(){
          await expect(VAULT.connect(addr1).withdrawBUSD(ethers.utils.parseEther('10000'))).to.be.revertedWith("Insufficient Withdrawl");
        });
        it("Fails if not enough lps received to cover withdraw amount", async function() {
          //pair.connect(VAULT).transfer('', ethers)
        });
        it("Fails if not enough diamonds to distribute reward");
      });
      describe("Deposit Function Success", async function(){
        let busdBefore;
        let crystalBefore;
        let diamondBefore;
        let contractCrystalBefore;
        before(async () => {
          busdBefore = await busdToken.balanceOf(addr1.address);
          crystalBefore = await crystalToken.balanceOf(addr1.address);
          diamondBefore = await diamondToken.balanceOf(addr1.address);
          contractCrystalBefore = await crystalToken.balanceOf(VAULT.address);
        });
        it("Deposit withdrawl success", async function(){
          const user = await VAULT.userInfo(addr1.address);
          expect(await VAULT.connect(addr1).withdrawBUSD(user.lpsPlanted.toString()))
        })
        it("Crystals borrowed returned to contract", async function(){
          const contractCystalAfer = await crystalToken.balanceOf(VAULT.address);
          expect(contractCystalAfer).to.be.greaterThan(contractCrystalBefore);
        });
        it("User is removed from investment/reward list", async function(){
          const response = await VAULT.userInfo(addr1.address);
          expect(response.busdInvested).to.be.equal(0);
        });
        it("User received BUSD", async function(){
          let busdAfter = await busdToken.balanceOf(addr1.address);
          expect(busdAfter).to.be.greaterThan(busdBefore);
        });
        it("User received Diamond Rewards", async function(){
          let diamondAfter = await busdToken.balanceOf(addr1.address);
          expect(diamondAfter).to.be.greaterThan(diamondBefore);
        });
        //it("Treasury receives performance fee from gains (IF)");
      });
    });
});