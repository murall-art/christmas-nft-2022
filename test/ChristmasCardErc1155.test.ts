import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  ChristmasCardErc1155,
  ERC20,
  MockCustomDecimalERC20,
} from "../typechain-types";

const CONTRACT_URI =
  " ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/{id}";

interface Fixture {
  contract: ChristmasCardErc1155;
  fundingTokens: string[];
  admin: SignerWithAddress;
  donationAddress: string;
  dollarFundingAmount: number;
  owner: SignerWithAddress;
  otherAccount: SignerWithAddress;
  usdc: MockCustomDecimalERC20;
  dai: MockCustomDecimalERC20;
  usdt: MockCustomDecimalERC20;
}
describe("ChristmasCardErc1155", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [admin, donationAddress, otherAccount] = await ethers.getSigners();

    const ChristmasCardErc1155 = await ethers.getContractFactory(
      "ChristmasCardErc1155"
    );

    const MockCustomDecimalERC20 = await ethers.getContractFactory(
      "MockCustomDecimalERC20"
    );

    const usdc = await MockCustomDecimalERC20.deploy(
      "USDC", // name
      "USDC", // symbol
      1000000, // total supply
      6 // decimals
    );
    await usdc.deployed();

    const dai = await MockCustomDecimalERC20.deploy(
      "DAI", // name
      "DAI", // symbol
      1000000, // total supply
      18 // decimals
    );
    await dai.deployed();

    const usdt = await MockCustomDecimalERC20.deploy(
      "USDT", // name
      "USDT", // symbol
      1000000, // total supply
      6 // decimals
    );
    await usdt.deployed();

    const fundingTokens = [usdc.address, dai.address, usdt.address];
    const dollarFundingAmount = 123;
    const contract = await ChristmasCardErc1155.deploy(
      CONTRACT_URI,
      fundingTokens,
      [admin.address],
      donationAddress.address,
      dollarFundingAmount
    );
    await contract.deployed();

    return {
      contract,
      fundingTokens,
      admin,
      donationAddress: donationAddress.address,
      dollarFundingAmount,
      owner: admin,
      otherAccount,
      usdc,
      dai,
      usdt,
    };
  }

  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await loadFixture(deployFixture);
  });

  describe("Deployment", function () {
    it("Should set the funding tokens", async function () {
      for (let i = 0; i < fixture.fundingTokens.length; i++) {
        expect(await fixture.contract.fundingTokens(i)).to.equal(
          fixture.fundingTokens[i]
        );
      }
    });

    it("Should set the donation address", async function () {
      expect(await fixture.contract.donationAddress()).to.equal(
        fixture.donationAddress
      );
    });

    it("Should set the donation amount", async function () {
      expect(await fixture.contract.dollarFundingAmount()).to.equal(
        fixture.dollarFundingAmount
      );
    });

    it("Should set the contract URI", async function () {
      expect(await fixture.contract.uri(0)).to.equal(CONTRACT_URI);
    });

    it("Should set the admin", async function () {
      const role = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("ADMIN_ROLE")
      );
      console.log("admin role", role);
      expect(await fixture.contract.hasRole(role, fixture.admin.address)).to.be
        .true;
    });

    it("Should set the minter role", async function () {
      const role = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("MINTER_ROLE")
      );
      console.log("minter role", role);
      expect(await fixture.contract.hasRole(role, fixture.admin.address)).to.be
        .true;
    });
  });

  describe("Minting", function () {
    it("Should mint a card", async function () {
      const tokenId = 0;
      const amount = 1;

      await fixture.contract
        .connect(fixture.owner)
        .mint(fixture.otherAccount.address, tokenId, amount);

      expect(
        await fixture.contract.balanceOf(fixture.otherAccount.address, tokenId)
      ).to.equal(amount);
    });

    it("Should mint multiple cards", async function () {
      const tokenId = 0;
      const amount = 2;

      await fixture.contract
        .connect(fixture.owner)
        .mint(fixture.otherAccount.address, tokenId, amount);

      expect(
        await fixture.contract.balanceOf(fixture.otherAccount.address, tokenId)
      ).to.equal(amount);
    });

    it("Should batch mint multiple cards", async function () {
      const tokenId = 0;
      const amount = 2;

      await fixture.contract
        .connect(fixture.owner)
        .mintBatch(
          fixture.otherAccount.address,
          [tokenId, tokenId + 1],
          [amount, amount]
        );

      expect(
        await fixture.contract.balanceOf(fixture.otherAccount.address, tokenId)
      ).to.equal(amount);
      expect(
        await fixture.contract.balanceOf(
          fixture.otherAccount.address,
          tokenId + 1
        )
      ).to.equal(amount);
    });

    it("Should batch mint multiple cards to multiple addresses", async function () {
      const tokenId = 0;
      const amount = 2;

      await fixture.contract
        .connect(fixture.owner)
        .mintMultiple(
          [fixture.owner.address, fixture.otherAccount.address],
          [tokenId, tokenId + 1],
          [amount, amount]
        );

      expect(
        await fixture.contract.balanceOf(fixture.owner.address, tokenId)
      ).to.equal(amount);
      expect(
        await fixture.contract.balanceOf(
          fixture.otherAccount.address,
          tokenId + 1
        )
      ).to.equal(amount);
    });
  });
  describe("Transfer", function () {
    it("Should transfer a card with donation up to allowance if less than donation amount", async function () {
      const tokenId = 0;
      const amount = 1;
      const usdcDecimals = 6;
      const expectedFundingAmount = ethers.utils.parseUnits(
        fixture.dollarFundingAmount.toString(),
        usdcDecimals
      );
      const allowance = ethers.utils.parseUnits("1", usdcDecimals);
      await fixture.contract
        .connect(fixture.owner)
        .mint(fixture.otherAccount.address, tokenId, amount);

      await fixture.usdc
        .connect(fixture.owner)
        .mint(fixture.otherAccount.address, expectedFundingAmount);

      await fixture.usdc
        .connect(fixture.otherAccount)
        .approve(fixture.contract.address, allowance);

      await fixture.contract
        .connect(fixture.otherAccount)
        .safeTransferFrom(
          fixture.otherAccount.address,
          fixture.owner.address,
          tokenId,
          amount,
          "0x"
        );

      expect(
        await fixture.contract.balanceOf(fixture.owner.address, tokenId)
      ).to.equal(amount);

      expect(await fixture.usdc.balanceOf(fixture.donationAddress)).to.equal(
        allowance
      );
      expect(await fixture.dai.balanceOf(fixture.donationAddress)).to.equal(0);
      expect(await fixture.usdt.balanceOf(fixture.donationAddress)).to.equal(0);
    });
    it("Should transfer a card with donation with correct decimals 6", async function () {
      const tokenId = 0;
      const amount = 1;
      const usdcDecimals = 6;
      const expectedFundingAmount = ethers.utils.parseUnits(
        fixture.dollarFundingAmount.toString(),
        usdcDecimals
      );
      await fixture.contract
        .connect(fixture.owner)
        .mint(fixture.otherAccount.address, tokenId, amount);

      await fixture.usdc
        .connect(fixture.owner)
        .mint(fixture.otherAccount.address, expectedFundingAmount);

      await fixture.usdc
        .connect(fixture.otherAccount)
        .approve(fixture.contract.address, expectedFundingAmount);

      await fixture.contract
        .connect(fixture.otherAccount)
        .safeTransferFrom(
          fixture.otherAccount.address,
          fixture.owner.address,
          tokenId,
          amount,
          "0x"
        );

      expect(
        await fixture.contract.balanceOf(fixture.owner.address, tokenId)
      ).to.equal(amount);

      expect(await fixture.usdc.balanceOf(fixture.donationAddress)).to.equal(
        expectedFundingAmount
      );
      expect(await fixture.dai.balanceOf(fixture.donationAddress)).to.equal(0);
      expect(await fixture.usdt.balanceOf(fixture.donationAddress)).to.equal(0);
    });

    it("Should transfer a card with donation with correct decimals 18", async function () {
      const tokenId = 0;
      const amount = 1;
      const daiDecimals = 18;
      const expectedFundingAmount = ethers.utils.parseUnits(
        fixture.dollarFundingAmount.toString(),
        daiDecimals
      );
      await fixture.contract
        .connect(fixture.owner)
        .mint(fixture.otherAccount.address, tokenId, amount);

      await fixture.dai
        .connect(fixture.owner)
        .mint(fixture.otherAccount.address, expectedFundingAmount);

      await fixture.dai
        .connect(fixture.otherAccount)
        .approve(fixture.contract.address, expectedFundingAmount);

      await fixture.contract
        .connect(fixture.otherAccount)
        .safeTransferFrom(
          fixture.otherAccount.address,
          fixture.owner.address,
          tokenId,
          amount,
          "0x"
        );

      expect(
        await fixture.contract.balanceOf(fixture.owner.address, tokenId)
      ).to.equal(amount);

      expect(await fixture.dai.balanceOf(fixture.donationAddress)).to.equal(
        expectedFundingAmount
      );
      expect(await fixture.usdc.balanceOf(fixture.donationAddress)).to.equal(0);
      expect(await fixture.usdt.balanceOf(fixture.donationAddress)).to.equal(0);
    });

    it("Should transfer multiple cards", async function () {
      const tokenId = 0;
      const amount = 2;
      const usdcDecimals = 6;
      const totalDollarFundingAmount = fixture.dollarFundingAmount * amount;

      const expectedFundingAmount = ethers.utils.parseUnits(
        totalDollarFundingAmount.toString(),
        usdcDecimals
      );

      await fixture.contract
        .connect(fixture.owner)
        .mint(fixture.otherAccount.address, tokenId, amount);

      await fixture.usdc
        .connect(fixture.owner)
        .mint(fixture.otherAccount.address, expectedFundingAmount);

      await fixture.usdc
        .connect(fixture.otherAccount)
        .approve(fixture.contract.address, expectedFundingAmount);

      await fixture.contract
        .connect(fixture.otherAccount)
        .safeTransferFrom(
          fixture.otherAccount.address,
          fixture.owner.address,
          tokenId,
          amount,
          "0x"
        );

      expect(
        await fixture.contract.balanceOf(fixture.owner.address, tokenId)
      ).to.equal(amount);

      expect(await fixture.usdc.balanceOf(fixture.donationAddress)).to.equal(
        expectedFundingAmount
      );
    });

    it("Should transfer multiple cards successfully if donation not approved", async function () {
      const tokenId = 1;
      const amount = 24;
      await fixture.contract
        .connect(fixture.owner)
        .mint(fixture.otherAccount.address, tokenId, amount);

      await fixture.contract
        .connect(fixture.otherAccount)
        .safeTransferFrom(
          fixture.otherAccount.address,
          fixture.owner.address,
          tokenId,
          amount,
          "0x"
        );

      expect(
        await fixture.contract.balanceOf(fixture.owner.address, tokenId)
      ).to.equal(amount);

      expect(await fixture.usdc.balanceOf(fixture.donationAddress)).to.equal(0);
    });
  });
});
