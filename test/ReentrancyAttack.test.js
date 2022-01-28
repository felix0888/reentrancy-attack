const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReentrancyAttack", function () {
  let Reentrance, reentrance, ReentrancyAttack, reentrancyAttack;
  let owner, attacker, alice, bob, carol, signers;

  beforeEach(async function() {
    [owner, attacker, alice, bob, carol, signers] = await ethers.getSigners();
    Reentrance = await ethers.getContractFactory("Reentrance");
    reentrance = await Reentrance.deploy();
    ReentrancyAttack = await ethers.getContractFactory("ReentrancyAttack");
    reentrancyAttack = await ReentrancyAttack.connect(attacker).deploy();
  });

  describe("deployment", function() {
    it("should set the attacker", async function() {
      expect(await reentrancyAttack.attacker()).to.equal(attacker.address);
    });
  });

  describe("#attack", function() {
    beforeEach(async function() {

    });

    it("should be reverted if non-attacker tries", async function() {
      await expect(
        reentrancyAttack.connect(alice).attack(reentrance.address)
      ).to.be.revertedWith(
        "ReentrancyAttack: NOT_OWNER"
      );
    });
  });

  it("should transfer all the funds on Reentrance to ReentrancyAttack", async function() {
    await reentrance.connect(alice).donate(bob.address, { value: ethers.utils.parseEther("10") });
    await reentrance.connect(bob).donate(carol.address, { value: ethers.utils.parseEther("20") });
    expect(await ethers.provider.getBalance(reentrance.address)).to.equal(ethers.utils.parseEther("30"));

    await reentrancyAttack.connect(attacker).attack(reentrance.address, { value: ethers.utils.parseEther("1") });
    expect(await ethers.provider.getBalance(reentrance.address)).to.equal(ethers.utils.parseEther("0"));
    expect(await ethers.provider.getBalance(reentrancyAttack.address)).to.equal(ethers.utils.parseEther("31"));
  });
});
