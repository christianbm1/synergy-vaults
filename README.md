# Synergy Vault Contracts

1. Create a .env file with:
    - bsc4 (private key of deployer)
    - testKey (private key of signer)
    - COINMARKETCAP (key to get gas prices)

2. Run a node with the following command: "npx hardhat node --no-deploy"
    - This will run a fork off of the bsc chain, using ankr

3. Run tests:
    - npx hardhat --network localhost test ./test/magic.js
    - npx hardhat --network localhost test ./test/burning.js

