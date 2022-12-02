const prompt = require("prompt-sync")();
import { ethers } from "hardhat";

const FUNDING_TOKENS_MAINNET = [
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", //USDC
  "0x6B175474E89094C44Da98b954EedeAC495271d0F", //DAI
  "0xdAC17F958D2ee523a2206206994597C13D831ec7", //USDT
];

const FUNDING_TOKENS_TESTNET = [
  "0x8609E640735e44811737216713376F078Cd98310", // test USDC
];

async function main() {
  const uri = "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/{id}";
  // get network and if goerli, use testnet tokens
  const network = await ethers.provider.getNetwork();

  const isMainnet = network.name === "mainnet";
  const fundingTokens = isMainnet
    ? FUNDING_TOKENS_MAINNET
    : FUNDING_TOKENS_TESTNET;
  const admins = [
    "0xCF90AD693aCe601b5B5582C4F95eC7266CDB3eEC", //MurAll
    "0xdd923fF5961796b3005eE0d964d154AD08BD3695", //LaunchPool
  ];
  const donationAddress = "0x448BC77754c4c2Bc35c2d69D3bA91Ee9705d784b";
  const dollarFundingAmount = 1;

  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying Christmas Card NFT contract using the account:",
    await deployer.getAddress()
  );
  console.log("URI:", uri);
  console.log("Funding Tokens:", fundingTokens);
  console.log("Admins:", admins);
  console.log("Donation Address:", donationAddress);
  console.log("Dollar Funding Amount (USD):", dollarFundingAmount);

  const entry = prompt("\nIf happy, hit enter...\n");

  // check if entry is the enter key
  if (entry !== "") {
    console.log("Exiting...");
    return;
  }

  const ChristmasCardErc1155 = await ethers.getContractFactory(
    "ChristmasCardErc1155"
  );
  console.log("Deploying ChristmasCardErc1155...");

  const contract = await ChristmasCardErc1155.deploy(
    uri,
    fundingTokens,
    admins,
    donationAddress,
    dollarFundingAmount
  );

  await contract.deployed();

  console.log(`ChristmasCardErc1155 deployed to ${contract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
