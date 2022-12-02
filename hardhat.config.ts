require("dotenv").config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;
