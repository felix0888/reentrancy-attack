const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reentrance", function () {
  let Reentrance, reentrance;
  let owner, alice, bob, carol, signers;

  beforeEach(async function() {
    [owner, alice, bob, carol, signers] = await ethers.getSigners();
    Reentrance = await ethers.getContractFactory("Reentrance");
    reentrance = await Reentrance.deploy();
  });

  describe("#donate, #balanceOf", function() {
    it("should set the balance, return balance for given address", async function() {
      expect(await reentrance.balanceOf(alice.address)).to.equal(0);
      expect(await reentrance.balanceOf(bob.address)).to.equal(0);
      expect(await reentrance.balanceOf(carol.address)).to.equal(0);

      await reentrance.connect(alice).donate(bob.address, { value: ethers.utils.parseEther("10") });
      await reentrance.connect(carol).donate(bob.address, { value: ethers.utils.parseEther("3") });

      await reentrance.connect(bob).donate(alice.address, { value: ethers.utils.parseEther("5") });
      await reentrance.connect(alice).donate(carol.address, { value: ethers.utils.parseEther("20") });

      expect(await reentrance.balanceOf(alice.address)).to.equal(ethers.utils.parseEther("5"));
      expect(await reentrance.balanceOf(bob.address)).to.equal(ethers.utils.parseEther("13"));
      expect(await reentrance.balanceOf(carol.address)).to.equal(ethers.utils.parseEther("20"));
    });
  });

  describe("#withdraw", function() {
    beforeEach(async function() {
      await reentrance.donate(alice.address, { value: ethers.utils.parseEther("10") });
    });

    it("should do nothing if one tries to withdraw amount more than balance", async function() {
      expect(await reentrance.balanceOf(alice.address)).to.equal(ethers.utils.parseEther("10"));
      expect(await reentrance.balanceOf(bob.address)).to.equal(0);

      await reentrance.connect(alice).withdraw(ethers.utils.parseEther("15"));
      expect(await reentrance.balanceOf(alice.address)).to.equal(ethers.utils.parseEther("10"));

      await reentrance.connect(bob).withdraw(ethers.utils.parseEther("5"));
      expect(await reentrance.balanceOf(bob.address)).to.equal(0);
    });

    it("should transfer amount and update balance if amount is less than balance", async function() {
      const contractEth = await ethers.provider.getBalance(reentrance.address);
      const aliceEth = await ethers.provider.getBalance(alice.address);
      expect(await reentrance.balanceOf(alice.address)).to.equal(ethers.utils.parseEther("10"));

      await reentrance.connect(alice).withdraw(ethers.utils.parseEther("8"));
      expect(await reentrance.balanceOf(alice.address)).to.equal(ethers.utils.parseEther("2"));
      expect(await ethers.provider.getBalance(reentrance.address)).to.lt(contractEth);
      expect(await ethers.provider.getBalance(alice.address)).to.gt(aliceEth);
    });
  });
});
