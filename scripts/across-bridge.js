const { ethers } = require('ethers');
const axios = require('axios');

const CONFIG = {
  MAINNET_API: 'https://across.to/api',
  TESTNET_API: 'https://testnet.across.to/api',
  
  // Chain IDs
  CHAINS: {
    ETHEREUM: 1,
    SEPOLIA: 11155111,
    POLYGON: 137,
    ARBITRUM: 42161,
    OPTIMISM: 10,
    BASE: 8453,
    BASE_SEPOLIA: 84532
  },
  
  // Supported token addresses (mainnet + testnet)
  TOKENS: {
    // WETH addresses
    WETH: {
      ETHEREUM: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      SEPOLIA: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',  // WETH on Sepolia
      BASE_SEPOLIA: '0x4200000000000000000000000000000000000006'  // WETH on Base Sepolia
    },
    
    // USDC addresses by chain
    USDC: {
      ETHEREUM: '0xA0b86a33E6441986C3c6e4D8f9B0d5e3e2b5C9B4',    // USDC
      SEPOLIA: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',     // USDC on Sepolia
      BASE_SEPOLIA: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',  // USDC on Base Sepolia
      POLYGON: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',     // USDC
      ARBITRUM: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',    // USDC.e
      OPTIMISM: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',    // USDC
      BASE: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',       // USDbC
      LINEA: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',      // USDC.e
      SCROLL: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',     // USDC.e
      ZKSYNC: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',     // USDC.e
      WORLD: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1'       // USDC.e
    },
    
    // USDT addresses by chain
    USDT: {
      ETHEREUM: '0xdAC17F958D2ee523a2206206994597C13D831ec7',    // USDT
      SEPOLIA: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',     // USDT on Sepolia
      POLYGON: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',     // USDT
      ARBITRUM: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',    // USDT
      OPTIMISM: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',    // USDT
      LINEA: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',      // USDT
      SCROLL: '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df',     // USDT
      ZKSYNC: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',     // USDT
      MODE: '0xf0F161fDA2712DB8b566946122a5af183995e2eD',       // USDT
      LISK: '0x05D032ac25d322df992303dCa074EE7392C117b9'       // USDT
    },
    
    // WBTC addresses by chain
    WBTC: {
      ETHEREUM: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',    // WBTC
      SEPOLIA: '0x29f2D40B0605204364af54EC677bD022dA425d03',     // WBTC on Sepolia
      POLYGON: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',     // WBTC
      ARBITRUM: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',    // WBTC
      OPTIMISM: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',    // WBTC
      LINEA: '0x3aAB2285ddcDdaD8edf438C1bAB47e1a9D05a9b4',      // WBTC
      SCROLL: '0x3C1BCa5a656e69edCD0D4E36BEbb3FcDAcA60Cf1',     // WBTC
      ZKSYNC: '0xBBeB516fb02a01611cBBE0453Fe3c580D7281011',     // WBTC
      WORLD: '0x03C7054BCB39f7b2e5B2c7AcB37583e32D70Cfa3',      // WBTC
      MODE: '0xcDd475325D6F564d27247D1DddBb0DAc6fA0a5CF',       // WBTC
      LISK: '0x03C7054BCB39f7b2e5B2c7AcB37583e32D70Cfa3'       // WBTC
    },
    
    // DAI addresses by chain
    DAI: {
      ETHEREUM: '0x6B175474E89094C44Da98b954EedeAC495271d0F',    // DAI
      SEPOLIA: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',     // DAI on Sepolia
      POLYGON: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',     // DAI   
      ARBITRUM: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',    // DAI
      OPTIMISM: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',    // DAI
      BASE: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',       // DAI
      LINEA: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',      // DAI
      ZKSYNC: '0x4B9eb6c0b6ea15176BBF62841C6B2A8a398cb656'     // DAI
    }
  },
  
  // Across SpokePool contract addresses
  SPOKE_POOLS: {
    1: '0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5',          // Ethereum
    11155111: '0x5ef6C01E11889d86803e0B23e3cB3F9E9d97B662',    // Sepolia
    84532: '0x82B564983aE7274c86695917BBf8C99ECb6F0F8F',       // Base Sepolia
    137: '0x9295ee1d8C5b022Be115A2AD3c30C72E34e7F096',        // Polygon
    42161: '0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A',       // Arbitrum
    10: '0x6f26Bf09B1C792e3228e5467807a900A503c0281',         // Optimism
    8453: '0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64'        // Base
  }
};

class AcrossBridge {
  constructor(privateKey, useTestnet = false) {
    this.privateKey = privateKey;
    this.useTestnet = useTestnet;
    this.apiUrl = useTestnet ? CONFIG.TESTNET_API : CONFIG.MAINNET_API;
    this.providers = {};
    this.wallets = {};
  }

  getTokenAddress(tokenSymbol, chainId) {
    const token = CONFIG.TOKENS[tokenSymbol.toUpperCase()];
    
    if (!token) {
      throw new Error(`Unsupported token: ${tokenSymbol}`);
    }
    
    // For WETH, same address on all chains
    if (tokenSymbol.toUpperCase() === 'WETH') {
      return CONFIG.TOKENS.WETH;
    }
    
    // For other tokens, get chain-specific address
    if (typeof token === 'object') {
      const chainName = this.getChainName(chainId);
      const address = token[chainName];
      
      if (!address) {
        throw new Error(`Token ${tokenSymbol} not supported on chain ${chainId} (${chainName})`);
      }
      
      return address;
    }
    
    return token;
  }

  getChainName(chainId) {
    const chainNames = {
      1: 'ETHEREUM',
      137: 'POLYGON', 
      42161: 'ARBITRUM',
      10: 'OPTIMISM',
      8453: 'BASE',
      59144: 'LINEA',
      534352: 'SCROLL',
      324: 'ZKSYNC',
      480: 'WORLD',
      34443: 'MODE',
      1135: 'LISK'
    };
    
    return chainNames[chainId];
  }

  async validateTokenSupport(tokenSymbol, originChainId, destinationChainId) {
    try {
      const inputToken = this.getTokenAddress(tokenSymbol, originChainId);
      const outputToken = this.getTokenAddress(tokenSymbol, destinationChainId);
      
      // Additional validation via API
      const routes = await this.getAvailableRoutes(
        originChainId,
        destinationChainId,
        inputToken,
        outputToken
      );
      
      if (!routes || routes.length === 0) {
        throw new Error(`No routes available for ${tokenSymbol} from chain ${originChainId} to ${destinationChainId}`);
      }
      
      return { inputToken, outputToken };
    } catch (error) {
      console.error('❌ Token validation failed:', error.message);
      throw error;
    }
  }

  async initializeProviders(rpcUrls) {
    for (const [chainId, rpcUrl] of Object.entries(rpcUrls)) {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(this.privateKey, provider);
      
      this.providers[chainId] = provider;
      this.wallets[chainId] = wallet;
    }
    console.log('✅ Providers initialized for chains:', Object.keys(rpcUrls));
  }

  async getAvailableRoutes(originChainId, destinationChainId, inputToken, outputToken) {
    try {
      const response = await axios.get(`${this.apiUrl}/available-routes`, {
        params: {
          originChainId,
          destinationChainId,
          inputToken,
          outputToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching routes:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get bridge limits for a specific token pair
   */
  async getBridgeLimits(inputToken, outputToken, originChainId, destinationChainId) {
    try {
      const response = await axios.get(`${this.apiUrl}/limits`, {
        params: {
          inputToken,
          outputToken,
          originChainId,
          destinationChainId
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching limits:', error.response?.data || error.message);
      throw error;
    }
  }

  async getSuggestedFees(params) {
    const {
      inputToken,
      outputToken,
      originChainId,
      destinationChainId,
      amount,
      recipient,
      message,
      timestamp // Accept timestamp parameter
    } = params;
  
    const url = new URL(`${this.apiUrl}/suggested-fees`);
    
    console.log("🔍 Getting suggested fees..");

    // Add all required parameters
    url.searchParams.append('inputToken', inputToken);
    url.searchParams.append('outputToken', outputToken);
    url.searchParams.append('originChainId', originChainId.toString());
    url.searchParams.append('destinationChainId', destinationChainId.toString());
    url.searchParams.append('amount', amount.toString());
    url.searchParams.append('recipient', recipient);
    
    // Add timestamp parameter if provided
    if (timestamp) {
      url.searchParams.append('timestamp', timestamp.toString());
    }
    
    // Add optional parameters
    if (message) {
      url.searchParams.append('message', message);
    }
  
    console.log('🔍 Fee query URL:', url.toString());
  
    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`API Error: ${response.status} - ${errorData?.message || response.statusText}`);
      }
  
      const data = await response.json();

      console.log("✅ succesfully retrieved suggested fees");
      console.log("SUGGESTED FEES DATA:", data);

      return data;
    } catch (error) {
      console.error('❌ Error fetching suggested fees:', error);
      throw error;
    }
  }

  async getDepositStatus(originChainId, depositId) {
    try {
      const response = await axios.get(`${this.apiUrl}/deposit/status`, {
        params: {
          originChainId,
          depositId
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching deposit status:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Approve token spending if needed
   */
  async approveToken(tokenAddress, spenderAddress, amount, chainId) {
    const wallet = this.wallets[chainId];
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function allowance(address owner, address spender) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)'
      ],
      wallet
    );

    const currentAllowance = await tokenContract.allowance(wallet.address, spenderAddress);
    
    if (currentAllowance < BigInt(amount)) {
      console.log('💰 Approving token spending...');
      const approveTx = await tokenContract.approve(spenderAddress, amount);
      await approveTx.wait();
      console.log('✅ Token approval confirmed');
    } else {
      console.log('✅ Token already approved');
    }
  }

  async executeBridge(bridgeParams) {
    const {
      inputToken,
      outputToken,
      originChainId,
      destinationChainId,
      amount,
      recipient,
      message = '0x',
      relayerFeePct,
      quoteTimestamp
    } = bridgeParams;
  
    try {
      // 1. Get current timestamp FIRST (use this consistently)
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const timeStp = (quoteTimestamp || currentTimestamp) -100;

      console.log('🕐 Using timestamp:', timeStp);
  
      // 2. Get suggested fees with consistent timestamp
      console.log('📊 Fetching suggested fees...');
      const feeData = await this.getSuggestedFees({
        inputToken,
        outputToken,
        originChainId,
        destinationChainId,
        amount,
        recipient,
        message: message !== '0x' ? message : undefined,
        timestamp: timeStp
      });
  
      console.log('💰 Suggested fees:', {
        totalRelayFee: feeData.totalRelayFee.total?.toString(),
        lpFee: feeData.lpFee.total?.toString(),
        relayerFeePct: feeData.relayerFeePct
      });
  
      // 3. Approve token if needed
      const spokePoolAddress = CONFIG.SPOKE_POOLS[originChainId];
      if (!spokePoolAddress) {
        throw new Error(`Spoke pool not found for chain ${originChainId}`);
      }
  
      await this.approveToken(inputToken, spokePoolAddress, amount, originChainId);
  
      // 4. Execute deposit with the SAME timestamp used for fees
      console.log('🌉 Executing bridge transaction...');
      const wallet = this.wallets[originChainId];
      const spokePool = new ethers.Contract(
        spokePoolAddress,
        [
          `function depositV3(
            address depositor,
            address recipient,
            address inputToken,
            address outputToken,
            uint256 inputAmount,
            uint256 outputAmount,
            uint256 destinationChainId,
            address exclusiveRelayer,
            uint32 quoteTimestamp,
            uint32 fillDeadline,
            uint32 exclusivityDeadline,
            bytes calldata message
          ) payable`
        ],
        wallet
      );
  
      // Use current timestamp + buffer for deadlines (these can be in the future)
      const txTimestamp = Math.floor(Date.now() / 1000);
      const fillDeadline = txTimestamp + 21600; // 6 hours from now
      const exclusivityDeadline = txTimestamp + 300; // 5 minutes from now
  
      const outputAmount = BigInt(amount) - BigInt(feeData.lpFee.total || 0) - BigInt(feeData.totalRelayFee.total || 0);
  
      console.log('📋 Deposit parameters:', {
        depositor: wallet.address,
        recipient,
        inputToken,
        outputToken,
        inputAmount: amount,
        outputAmount: outputAmount.toString(),
        destinationChainId,
        quoteTimestamp: timeStp, // Use the SAME timestamp
        fillDeadline,
        exclusivityDeadline
      });
  
      const depositTx = await spokePool.depositV3(
        wallet.address,
        recipient,
        inputToken,
        outputToken,
        amount,
        outputAmount.toString(),
        destinationChainId,
        ethers.ZeroAddress, // No exclusive relayer
        timeStp, // Use the SAME timestamp as fee query
        fillDeadline,
        exclusivityDeadline,
        message || '0x'
      );
  
      console.log('📝 Transaction hash:', depositTx.hash);
      
      const receipt = await depositTx.wait();
      console.log('✅ Bridge transaction confirmed!');
      
      // Extract deposit ID from events
      const depositEvent = receipt.logs.find(log => {
        try {
          return spokePool.interface.parseLog(log)?.name === 'V3FundsDeposited';
        } catch {
          return false;
        }
      });
  
      if (depositEvent) {
        const parsedEvent = spokePool.interface.parseLog(depositEvent);
        const depositId = parsedEvent.args.depositId;
        console.log('🆔 Deposit ID:', depositId.toString());
        
        return {
          txHash: depositTx.hash,
          depositId: depositId.toString(),
          originChainId,
          destinationChainId
        };
      }
  
      return {
        txHash: depositTx.hash,
        originChainId,
        destinationChainId
      };
  
    } catch (error) {
      console.error('❌ Bridge execution failed:', error);
      
      // Add specific error handling for timestamp issues
      if (error.message && error.message.includes('timestamp')) {
        console.error('🕐 Timestamp error - this might be due to:');
        console.error('1. System clock being out of sync');
        console.error('2. Network latency causing timestamp drift');
        console.error('3. API server time being different from local time');
        console.error('💡 Try reducing the timestamp by a few seconds or use a timestamp from a recent API call');
      }
      
      throw error;
    }
  }

  async monitorBridge(originChainId, depositId, maxWaitTime = 600000) { // 10 minutes default
    console.log('👀 Monitoring bridge status...');
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.getDepositStatus(originChainId, depositId);
        console.log('📊 Current status:', status.status);
        
        if (status.status === 'filled') {
          console.log('✅ Bridge completed successfully!');
          console.log('🔗 Fill transaction:', status.fillTxHash);
          return status;
        } else if (status.status === 'pending') {
          console.log('⏳ Bridge still pending...');
        }
        
        // Wait 10 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error) {
        console.log('⏳ Status not available yet, continuing to monitor...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    console.log('⏰ Monitoring timeout reached');
    return null;
  }
}

async function exampleBridge() {
  // Replace with your private key (use environment variables in production!)
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    throw new Error('Please set PRIVATE_KEY environment variable');
  }

  // Initialize bridge (set to true for testnet)
  const bridge = new AcrossBridge(PRIVATE_KEY, true);

  // RPC URLs - replace with your preferred providers
  const rpcUrls = {
    1: process.env.ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/your-key',
    137: process.env.POLYGON_RPC || 'https://polygon-mainnet.g.alchemy.com/v2/your-key'
  };

  await bridge.initializeProviders(rpcUrls);

  try {
    // Example 1: Bridge WETH from Ethereum to Polygon
    console.log('🔍 Validating WETH bridge from Ethereum to Polygon...');
    const wethTokens = await bridge.validateTokenSupport('WETH', 1, 137);
    
    const wethBridgeParams = {
      inputToken: wethTokens.inputToken,
      outputToken: wethTokens.outputToken,
      originChainId: CONFIG.CHAINS.ETHEREUM,
      destinationChainId: CONFIG.CHAINS.POLYGON,
      amount: ethers.parseEther('0.01').toString(), // 0.01 WETH
      recipient: '0xYourRecipientAddress' // Replace with actual address
    };

    console.log('✅ WETH bridge validation successful');
    console.log('Input token (Ethereum):', wethTokens.inputToken);
    console.log('Output token (Polygon):', wethTokens.outputToken);

    // Example 2: Bridge USDC from Ethereum to Arbitrum  
    console.log('\n🔍 Validating USDC bridge from Ethereum to Arbitrum...');
    const usdcTokens = await bridge.validateTokenSupport('USDC', 1, 42161);
    
    const usdcBridgeParams = {
      inputToken: usdcTokens.inputToken,
      outputToken: usdcTokens.outputToken,
      originChainId: CONFIG.CHAINS.ETHEREUM,
      destinationChainId: CONFIG.CHAINS.ARBITRUM,
      amount: (10 * 1e6).toString(), // 10 USDC (6 decimals)
      recipient: '0xYourRecipientAddress' // Replace with actual address
    };

    console.log('✅ USDC bridge validation successful');
    console.log('Input token (Ethereum):', usdcTokens.inputToken);
    console.log('Output token (Arbitrum):', usdcTokens.outputToken);

    // Check available routes
    const routes = await bridge.getAvailableRoutes(
      wethBridgeParams.originChainId,
      wethBridgeParams.destinationChainId,
      wethBridgeParams.inputToken,
      wethBridgeParams.outputToken
    );
    console.log('\n🛣️ Available routes:', routes);

    // Check bridge limits
    const limits = await bridge.getBridgeLimits(
      wethBridgeParams.inputToken,
      wethBridgeParams.outputToken,
      wethBridgeParams.originChainId,
      wethBridgeParams.destinationChainId
    );
    console.log('📏 Bridge limits:', limits);

    // Uncomment below to execute actual bridge (make sure you have tokens!)
    /*
    console.log('\n🌉 Executing WETH bridge...');
    const result = await bridge.executeBridge(wethBridgeParams);
    console.log('🎉 Bridge initiated:', result);

    // Monitor status if deposit ID is available
    if (result.depositId) {
      await bridge.monitorBridge(result.originChainId, result.depositId);
    }
    */

  } catch (error) {
    console.error('💥 Bridge validation/execution failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('Unsupported token address')) {
      console.log('\n💡 Common solutions:');
      console.log('1. Use correct token addresses for each chain');
      console.log('2. Ensure token is supported on both origin and destination chains');
      console.log('3. Check the supported tokens list: https://docs.across.to/user-docs/how-across-works/supported-chains-and-tokens');
    }
  }
}

// Export for use as module
module.exports = { AcrossBridge, CONFIG };

// Run example if script is executed directly
if (require.main === module) {
  exampleBridge().catch(console.error);
}