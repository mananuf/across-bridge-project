require('dotenv').config();
const { ethers } = require('ethers');
const { AcrossBridge } = require('./scripts/across-bridge');
const { fetchAndLog } = require('./oracle_impl');

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const USER_WALLET_ADDRESS = process.env.USER_WALLET_ADDRESS;

async function dynamicBridgeExample() {
  if (!PRIVATE_KEY) {
    throw new Error('Please set PRIVATE_KEY environment variable');
  }

  if (!USER_WALLET_ADDRESS) {
    throw new Error('Please set USER_WALLET_ADDRESS environment variable');
  }

  // Initialize bridge (set to true for testnet)
  const bridge = new AcrossBridge(PRIVATE_KEY, true);

  // RPC URLs for testnets - replace with your preferred providers
  const rpcUrls = {
    11155111: process.env.ETHEREUM_SEPOLIA_RPC,
    80001: process.env.POLYGON_RPC,
    84532: process.env.BASE_RPC,
    42161: process.env.ARBITRUM_RPC,
    10: process.env.OPTIMISM_RPC
  };

  await bridge.initializeProviders(rpcUrls);

  try {
    console.log('🔍 Starting dynamic bridge ...');
    
    console.log('\n📋 EXAMPLE 1: Bridge USDC from Base Sepolia to Sepolia');
    
    const usdcBridgeParams = await fetchAndLog();
    console.log("return data", usdcBridgeParams)

    console.log('🧪 Running USDC bridge dry run...');
    const usdcDryRun = await bridge.dryRun(usdcBridgeParams);
    
    if (usdcDryRun.canProceed) {
      console.log('✅ USDC bridge can proceed!');
      console.log(`💰 You need ${ethers.formatUnits(usdcDryRun.fees.gasCost, 18)} ETH for gas`);
      
      const usdcResult = await bridge.executeDynamicBridge(usdcBridgeParams);
      console.log('🎉 USDC Bridge result:', usdcResult);
    } else {
      console.log('❌ USDC bridge cannot proceed:', usdcDryRun.error);
    }


  } catch (error) {
    console.error('💥 Dynamic bridge example failed:', error.message);
    
    bridge.handleBridgeError(error);
  }
}

module.exports = {
  dynamicBridgeExample
};


if (require.main === module) {
  dynamicBridgeExample().catch(console.error);
}