import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
dotenv.config()

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;

let nonDevelopmentNetworks = {}

if (PRIVATE_KEY) {
  nonDevelopmentNetworks = {
    mainnet: {
      gasPrice: 54000000000, // 54 gwei
      url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`${PRIVATE_KEY}`],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
      // gasPrice: 130000000000, // 13o gwei
    },
    testnetbsc: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      accounts: [`${PRIVATE_KEY}`],
    },
    mainnetbsc: {
      url: `https://bsc-dataseed.binance.org/`,
      accounts: [`${PRIVATE_KEY}`],
    },
    mainnetavax: {
      url: `https://api.avax.network/ext/bc/C/rpc`,
      accounts: [`${PRIVATE_KEY}`],
    },
    testnetavax: {
      url: `https://api.avax-test.network/ext/bc/C/rpc`,
      accounts: [`${PRIVATE_KEY}`],
    },
    mainnetfantom: {
      url: `https://rpc.ftm.tools/`,
      accounts: [`${PRIVATE_KEY}`],
    },
    testnetfantom: {
      url: `https://rpc.testnet.fantom.network/`,
      accounts: [`${PRIVATE_KEY}`],
    },
    mainnetpolygon: {
      url: `https://polygon-rpc.com/`,
      accounts: [`${PRIVATE_KEY}`],
    },
    testnetpolygon: {
      url: `https://rpc-mumbai.maticvigil.com`,
      accounts: [`${PRIVATE_KEY}`],
    },
  };
}

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
  gasReporter: {
    currency: "USD",
    enabled: false,
    gasPrice: 50,
  },
  networks: {
    ...nonDevelopmentNetworks,
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    coverage: {
      url: "http://localhost:8555",
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
};

export default config;
