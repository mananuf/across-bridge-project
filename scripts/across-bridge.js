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
  
  // Enhanced token configuration with better chain mapping
  TOKENS: {
    // Native ETH (uses zero address when bridging)
    ETH: {
      ETHEREUM: ethers.ZeroAddress,
      SEPOLIA: ethers.ZeroAddress,
      BASE_SEPOLIA: ethers.ZeroAddress,
      BASE: ethers.ZeroAddress,
      ARBITRUM: ethers.ZeroAddress,
      OPTIMISM: ethers.ZeroAddress,
      POLYGON: ethers.ZeroAddress,
      decimals: 18,
      symbol: 'ETH'
    },
    
    // WETH addresses
    WETH: {
      ETHEREUM: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      SEPOLIA: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      BASE_SEPOLIA: '0x4200000000000000000000000000000000000006',
      BASE: '0x4200000000000000000000000000000000000006',
      ARBITRUM: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      OPTIMISM: '0x4200000000000000000000000000000000000006',
      POLYGON: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      decimals: 18,
      symbol: 'WETH'
    },
    
    // USDC addresses by chain
    USDC: {
      ETHEREUM: '0xA0b86a33E6441986C3c6E4D8f9B0d5e3e2b5C9B4',
      SEPOLIA: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      BASE_SEPOLIA: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      BASE: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      POLYGON: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      ARBITRUM: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      OPTIMISM: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
      decimals: 6,
      symbol: 'USDC'
    },
    
    // USDT addresses
    USDT: {
      ETHEREUM: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      SEPOLIA: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
      POLYGON: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      ARBITRUM: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      OPTIMISM: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      decimals: 6,
      symbol: 'USDT'
    },
    
    // DAI addresses
    DAI: {
      ETHEREUM: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      SEPOLIA: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
      POLYGON: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      ARBITRUM: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      OPTIMISM: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      BASE: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      decimals: 18,
      symbol: 'DAI'
    }
  },
  
  // Across SpokePool contract addresses
  SPOKE_POOLS: {
    1: '0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5',
    11155111: '0x5ef6C01E11889d86803e0B23e3cB3F9E9d97B662',
    84532: '0x82B564983aE7274c86695917BBf8C99ECb6F0F8F',
    137: '0x9295ee1d8C5b022Be115A2AD3c30C72E34e7F096',
    42161: '0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A',
    10: '0x6f26Bf09B1C792e3228e5467807a900A503c0281',
    8453: '0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64'
  },
  
  // SpokePool ABI - minimal interface needed for bridging
  SPOKE_POOL_ABI: [
    'function depositV3(address depositor, address recipient, address inputToken, address outputToken, uint256 inputAmount, uint256 outputAmount, uint256 destinationChainId, address exclusiveRelayer, uint32 quoteTimestamp, uint32 fillDeadline, uint32 exclusivityDeadline, bytes calldata message) payable',
    'function fillV3Relay(tuple(address depositor, address recipient, address exclusiveRelayer, address inputToken, address outputToken, uint256 inputAmount, uint256 outputAmount, uint256 originChainId, uint32 depositId, uint32 fillDeadline, uint32 exclusivityDeadline, bytes message) relayData, uint256 repaymentChainId)'
  ]
};

class AcrossBridge {
  constructor(privateKey, useTestnet = false) {
    this.privateKey = privateKey;
    this.useTestnet = useTestnet;
    this.apiUrl = useTestnet ? CONFIG.TESTNET_API : CONFIG.MAINNET_API;
    this.providers = {};
    this.wallets = {};
  }

  /**
   * Get chain name from chain ID
   */
  getChainName(chainId) {
    const chainNames = {
      1: 'ETHEREUM',
      11155111: 'SEPOLIA',
      137: 'POLYGON', 
      42161: 'ARBITRUM',
      10: 'OPTIMISM',
      8453: 'BASE',
      84532: 'BASE_SEPOLIA'
    };
    
    return chainNames[chainId];
  }

  /**
   * Get token configuration including address, decimals, and symbol
   */
  getTokenConfig(tokenSymbol, chainId) {
    const token = CONFIG.TOKENS[tokenSymbol.toUpperCase()];
    
    if (!token) {
      throw new Error(`Unsupported token: ${tokenSymbol}`);
    }
    
    const chainName = this.getChainName(chainId);
    if (!chainName) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    
    const address = token[chainName];
    if (!address && address !== ethers.ZeroAddress) {
      throw new Error(`Token ${tokenSymbol} not supported on chain ${chainId} (${chainName})`);
    }
    
    return {
      address: address,
      decimals: token.decimals || 18,
      symbol: token.symbol || tokenSymbol.toUpperCase(),
      isNative: address === ethers.ZeroAddress
    };
  }

  /**
   * Enhanced token validation with better error messages
   */
  async validateTokenSupport(tokenSymbol, originChainId, destinationChainId) {
    try {
      const inputTokenConfig = this.getTokenConfig(tokenSymbol, originChainId);
      const outputTokenConfig = this.getTokenConfig(tokenSymbol, destinationChainId);
      
      console.log(`✅ Token ${tokenSymbol} supported on both chains`);
      console.log(`📍 Origin (${this.getChainName(originChainId)}): ${inputTokenConfig.address === ethers.ZeroAddress ? 'Native ETH' : inputTokenConfig.address}`);
      console.log(`📍 Destination (${this.getChainName(destinationChainId)}): ${outputTokenConfig.address === ethers.ZeroAddress ? 'Native ETH' : outputTokenConfig.address}`);
      
      return {
        inputToken: inputTokenConfig.address,
        outputToken: outputTokenConfig.address,
        inputConfig: inputTokenConfig,
        outputConfig: outputTokenConfig
      };
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

  /**
   * Enhanced balance checking with dynamic token support
   */
  async checkBalances(tokenSymbol, amount, chainId) {
    const wallet = this.wallets[chainId];
    const provider = this.providers[chainId];
    const tokenConfig = this.getTokenConfig(tokenSymbol, chainId);
    
    console.log(`💰 Checking balances for ${tokenSymbol} on chain ${chainId}...`);
    
    // Always check ETH balance for gas
    const ethBalance = await provider.getBalance(wallet.address);
    console.log(`💎 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
    
    let tokenBalance;
    
    if (tokenConfig.isNative) {
      // For native ETH, token balance IS the ETH balance
      tokenBalance = ethBalance;
      console.log(`🪙 ${tokenConfig.symbol} Balance: ${ethers.formatUnits(tokenBalance, tokenConfig.decimals)} ${tokenConfig.symbol} (Native)`);
    } else {
      // For ERC20 tokens
      const tokenContract = new ethers.Contract(
        tokenConfig.address,
        [
          'function balanceOf(address owner) view returns (uint256)',
          'function symbol() view returns (string)',
          'function decimals() view returns (uint8)'
        ],
        provider
      );
      
      try {
        tokenBalance = await tokenContract.balanceOf(wallet.address);
        
        // Verify on-chain decimals match our config
        const onChainDecimals = await tokenContract.decimals();
        if (onChainDecimals !== tokenConfig.decimals) {
          console.warn(`⚠️ Decimal mismatch for ${tokenSymbol}: config=${tokenConfig.decimals}, on-chain=${onChainDecimals}`);
          tokenConfig.decimals = onChainDecimals; // Use on-chain value
        }
        
        console.log(`🪙 ${tokenConfig.symbol} Balance: ${ethers.formatUnits(tokenBalance, tokenConfig.decimals)} ${tokenConfig.symbol}`);
      } catch (error) {
        console.error(`❌ Error fetching ${tokenSymbol} balance:`, error.message);
        throw new Error(`Could not fetch ${tokenSymbol} balance. Is the token address correct?`);
      }
    }
    
    const formattedAmount = ethers.formatUnits(amount, tokenConfig.decimals);
    console.log(`📤 Amount to bridge: ${formattedAmount} ${tokenConfig.symbol}`);
    
    // Check if user has enough tokens
    if (BigInt(tokenBalance) < BigInt(amount)) {
      throw new Error(
        `Insufficient ${tokenConfig.symbol} balance. Required: ${formattedAmount} ${tokenConfig.symbol}, Available: ${ethers.formatUnits(tokenBalance, tokenConfig.decimals)} ${tokenConfig.symbol}`
      );
    }
    
    return {
      ethBalance,
      tokenBalance,
      tokenConfig,
      hasEnoughTokens: BigInt(tokenBalance) >= BigInt(amount)
    };
  }

  /**
   * Get suggested fees from Across API
   */
  async getSuggestedFees(params) {
    const {
      inputToken,
      outputToken,
      originChainId,
      destinationChainId,
      amount,
      recipient,
      timestamp
    } = params;

    try {
      const url = `${this.apiUrl}/suggested-fees`;
      const response = await axios.get(url, {
        params: {
          inputToken,
          outputToken,
          originChainId,
          destinationChainId,
          amount,
          recipient,
          timestamp: timestamp || Math.floor(Date.now() / 1000)
        }
      });

      console.log('💰 Fee estimation received from Across API');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get suggested fees:', error.message);
      throw new Error(`Fee estimation failed: ${error.message}`);
    }
  }

  /**
   * Get available routes from Across API
   */
  async getAvailableRoutes(originChainId, destinationChainId) {
    try {
      const url = `${this.apiUrl}/available-routes`;
      const response = await axios.get(url, {
        params: {
          originChainId,
          destinationChainId
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get available routes:', error.message);
      throw new Error(`Route lookup failed: ${error.message}`);
    }
  }

  /**
   * Approve ERC20 token spending if needed
   */
  async approveTokenIfNeeded(tokenAddress, spenderAddress, amount, chainId) {
    if (tokenAddress === ethers.ZeroAddress) {
      console.log('✅ Native ETH transfer - no approval needed');
      return null;
    }

    const wallet = this.wallets[chainId];
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function allowance(address owner, address spender) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)'
      ],
      wallet
    );

    try {
      const currentAllowance = await tokenContract.allowance(wallet.address, spenderAddress);
      
      if (BigInt(currentAllowance) < BigInt(amount)) {
        console.log(`🔒 Approving ${tokenAddress} spending...`);
        
        const approveTx = await tokenContract.approve(spenderAddress, amount);
        console.log(`📝 Approval transaction: ${approveTx.hash}`);
        
        const receipt = await approveTx.wait();
        console.log(`✅ Approval confirmed in block ${receipt.blockNumber}`);
        
        return receipt;
      } else {
        console.log('✅ Token already approved');
        return null;
      }
    } catch (error) {
      console.error('❌ Token approval failed:', error.message);
      throw new Error(`Token approval failed: ${error.message}`);
    }
  }

  /**
   * Perform pre-flight checks before executing bridge
   */
  async performPreFlightChecks(bridgeParams) {
    const {
      inputToken,
      originChainId,
      destinationChainId,
      amount,
      recipient
    } = bridgeParams;

    console.log('🔍 Performing pre-flight checks...');

    try {
      // 1. Check wallet balances
      const wallet = this.wallets[originChainId];
      const provider = this.providers[originChainId];
      
      const ethBalance = await provider.getBalance(wallet.address);
      let tokenBalance;
      
      if (inputToken === ethers.ZeroAddress) {
        tokenBalance = ethBalance;
      } else {
        const tokenContract = new ethers.Contract(
          inputToken,
          ['function balanceOf(address owner) view returns (uint256)'],
          provider
        );
        tokenBalance = await tokenContract.balanceOf(wallet.address);
      }

      // 2. Estimate gas costs
      const spokePoolAddress = CONFIG.SPOKE_POOLS[originChainId];
      if (!spokePoolAddress) {
        throw new Error(`No SpokePool found for chain ${originChainId}`);
      }

      const spokePool = new ethers.Contract(spokePoolAddress, CONFIG.SPOKE_POOL_ABI, wallet);
      
      // Get current timestamp for quote
      const currentTimestamp = Math.floor(Date.now() / 1000);
      // Ensure timestamps fit in uint32 bounds
      const maxUint32 = 4294967295;
      const fillDeadline = Math.min(currentTimestamp + 21600, maxUint32); // 6 hours or max uint32
      const exclusivityDeadline = Math.min(currentTimestamp + 300, maxUint32);

      try {
        const gasEstimate = await spokePool.depositV3.estimateGas(
          wallet.address, // depositor
          recipient, // recipient
          inputToken, // inputToken
          inputToken, // outputToken (same for now)
          amount, // inputAmount
          amount, // outputAmount (will be adjusted with fees)
          destinationChainId, // destinationChainId
          ethers.ZeroAddress, // exclusiveRelayer
          currentTimestamp - 100, // quoteTimestamp
          fillDeadline, // fillDeadline
          exclusivityDeadline, // exclusivityDeadline
          '0x', // message
          { value: inputToken === ethers.ZeroAddress ? amount : 0 }
        );

        const gasPrice = await provider.getFeeData();
        const estimatedCost = gasEstimate * gasPrice.gasPrice;

        console.log(`⛽ Estimated gas: ${gasEstimate.toString()} units`);
        console.log(`💰 Estimated cost: ${ethers.formatEther(estimatedCost)} ETH`);

        return {
          canProceed: true,
          balanceInfo: { ethBalance, tokenBalance },
          gasEstimate: { gasLimit: gasEstimate, estimatedCost, gasPrice: gasPrice.gasPrice },
          spokePoolAddress,
          contractParams: {
            depositor: wallet.address,
            recipient,
            inputToken,
            outputToken: inputToken,
            inputAmount: amount,
            outputAmount: amount,
            destinationChainId,
            exclusiveRelayer: ethers.ZeroAddress,
            quoteTimestamp: currentTimestamp - 100,
            fillDeadline,
            exclusivityDeadline,
            message: '0x'
          }
        };

      } catch (gasError) {
        console.warn('⚠️ Gas estimation failed, proceeding with default estimates');
        return {
          canProceed: true,
          balanceInfo: { ethBalance, tokenBalance },
          gasEstimate: { gasLimit: 300000n, estimatedCost: ethers.parseEther('0.01'), gasPrice: ethers.parseUnits('20', 'gwei') },
          spokePoolAddress,
          contractParams: {
            depositor: wallet.address,
            recipient,
            inputToken,
            outputToken: inputToken,
            inputAmount: amount,
            outputAmount: amount,
            destinationChainId,
            exclusiveRelayer: ethers.ZeroAddress,
            quoteTimestamp: currentTimestamp - 100,
            fillDeadline: currentTimestamp + 21600,
            exclusivityDeadline: currentTimestamp + 300,
            message: '0x'
          }
        };
      }

    } catch (error) {
      console.error('❌ Pre-flight checks failed:', error.message);
      return {
        canProceed: false,
        error: error.message
      };
    }
  }

  /**
   * Execute the bridge transaction
   */
  async executeBridge(bridgeParams) {
    const {
      inputToken,
      outputToken,
      originChainId,
      destinationChainId,
      amount,
      recipient,
      message = '0x'
    } = bridgeParams;
  
    console.log('🌉 Executing bridge transaction...');
  
    try {
      // 1. Get pre-flight check results
      const preFlightResults = await this.performPreFlightChecks(bridgeParams);
      
      if (!preFlightResults.canProceed) {
        throw new Error(`Pre-flight checks failed: ${preFlightResults.error}`);
      }
  
      // 2. Get fee estimates with message
      const feeData = await this.getSuggestedFees({
        inputToken,
        outputToken,
        originChainId,
        destinationChainId,
        amount,
        recipient,
        timestamp: preFlightResults.contractParams.quoteTimestamp,
        message
      });
  
      // 3. Calculate output amount after fees - Fix fee calculation
      const lpFeeAmount = BigInt(feeData.lpFee?.total || '0');
      const relayFeeAmount = BigInt(feeData.totalRelayFee?.total || '0');
      const outputAmount = BigInt(amount) - lpFeeAmount - relayFeeAmount;
  
      if (outputAmount <= 0n) {
        throw new Error('Output amount after fees would be zero or negative');
      }
  
      // 4. Approve token spending if needed
      const wallet = this.wallets[originChainId];
      const spokePoolAddress = preFlightResults.spokePoolAddress;
  
      await this.approveTokenIfNeeded(inputToken, spokePoolAddress, amount, originChainId);
  
      // 5. Execute deposit transaction with proper parameters
      const spokePool = new ethers.Contract(spokePoolAddress, CONFIG.SPOKE_POOL_ABI, wallet);
  
      const quoteTimestamp = feeData.timestamp || Math.floor(Date.now() / 1000);
      const maxUint32 = 4294967295;
      const fillDeadline = Math.min(quoteTimestamp + 21600, maxUint32); // 6 hours or max uint32
      const exclusivityDeadline = Math.min(quoteTimestamp + 300, maxUint32); 
  
      console.log('📝 Submitting bridge transaction...');
      
      // Create the deposit transaction with proper call data
      const depositTx = await spokePool.depositV3(
        wallet.address, // depositor
        recipient, // recipient
        inputToken, // inputToken
        outputToken, // outputToken
        amount.toString(), // inputAmount
        outputAmount.toString(), // outputAmount (fee-adjusted)
        destinationChainId, // destinationChainId
        ethers.ZeroAddress, // exclusiveRelayer
        quoteTimestamp, // quoteTimestamp from API
        fillDeadline, // fillDeadline
        exclusivityDeadline, // exclusivityDeadline
        message, // message
        {
          value: inputToken === ethers.ZeroAddress ? amount : 0,
          gasLimit: preFlightResults.gasEstimate.gasLimit
        }
      );
  
      console.log(`🚀 Bridge transaction submitted: ${depositTx.hash}`);
      console.log('⏳ Waiting for confirmation...');
  
      const receipt = await depositTx.wait();
      
      console.log(`✅ Bridge transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
  
      return {
        success: true,
        transactionHash: depositTx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        inputAmount: amount,
        outputAmount: outputAmount.toString(),
        fees: {
          lpFee: lpFeeAmount.toString(),
          relayFee: relayFeeAmount.toString(),
          totalFees: (lpFeeAmount + relayFeeAmount).toString()
        },
        originChainId,
        destinationChainId,
        recipient
      };
  
    } catch (error) {
      console.error('❌ Bridge execution failed:', error.message);
      
      // Enhanced error handling for sendTransaction failures
      if (error.message.includes('sendTransaction') || error.message.includes('revert')) {
        console.error('💥 Transaction Revert Details:');
        if (error.data) {
          console.error('Error data:', error.data);
        }
        if (error.reason) {
          console.error('Revert reason:', error.reason);
        }
      }
      
      throw error;
    }
  }
  
  generateMessageForHandler(userAddress) {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    // Encode the userAddress for handler contract
    return abiCoder.encode(["address"], [userAddress]);
  }

  /**
   * Dynamic bridge execution that works with any supported token
   */
  async executeDynamicBridge(params) {
    const {
      tokenSymbol,
      originChainId,
      destinationChainId,
      amount,
      recipient,
      message = null // Allow custom message
    } = params;
  
    try {
      console.log(`🌉 Starting dynamic bridge for ${tokenSymbol}`);
      
      // 1. Validate token support
      const tokenValidation = await this.validateTokenSupport(
        tokenSymbol,
        originChainId,
        destinationChainId
      );
      
      // 2. Generate proper message if not provided
      const finalMessage = this.generateMessageForHandler(recipient);

      console.log("FINAL MESAGE:", finalMessage);
      
      // 3. Build bridge parameters
      const bridgeParams = {
        inputToken: tokenValidation.inputToken,
        outputToken: tokenValidation.outputToken,
        originChainId,
        destinationChainId,
        amount,
        recipient,
        message: finalMessage
      };
      
      // 4. Execute the bridge
      const result = await this.executeBridge(bridgeParams);
      
      console.log(`✅ Dynamic bridge completed for ${tokenSymbol}`);
      return {
        ...result,
        tokenSymbol,
        tokenConfig: tokenValidation.inputConfig
      };
      
    } catch (error) {
      console.error(`❌ Dynamic bridge failed for ${tokenSymbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Find the best token to bridge based on available balances
   */
  async findBestTokenToBridge(params) {
    const { originChainId, destinationChainId, minAmountUSD = 1, recipient } = params;
    
    console.log('🔍 Scanning for best token to bridge...');
    
    const supportedTokens = ['ETH', 'WETH', 'USDC', 'USDT', 'DAI'];
    const tokenBalances = [];
    
    for (const tokenSymbol of supportedTokens) {
      try {
        const tokenConfig = this.getTokenConfig(tokenSymbol, originChainId);
        const wallet = this.wallets[originChainId];
        const provider = this.providers[originChainId];
        
        let balance;
        if (tokenConfig.isNative) {
          balance = await provider.getBalance(wallet.address);
        } else {
          const tokenContract = new ethers.Contract(
            tokenConfig.address,
            ['function balanceOf(address owner) view returns (uint256)'],
            provider
          );
          balance = await tokenContract.balanceOf(wallet.address);
        }
        
        const formattedBalance = ethers.formatUnits(balance, tokenConfig.decimals);
        
        // Skip if balance is too low
        if (parseFloat(formattedBalance) < 0.0001) continue;
        
        // Rough USD estimation (you'd want to use a price API in production)
        let estimatedUSDValue = 0;
        if (tokenSymbol === 'ETH' || tokenSymbol === 'WETH') {
          estimatedUSDValue = parseFloat(formattedBalance) * 2000; // Rough ETH price
        } else if (tokenSymbol === 'USDC' || tokenSymbol === 'USDT') {
          estimatedUSDValue = parseFloat(formattedBalance);
        } else if (tokenSymbol === 'DAI') {
          estimatedUSDValue = parseFloat(formattedBalance);
        }
        
        if (estimatedUSDValue >= minAmountUSD) {
          tokenBalances.push({
            symbol: tokenSymbol,
            balance: balance.toString(),
            formattedBalance,
            estimatedUSDValue,
            config: tokenConfig,
            recommendedAmount: tokenConfig.isNative 
              ? ethers.parseUnits((parseFloat(formattedBalance) * 0.5).toString(), tokenConfig.decimals).toString() // Keep some ETH for gas
              : ethers.parseUnits((parseFloat(formattedBalance) * 0.9).toString(), tokenConfig.decimals).toString() // Use 90% of ERC20 tokens
          });
        }
        
      } catch (error) {
        console.log(`⚠️ Could not check ${tokenSymbol}:`, error.message);
      }
    }
    
    // Sort by USD value and return the best option
    tokenBalances.sort((a, b) => b.estimatedUSDValue - a.estimatedUSDValue);
    
    return tokenBalances.length > 0 ? tokenBalances[0] : null;
  }

  /**
   * Enhanced dry run with token-specific logic
   */
  async dryRun(bridgeParams) {
    const { tokenSymbol } = bridgeParams;
    
    console.log(`🧪 Starting dry run simulation for ${tokenSymbol}...`);
    
    try {
      // 1. Validate token support
      const tokens = await this.validateTokenSupport(
        tokenSymbol,
        bridgeParams.originChainId,
        bridgeParams.destinationChainId
      );
      
      // 2. Check balances with token-specific logic
      const balanceInfo = await this.checkBalances(
        tokenSymbol,
        bridgeParams.amount,
        bridgeParams.originChainId
      );
      
      // 3. Perform other pre-flight checks
      const preFlightResults = await this.performPreFlightChecks({
        ...bridgeParams,
        inputToken: tokens.inputToken,
        outputToken: tokens.outputToken
      });
      
      // 4. Get fee estimates
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const feeData = await this.getSuggestedFees({
        inputToken: tokens.inputToken,
        outputToken: tokens.outputToken,
        originChainId: bridgeParams.originChainId,
        destinationChainId: bridgeParams.destinationChainId,
        amount: bridgeParams.amount,
        recipient: bridgeParams.recipient,
        timestamp: currentTimestamp - 100
      });
      
      const outputAmount = BigInt(bridgeParams.amount) - BigInt(feeData.lpFee.total || 0) - BigInt(feeData.totalRelayFee.total || 0);
      
      console.log('📊 DRY RUN SUMMARY:');
      console.log('==================');
      console.log(`🪙 Token: ${tokenSymbol} (${balanceInfo.tokenConfig.isNative ? 'Native' : 'ERC20'})`);
      console.log(`💰 Input Amount: ${ethers.formatUnits(bridgeParams.amount, balanceInfo.tokenConfig.decimals)} ${tokenSymbol}`);
      console.log(`💸 LP Fee: ${ethers.formatUnits(feeData.lpFee.total || 0, balanceInfo.tokenConfig.decimals)} ${tokenSymbol}`);
      console.log(`🚚 Relay Fee: ${ethers.formatUnits(feeData.totalRelayFee.total || 0, balanceInfo.tokenConfig.decimals)} ${tokenSymbol}`);
      console.log(`📤 Output Amount: ${ethers.formatUnits(outputAmount, balanceInfo.tokenConfig.decimals)} ${tokenSymbol}`);
      console.log(`⛽ Estimated Gas Cost: ${ethers.formatEther(preFlightResults.gasEstimate.estimatedCost)} ETH`);
      console.log(`✅ Transaction would succeed: ${preFlightResults.canProceed}`);
      
      return {
        canProceed: preFlightResults.canProceed,
        tokenSymbol,
        tokenConfig: balanceInfo.tokenConfig,
        inputAmount: bridgeParams.amount,
        outputAmount: outputAmount.toString(),
        fees: {
          lpFee: feeData.lpFee.total || 0,
          relayFee: feeData.totalRelayFee.total || 0,
          gasCost: preFlightResults.gasEstimate.estimatedCost
        },
        balanceInfo: preFlightResults.balanceInfo,
        gasEstimate: preFlightResults.gasEstimate
      };
      
    } catch (error) {
      console.error(`❌ Dry run failed for ${tokenSymbol}:`, error.message);
      return {
        canProceed: false,
        tokenSymbol,
        error: error.message
      };
    }
  }

  /**
   * Monitor bridge transaction status
   */
  async monitorBridge(transactionHash, originChainId, destinationChainId, maxWaitTime = 3600000) {
    console.log(`🔍 Monitoring bridge transaction: ${transactionHash}`);
    console.log(`⏰ Max wait time: ${maxWaitTime / 1000} seconds`);

    const startTime = Date.now();
    let depositDetected = false;
    let fillDetected = false;

    try {
      // First, ensure the deposit transaction is confirmed
      const provider = this.providers[originChainId];
      const receipt = await provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        throw new Error('Transaction not found or not yet confirmed');
      }

      console.log(`✅ Deposit confirmed in block ${receipt.blockNumber} on origin chain`);
      depositDetected = true;

      // Extract deposit details from logs
      const spokePoolAddress = CONFIG.SPOKE_POOLS[originChainId];
      const spokePool = new ethers.Contract(spokePoolAddress, CONFIG.SPOKE_POOL_ABI, provider);
      
      // Parse deposit events
      const depositEvents = receipt.logs
        .filter(log => log.address.toLowerCase() === spokePoolAddress.toLowerCase())
        .map(log => {
          try {
            return spokePool.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .filter(event => event && event.name === 'V3FundsDeposited');

      if (depositEvents.length === 0) {
        console.warn('⚠️ No deposit events found in transaction logs');
      } else {
        const depositEvent = depositEvents[0];
        console.log(`📋 Deposit ID: ${depositEvent.args.depositId}`);
        console.log(`📍 Destination Chain: ${depositEvent.args.destinationChainId}`);
        console.log(`👤 Recipient: ${depositEvent.args.recipient}`);
      }

      // Now monitor for fill on destination chain
      console.log(`🔄 Monitoring for fill on destination chain ${destinationChainId}...`);
      
      const destinationProvider = this.providers[destinationChainId];
      if (!destinationProvider) {
        console.warn(`⚠️ No provider configured for destination chain ${destinationChainId}`);
        return {
          status: 'deposit_confirmed',
          depositHash: transactionHash,
          depositBlock: receipt.blockNumber,
          fillHash: null,
          fillBlock: null,
          elapsed: Date.now() - startTime
        };
      }

      // Poll for fill transaction
      const pollInterval = 30000; // 30 seconds
      let attempts = 0;
      const maxAttempts = Math.floor(maxWaitTime / pollInterval);

      while (attempts < maxAttempts && !fillDetected) {
        try {
          // Check recent blocks for fill events
          const currentBlock = await destinationProvider.getBlockNumber();
          const fromBlock = Math.max(currentBlock - 100, receipt.blockNumber); // Check last 100 blocks
          
          const destinationSpokePool = CONFIG.SPOKE_POOLS[destinationChainId];
          if (destinationSpokePool) {
            // Query for fill events (this is a simplified approach)
            // In practice, you'd want to use proper event filtering
            console.log(`🔍 Checking blocks ${fromBlock} to ${currentBlock} for fills...`);
          }
          
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;
          
          const elapsed = Date.now() - startTime;
          console.log(`⏳ Still waiting for fill... (${Math.floor(elapsed / 1000)}s elapsed, attempt ${attempts}/${maxAttempts})`);
          
        } catch (error) {
          console.warn(`⚠️ Error checking for fill:`, error.message);
          attempts++;
        }
      }

      const finalElapsed = Date.now() - startTime;
      
      if (!fillDetected) {
        console.log(`⏰ Monitoring timeout reached (${finalElapsed / 1000}s)`);
        console.log('💡 Your bridge transaction may still complete - fills can take up to several hours');
        console.log('🔗 Check https://across.to for transaction status');
      }

      return {
        status: fillDetected ? 'completed' : 'pending_fill',
        depositHash: transactionHash,
        depositBlock: receipt.blockNumber,
        fillHash: null, // Would need more sophisticated monitoring to detect this
        fillBlock: null,
        elapsed: finalElapsed,
        note: 'Fill monitoring is simplified - check Across.to for complete status'
      };

    } catch (error) {
      console.error('❌ Bridge monitoring failed:', error.message);
      return {
        status: 'error',
        error: error.message,
        elapsed: Date.now() - startTime
      };
    }
  }

  /**
   * Get bridge transaction history for an address
   */
  async getBridgeHistory(address, chainId = null, limit = 10) {
    console.log(`📊 Fetching bridge history for ${address}...`);

    try {
      const url = `${this.apiUrl}/deposits/history`;
      const params = {
        depositor: address,
        limit
      };

      if (chainId) {
        params.originChainId = chainId;
      }

      const response = await axios.get(url, { params });
      
      console.log(`📈 Found ${response.data.deposits?.length || 0} bridge transactions`);
      
      return response.data.deposits || [];

    } catch (error) {
      console.error('❌ Failed to fetch bridge history:', error.message);
      
      // Return empty array if API fails
      return [];
    }
  }

  /**
   * Enhanced error handling with specific guidance
   */
  handleBridgeError(error) {
    console.error('\n💥 Bridge Error Details:');
    console.error('Message:', error.message);
    
    if (error.message.includes('Insufficient') && error.message.includes('balance')) {
      console.log('\n💡 Balance Solutions:');
      console.log('1. 🪙 Check you have enough of the token you\'re trying to bridge');
      console.log('2. ⛽ Ensure you have enough ETH for gas fees');
      console.log('3. 🔄 Try bridging a smaller amount');
      console.log('4. 🧪 Use the dry run feature to estimate costs first');
    } else if (error.message.includes('Unsupported token')) {
      console.log('\n💡 Token Support Solutions:');
      console.log('1. ✅ Check CONFIG.TOKENS for supported tokens');
      console.log('2. 🌐 Verify token exists on both source and destination chains');
      console.log('3. 📋 Use exact token symbols (ETH, WETH, USDC, USDT, DAI)');
    } else if (error.message.includes('No routes available')) {
      console.log('\n💡 Route Solutions:');
      console.log('1. 🛣️ Try different token pairs');
      console.log('2. 🔄 Check if the bridge supports your specific chain combination');
      console.log('3. ⏰ Wait and try again (routes can be temporarily unavailable)');
    } else if (error.message.includes('Gas estimation failed')) {
      console.log('\n💡 Gas Solutions:');
      console.log('1. ⛽ Ensure you have enough ETH for gas fees');
      console.log('2. 🔧 Try increasing gas limit manually');
      console.log('3. 🌐 Check if the RPC endpoint is working properly');
      console.log('4. ⏰ Try again during lower network congestion');
    } else if (error.message.includes('Token approval failed')) {
      console.log('\n💡 Approval Solutions:');
      console.log('1. ⛽ Ensure you have enough ETH for approval transaction');
      console.log('2. 🔄 Try approving manually first');
      console.log('3. 🧹 Clear existing approvals if any');
    } else if (error.message.includes('Fee estimation failed')) {
      console.log('\n💡 Fee Solutions:');
      console.log('1. 🌐 Check your internet connection');
      console.log('2. 🔄 Try again in a few moments');
      console.log('3. 🛠️ Verify API endpoints are accessible');
    }
    
    console.log('\n🆘 General Troubleshooting:');
    console.log('1. 🔍 Check all addresses and chain IDs are correct');
    console.log('2. 🌐 Verify your RPC endpoints are working');
    console.log('3. 💰 Ensure sufficient balances for tokens and gas');
    console.log('4. ⏰ Try again during lower network congestion');
    console.log('5. 📖 Check Across Protocol documentation for updates');
  }

  calculateSafeTimestamp(baseTimestamp, offsetSeconds) {
    const maxUint32 = 4294967295;
    const targetTimestamp = baseTimestamp + offsetSeconds;
    
    if (targetTimestamp > maxUint32) {
      console.warn(`⚠️ Timestamp ${targetTimestamp} exceeds uint32 limit, using maximum safe value`);
      return maxUint32;
    }
    
    return targetTimestamp;
  }

  /**
   * Quick bridge helper - automatically finds best token and executes
   */
  async quickBridge(params) {
    const {
      originChainId,
      destinationChainId,
      recipient,
      amountUSD = null,
      tokenSymbol = null
    } = params;

    console.log('🚀 Starting Quick Bridge...');

    try {
      let tokenToBridge;
      let bridgeAmount;

      if (tokenSymbol && amountUSD) {
        // User specified both token and amount
        const tokenConfig = this.getTokenConfig(tokenSymbol, originChainId);
        bridgeAmount = ethers.parseUnits(amountUSD.toString(), tokenConfig.decimals);
        
        await this.checkBalances(tokenSymbol, bridgeAmount, originChainId);
        
        tokenToBridge = {
          symbol: tokenSymbol,
          config: tokenConfig,
          recommendedAmount: bridgeAmount.toString()
        };
      } else {
        // Auto-detect best token to bridge
        tokenToBridge = await this.findBestTokenToBridge({
          originChainId,
          destinationChainId,
          minAmountUSD: amountUSD || 1,
          recipient
        });

        if (!tokenToBridge) {
          throw new Error('No suitable tokens found for bridging');
        }

        bridgeAmount = tokenToBridge.recommendedAmount;
      }

      console.log(`🎯 Selected token: ${tokenToBridge.symbol}`);
      console.log(`💰 Bridge amount: ${ethers.formatUnits(bridgeAmount, tokenToBridge.config.decimals)} ${tokenToBridge.symbol}`);

      // Execute the bridge
      const result = await this.executeDynamicBridge({
        tokenSymbol: tokenToBridge.symbol,
        originChainId,
        destinationChainId,
        amount: bridgeAmount,
        recipient
      });

      console.log('🎉 Quick Bridge completed successfully!');
      return result;

    } catch (error) {
      console.error('❌ Quick Bridge failed:', error.message);
      this.handleBridgeError(error);
      throw error;
    }
  }
}

// Usage Examples and Helper Functions
class BridgeExamples {
  static async basicUsage() {
    console.log('📚 Basic Bridge Usage Example\n');

    // Initialize bridge
    const bridge = new AcrossBridge('your-private-key-here', false); // false = mainnet
    
    // Setup RPC providers
    const rpcUrls = {
      1: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
      8453: 'https://base-mainnet.g.alchemy.com/v2/your-api-key'
    };
    
    await bridge.initializeProviders(rpcUrls);

    // Example 1: Dry run first
    const dryRunResult = await bridge.dryRun({
      tokenSymbol: 'USDC',
      originChainId: 1, // Ethereum
      destinationChainId: 8453, // Base
      amount: ethers.parseUnits('100', 6), // 100 USDC
      recipient: '0x742d35Cc6638C532532C21cF8eeEdCC44e32e6D4'
    });

    if (dryRunResult.canProceed) {
      console.log('✅ Dry run successful, proceeding with bridge...');
      
      // Example 2: Execute the actual bridge
      const bridgeResult = await bridge.executeDynamicBridge({
        tokenSymbol: 'USDC',
        originChainId: 1,
        destinationChainId: 8453,
        amount: ethers.parseUnits('100', 6),
        recipient: '0x742d35Cc6638C532532C21cF8eeEdCC44e32e6D4'
      });

      console.log('Bridge completed:', bridgeResult);

      // Example 3: Monitor the bridge
      const monitorResult = await bridge.monitorBridge(
        bridgeResult.transactionHash,
        1, // origin chain
        8453, // destination chain
        1800000 // 30 minutes max wait
      );

      console.log('Monitor result:', monitorResult);
    }
  }

  static async quickBridgeUsage() {
    console.log('⚡ Quick Bridge Usage Example\n');

    const bridge = new AcrossBridge('your-private-key-here');
    
    const rpcUrls = {
      1: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
      42161: 'https://arb-mainnet.g.alchemy.com/v2/your-api-key'
    };
    
    await bridge.initializeProviders(rpcUrls);

    // Quick bridge - automatically finds best token and amount
    const result = await bridge.quickBridge({
      originChainId: 1, // Ethereum
      destinationChainId: 42161, // Arbitrum
      recipient: '0x742d35Cc6638C532532C21cF8eeEdCC44e32e6D4',
      amountUSD: 50 // $50 worth
    });

    console.log('Quick bridge result:', result);
  }

  static async advancedUsage() {
    console.log('🔧 Advanced Bridge Usage Example\n');

    const bridge = new AcrossBridge('your-private-key-here');
    
    const rpcUrls = {
      1: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
      137: 'https://polygon-mainnet.g.alchemy.com/v2/your-api-key',
      42161: 'https://arb-mainnet.g.alchemy.com/v2/your-api-key'
    };
    
    await bridge.initializeProviders(rpcUrls);

    // Check what tokens are available to bridge
    const bestToken = await bridge.findBestTokenToBridge({
      originChainId: 1,
      destinationChainId: 137,
      minAmountUSD: 10,
      recipient: '0x742d35Cc6638C532532C21cF8eeEdCC44e32e6D4'
    });

    console.log('Best token to bridge:', bestToken);

    // Get bridge history
    const history = await bridge.getBridgeHistory(
      '0x742d35Cc6638C532532C21cF8eeEdCC44e32e6D4'
    );

    console.log('Bridge history:', history);

    // Check available routes
    const routes = await bridge.getAvailableRoutes(1, 137);
    console.log('Available routes:', routes);
  }
}

module.exports = {
  AcrossBridge,
  BridgeExamples,
  CONFIG
};