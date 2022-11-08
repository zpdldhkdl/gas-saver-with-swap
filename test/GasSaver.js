const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GasSaver", () => {
  const PANCAKE_FACTORY_ADDRESS = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
  const deployGasSaverFixture = async () => {
    const [owner, otherAccount] = await ethers.getSigners();

    const GasSaver = await ethers.getContractFactory("GasSaver");
    const gasSaver = await GasSaver.deploy(PANCAKE_FACTORY_ADDRESS);

    return { gasSaver, owner };
  };

  describe("Deployment", () => {
    it("Should set the right factory address", async () => {
      const { gasSaver } = await loadFixture(deployGasSaverFixture);

      expect(await gasSaver.factory()).to.equal(PANCAKE_FACTORY_ADDRESS);
    });

    it("Should set the right owner", async () => {
      const { gasSaver, owner } = await loadFixture(deployGasSaverFixture);

      expect(await gasSaver.owner()).to.equal(owner.address);
    });
  });

  describe("Create & Destoy subContract", () => {
    it("Should return 5", async () => {
      const { gasSaver } = await loadFixture(deployGasSaverFixture);

      await gasSaver.create(5);

      expect(await gasSaver.activeSubContractAmount()).to.equal(5);
    });

    it("Should return 3", async () => {
      const { gasSaver } = await loadFixture(deployGasSaverFixture);

      await gasSaver.create(5);
      await gasSaver.destroy(2);

      expect(await gasSaver.activeSubContractAmount()).to.equal(3);
    });

    it("Should return 0", async () => {
      const { gasSaver } = await loadFixture(deployGasSaverFixture);

      await gasSaver.create(5);
      await gasSaver.destroy(10);

      expect(await gasSaver.activeSubContractAmount()).to.equal(0);
    });
  });

  describe("Transfer", () => {
    it("Should contract have 1 ETH", async () => {
      const { gasSaver, owner } = await loadFixture(deployGasSaverFixture);

      await owner.sendTransaction({
        to: gasSaver.address,
        value: ethers.utils.parseEther("1"),
      });

      const balance = await ethers.provider.getBalance(gasSaver.address);

      expect(balance).to.equal(ethers.utils.parseEther("1"));
    });

    it("Should transfer the funds to the owner", async () => {
      const { gasSaver, owner } = await loadFixture(deployGasSaverFixture);

      await owner.sendTransaction({
        to: gasSaver.address,
        value: ethers.utils.parseEther("1"),
      });

      const preBalance = await ethers.provider.getBalance(gasSaver.address);
      await gasSaver.withDraw(0);
      const postBalance = await ethers.provider.getBalance(gasSaver.address);

      expect(preBalance).not.equal(postBalance);
    });
  });
});
