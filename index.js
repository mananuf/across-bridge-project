// require('dotenv').config();
// const { ethers } = require('ethers');
// const { AcrossBridge, CONFIG } = require('./scripts/across-bridge');

// // async function basicBridge() {
// //   const bridge = new AcrossBridge(process.env.PRIVATE_KEY, true); // true = testnet
  
// //   // Initialize with your RPC URLs
// //   await bridge.initializeProviders({
// //     1: process.env.ETHEREUM_RPC,
// //     137: process.env.POLYGON_RPC
// //   });
  
// //   // Bridge 0.01 WETH from Ethereum to Polygon
// //   const result = await bridge.executeBridge({
// //     inputToken: CONFIG.TOKENS.ETH,
// //     outputToken: CONFIG.TOKENS.ETH,
// //     originChainId: 1,
// //     destinationChainId: 137,
// //     amount: ethers.parseEther('0.01').toString(),
// //     recipient: '0x3e940762B2d3EC049FF075064bED358720a9260B'
// //   });
  
// //   console.log('Bridge result:', result);
// // }

// // basicBridge();

// async function exampleBridge() {
//   // Replace with your private key (use environment variables in production!)
//   const PRIVATE_KEY = process.env.PRIVATE_KEY;
//   if (!PRIVATE_KEY) {
//     throw new Error('Please set PRIVATE_KEY environment variable');
//   }

//   // Initialize bridge (set to true for testnet)
//   const bridge = new AcrossBridge(PRIVATE_KEY, true);

//   // RPC URLs - replace with your preferred providers
//   const rpcUrls = {
//     1: process.env.ETHEREUM_RPC,
//     137: process.env.POLYGON_RPC
//   };

//   await bridge.initializeProviders(rpcUrls);

//   try {
//     // Example 1: Bridge WETH from Ethereum to Polygon
//     console.log('🔍 Validating WETH bridge from Ethereum to Polygon...');
//     const wethTokens = await bridge.validateTokenSupport('WETH', 1, 137);
    
//     const wethBridgeParams = {
//       inputToken: wethTokens.inputToken,
//       outputToken: wethTokens.outputToken,
//       originChainId: CONFIG.CHAINS.ETHEREUM,
//       destinationChainId: CONFIG.CHAINS.POLYGON,
//       amount: ethers.parseEther('0.01').toString(), // 0.01 WETH
//       recipient: '0x3e940762B2d3EC049FF075064bED358720a9260B' // Replace with actual address
//     };

//     console.log('✅ WETH bridge validation successful');
//     console.log('Input token (Ethereum):', wethTokens.inputToken);
//     console.log('Output token (Polygon):', wethTokens.outputToken);

//     // Example 2: Bridge USDC from Ethereum to Arbitrum  
//     console.log('\n🔍 Validating USDC bridge from Ethereum to Arbitrum...');
//     const usdcTokens = await bridge.validateTokenSupport('USDC', 1, 42161);
    
//     const usdcBridgeParams = {
//       inputToken: usdcTokens.inputToken,
//       outputToken: usdcTokens.outputToken,
//       originChainId: CONFIG.CHAINS.ETHEREUM,
//       destinationChainId: CONFIG.CHAINS.ARBITRUM,
//       amount: (10 * 1e6).toString(), // 10 USDC (6 decimals)
//       recipient: '0x3e940762B2d3EC049FF075064bED358720a9260B' // Replace with actual address
//     };

//     console.log('✅ USDC bridge validation successful');
//     console.log('Input token (Ethereum):', usdcTokens.inputToken);
//     console.log('Output token (Arbitrum):', usdcTokens.outputToken);

//     // Check available routes
//     const routes = await bridge.getAvailableRoutes(
//       wethBridgeParams.originChainId,
//       wethBridgeParams.destinationChainId,
//       wethBridgeParams.inputToken,
//       wethBridgeParams.outputToken
//     );
//     console.log('\n🛣️ Available routes:', routes);

//     // Check bridge limits
//     const limits = await bridge.getBridgeLimits(
//       wethBridgeParams.inputToken,
//       wethBridgeParams.outputToken,
//       wethBridgeParams.originChainId,
//       wethBridgeParams.destinationChainId
//     );
//     console.log('📏 Bridge limits:', limits);

//     // Uncomment below to execute actual bridge (make sure you have tokens!)
//     /*
//     console.log('\n🌉 Executing WETH bridge...');
//     const result = await bridge.executeBridge(wethBridgeParams);
//     console.log('🎉 Bridge initiated:', result);

//     // Monitor status if deposit ID is available
//     if (result.depositId) {
//       await bridge.monitorBridge(result.originChainId, result.depositId);
//     }
//     */

//   } catch (error) {
//     console.error('💥 Bridge validation/execution failed:', error.message);
    
//     // Provide helpful error messages
//     if (error.message.includes('Unsupported token address')) {
//       console.log('\n💡 Common solutions:');
//       console.log('1. Use correct token addresses for each chain');
//       console.log('2. Ensure token is supported on both origin and destination chains');
//       console.log('3. Check the supported tokens list: https://docs.across.to/user-docs/how-across-works/supported-chains-and-tokens');
//     }
//   }
// }

// exampleBridge()


require('dotenv').config();
const { ethers } = require('ethers');
const { AcrossBridge, CONFIG } = require('./scripts/across-bridge');

async function exampleBridge() {

  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    throw new Error('Please set PRIVATE_KEY environment variable');
  }

  // Initialize bridge (set to true for testnet)
  const bridge = new AcrossBridge(PRIVATE_KEY, true);

  // RPC URLs for testnets - replace with your preferred providers
  const rpcUrls = {
    11155111: process.env.ETHEREUM_SEPOLIA_RPC,
    80001: process.env.POLYGON_RPC,
    84532: process.env.BASE_RPC
  };

  await bridge.initializeProviders(rpcUrls);

  try {
    console.log('🔍 Checking available testnet chains...');
    
    // Example 1: Bridge WETH on Sepolia testnet
    console.log('🔍 Validating WETH bridge on Sepolia testnet...');
    
    // Check if testnet routes are available
    const testnetChainId = 11155111; // Sepolia
    const destinationTestnetChainId = 84532; // base
    
    try {
      const wethTokens = await bridge.validateTokenSupport('WETH', testnetChainId, destinationTestnetChainId);
      const sepoliaWETH = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14';
      const baseSepoliaWETH = '0x4200000000000000000000000000000000000006'; 

      const wethBridgeParams = {
        inputToken: sepoliaWETH,
        outputToken: baseSepoliaWETH,
        originChainId: testnetChainId,
        destinationChainId: destinationTestnetChainId,
        amount: ethers.parseEther('0.0001').toString(),
        recipient: '0x3e940762B2d3EC049FF075064bED358720a9260B'
      };

      console.log('✅ WETH bridge validation successful');
      console.log('Input token (Sepolia):', wethTokens.inputToken);
      console.log('Output token (Destination):', wethTokens.outputToken);

      // Check available routes
      const routes = await bridge.getAvailableRoutes(
        wethBridgeParams.originChainId,
        wethBridgeParams.destinationChainId,
        wethBridgeParams.inputToken,
        wethBridgeParams.outputToken
      );

      if (routes.length === 0) {
        throw new Error('❌ No routes found for the specified token addresses');
      }
      
      console.log('✅ Route verified - found', routes.length, 'available route(s)');
  
      try {
        const limits = await bridge.getBridgeLimits(
          wethBridgeParams.inputToken,
          wethBridgeParams.outputToken,
          wethBridgeParams.originChainId,
          wethBridgeParams.destinationChainId
        );
        console.log('📏 Bridge limits:', limits);
      } catch (limitsError) {
        console.log('⚠️ Could not fetch bridge limits:', limitsError.message);
      }
  

      try {
        console.log('\n🌉 Executing WETH bridge from Sepolia to Base Sepolia...');
        const result = await bridge.executeBridge(wethBridgeParams);
        console.log('🎉 Bridge initiated:', result);
      } catch(bridgeError) {
        console.log('⚠️ Could not bridge:', bridgeError.message);
      }

      if (result.depositId) {
        console.log('📊 Monitoring bridge status...');
        await bridge.monitorBridge(result.originChainId, result.depositId);
      }


    } catch (routeError) {
      console.log('❌ WETH route not available on testnet:', routeError.message);
      
      // Try alternative approach - check what tokens are actually supported
      console.log('\n🔍 Let\'s check what tokens are supported on testnet...');
    }

    // Alternative: Try with testnet-specific token addresses
    console.log('\n🔍 Trying with testnet-specific configurations...');
    
    // Note: You'll need to get the actual testnet token addresses from your bridge documentation
    // These are just examples - replace with actual testnet addresses
    const testnetTokens = {
      // Replace these with actual testnet token addresses from your bridge
      sepoliaWETH: '0xA0fa3A2f6030265545C3eF4B14e9e69466D58F57', // Sepolia WETH address
      sepoliaUSDC: '0xA0fa3A2f6030265545C3eF4B14e9e69466D58F57', // Sepolia USDC address
    };

    // console.log('💡 Testnet troubleshooting tips:');
    // console.log('1. Verify testnet chain IDs are correct');
    // console.log('2. Check if your bridge supports the specific testnet routes');
    // console.log('3. Ensure you have testnet tokens in your wallet');
    // console.log('4. Verify testnet token addresses are correct');
    // console.log('5. Some bridges may have limited testnet support');

  } catch (error) {
    console.error('💥 Bridge validation/execution failed:', error.message);
    
    // Provide helpful error messages for testnet issues
    if (error.message.includes('Unsupported token address') || 
        error.message.includes('No routes available')) {
      console.log('\n💡 Testnet-specific solutions:');
      console.log('1. Use testnet chain IDs (e.g., Sepolia: 11155111, not 1)');
      console.log('2. Use testnet token addresses, not mainnet addresses');
      console.log('3. Check if your bridge supports testnet routes');
      console.log('4. Verify you have testnet ETH/tokens for gas and bridging');
      console.log('5. Some bridges may not support all testnet combinations');
      console.log('6. Check the bridge documentation for supported testnet routes');
    }
  }
}

async function checkTestnetSupport() {
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    throw new Error('Please set PRIVATE_KEY environment variable');
  }

  const bridge = new AcrossBridge(PRIVATE_KEY, true);

  // Initialize with Sepolia
  const rpcUrls = {
    11155111: process.env.SEPOLIA_RPC, // Sepolia
  };

  await bridge.initializeProviders(rpcUrls);

  console.log('🔍 Checking testnet support...');
  
  try {
    // Check if there are methods to list supported chains/tokens
    if (typeof bridge.getSupportedChains === 'function') {
      const supportedChains = await bridge.getSupportedChains();
      console.log('Supported chains:', supportedChains);
    }
    
    if (typeof bridge.getSupportedTokens === 'function') {
      const supportedTokens = await bridge.getSupportedTokens();
      console.log('Supported tokens:', supportedTokens);
    }
  } catch (error) {
    console.log('Could not fetch supported chains/tokens:', error.message);
  }
}

exampleBridge()
  .then(() => {
    console.log('\n🔍 Checking testnet support...');
    return checkTestnetSupport();
  })
  .catch(console.error);