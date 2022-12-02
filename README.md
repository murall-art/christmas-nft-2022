# Christmas Card NFT

Christmas Card NFT ERC1155 contracts and deployment scripts.

Note you need A `.env` file in the root to deploy; setup the file as follows:

```
PRIVATE_KEY = **YOUR PRIVATE KEY HERE**
INFURA_PROJECT_ID = **YOUR INFURA ID HERE**
ETHERSCAN_KEY = **YOUR ETHERSCAN KEY HERE**
```

## Run tests

```shell
npx hardhat test
```

## Deploy test ERC20 contract (replace goerli with network of your choice from hardhat config)
```shell
npx hardhat run --network goerli scripts/deploy_test_custom_token.ts
```

## Deploy NFT contract (replace goerli with network of your choice from hardhat config)
```shell
npx hardhat run --network goerli scripts/deploy_christmas_cards.ts
```

## Verify deployed contract (replace goerli with network of your choice, and edit `--constructor-args` if needed)
```shell
npx hardhat verify --constructor-args argsForVerification/args_christmasNft.js --network goerli 0x8A3009ad2148DDc9d5124285092bEdCA7F5638CE
```
