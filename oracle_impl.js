// require("dotenv").config();
// const { ethers } = require("ethers");
import { ethers } from "ethers";
import dotenv from 'dotenv';

dotenv.config();


const abi = [
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
];

// Chainlink ETH/USD Feed addresses (replace with correct if needed)
const feeds = {
  sepolia: {
    rpc: process.env.SEPOLIA_RPC,
    address: "0x694AA1769357215DE4FAC081bf1f309aDC325306", // ETH/USD Sepolia
  },
  base: {
    rpc: process.env.BASE_RPC,
    address: "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1", // ETH/USD Base
  },
  optimism: {
    rpc: process.env.OPTIMISM_RPC,
    address: "0x61Ec26aA57019C486B10502285c5A3D4A4750AD7" //ETH/USD Optimism
  },
  arbitrum: {
    rpc: process.env.ARBITRUM_RPC,
    address: "0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165", // ETH/USD Arbitrum
  },
  
};

const config = {
    sepolia: 11155111,
    arbitrum: 42161,
    optimism: 10
}

async function fetchPrice(name,  rpc, address ) {
  const provider = new ethers.JsonRpcProvider(rpc);


  const contract = new ethers.Contract(address, abi, provider);
  const [, price] = await contract.latestRoundData();
  return {
    name,
    price: Number(price) / 1e8, // Adjust for 8 decimals
  };
}

const entries = await Promise.all(
  Object.entries(feeds).map(async ([chain, { rpc, address }]) => {
    const price = await fetchPrice(chain, rpc, address);
    return [chain, price];
  })
);

const priceMap = Object.fromEntries(entries);

const chainToBuyLow = Object.values(priceMap).reduce((min, current) =>
  current.price < min.price ? current : min
);

export async function fetchAndLog() {
    const entries = await Promise.all(
    Object.entries(feeds).map(async ([chain, { rpc, address }]) => {
      const price = await fetchPrice(chain, rpc, address);
      return [chain, price];
    })
  );

  const priceMap = Object.fromEntries(entries);

  const chainToBuyLow = Object.values(priceMap).reduce((min, current) =>
    current.price > min.price ? current : min
  );

  console.log("All chains and token prices: ", priceMap)

  console.log("Sell highest here: ", chainToBuyLow)

  for (const key in config) {
    console.log(key)
    if (key == chainToBuyLow.name) {
        let data = {
            tokenSymbol: 'USDC',
            originChainId: 84532, // Base Sepolia
            destinationChainId: config[key], // Sepolia
            amount: (8 * 1e6).toString(), // 10 USDC (6 decimals)
            recipient: '0xb725e575b82b57c73f81E51808Af1b2e8c4387bB' 
        }
        // console.log("The bridge details: ", data)
        return data
    }
  }
}

console.log(await fetchAndLog())

// Fetching token prices from uniswap dexes on respective chains



