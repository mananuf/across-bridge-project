const { ethers } = require('ethers');
const axios = require('axios');
const { CONFIG } = require('../config');

class AcrossBridge {
  constructor(privateKey, useTestnet = false) {
    this.privateKey = privateKey;
    this.useTestnet = useTestnet;
    this.apiUrl = useTestnet ? CONFIG.TESTNET_API : CONFIG.MAINNET_API;
    this.providers = {};
    this.wallets = {};
  }

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
          originChainId: originChainId.toString(),
          destinationChainId: destinationChainId.toString(),
          amount: amount.toString(),
          recipient,
          timestamp: timestamp || Math.floor(Date.now() / 1000),
          // Add missing required parameters
          depositor: recipient, // Often required by Across API
          exclusiveRelayer: '0x0000000000000000000000000000000000000000',
          exclusivityDeadline: (timestamp || Math.floor(Date.now() / 1000)) + 300,
          fillDeadline: (timestamp || Math.floor(Date.now() / 1000)) + 21600,
          message: '0x'
        }
      });
  
      console.log('💰 Fee estimation received from Across API');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get suggested fees:', error.response?.data || error.message);
      throw new Error(`Fee estimation failed: ${error.response?.data?.message || error.message}`);
    }
  }

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

  generateIntentOrderData(params) {
    const {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount,
      destinationChainId,
      recipient,
      fillDeadline,
      exclusiveRelayer = ethers.ZeroAddress,
      exclusivityPeriod = 0,
      message = '0x'
    } = params;
  
    console.log('🔧 Generating intent order data...');
  
    // Pad the depositor address (recipient) to 32 bytes
    const paddedRecipient = ethers.zeroPadValue(recipient, 32);
  
    // Encode the order data using ABI encoding
    const orderData = ethers.AbiCoder.defaultAbiCoder().encode(
      [
        'bytes32',    // paddedRecipient
        'address',    // inputToken
        'address',    // outputToken  
        'uint256',    // inputAmount
        'uint256',    // outputAmount
        'uint256',    // destinationChainId
        'address',    // exclusiveRelayer
        'uint256',    // exclusivityPeriod
        'uint256',    // fillDeadline
        'bytes'       // message
      ],
      [
        paddedRecipient,
        inputToken,
        outputToken,
        inputAmount,
        outputAmount,
        destinationChainId,
        exclusiveRelayer,
        exclusivityPeriod,
        fillDeadline,
        message
      ]
    );
  
    const order = {
      orderDataType: CONFIG.ORDER_DATA_TYPE_HASH,
      orderData: orderData
    };
  
    console.log('✅ Intent order data generated');
    return order;
  }

  async performPreFlightChecks(bridgeParams) {
    const {
      inputToken,
      originChainId,
      destinationChainId,
      amount,
      recipient
    } = bridgeParams;
  
    console.log('🔍 Performing pre-flight checks for intent-based bridge...');
  
    try {
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
  
      // 2. Check if Origin Settler exists
      const originSettlerAddress = CONFIG.ORIGIN_SETTLERS[originChainId];
      if (!originSettlerAddress) {
        throw new Error(`No AcrossOriginSettler found for chain ${originChainId}`);
      }
  
      // 3. Estimate gas for executeOrder
      const originSettler = new ethers.Contract(
        originSettlerAddress,
        CONFIG.ORIGIN_SETTLER_ABI,
        wallet
      );
  
      try {
        // Create a sample order for gas estimation
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const sampleOrder = this.generateIntentOrderData({
          inputToken,
          outputToken: inputToken,
          inputAmount: amount,
          outputAmount: amount,
          destinationChainId,
          recipient,
          fillDeadline: currentTimestamp + 21600,
          message: '0x'
        });
  
        const gasEstimate = await originSettler.executeOrder.estimateGas(sampleOrder, {
          value: inputToken === ethers.ZeroAddress ? amount : 0
        });
  
        const gasPrice = await provider.getFeeData();
        const estimatedCost = gasEstimate * gasPrice.gasPrice;
  
        console.log(`⛽ Estimated gas: ${gasEstimate.toString()} units`);
        console.log(`💰 Estimated cost: ${ethers.formatEther(estimatedCost)} ETH`);
  
        return {
          canProceed: true,
          balanceInfo: { ethBalance, tokenBalance },
          gasEstimate: { gasLimit: gasEstimate, estimatedCost, gasPrice: gasPrice.gasPrice },
          originSettlerAddress
        };
  
      } catch (gasError) {
        console.warn('⚠️ Gas estimation failed, using default estimates');
        return {
          canProceed: true,
          balanceInfo: { ethBalance, tokenBalance },
          gasEstimate: { gasLimit: 500000n, estimatedCost: ethers.parseEther('0.02'), gasPrice: ethers.parseUnits('20', 'gwei') },
          originSettlerAddress
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

    console.log('🌉 Executing bridge transaction with intent-based flow...');

    try {
      // 1. Get fee estimates first
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const feeData = await this.getSuggestedFees({
        inputToken,
        outputToken,
        originChainId,
        destinationChainId,
        amount,
        recipient,
        timestamp: currentTimestamp - 100,
        message
      });

      // 2. Calculate output amount after fees
      const lpFeeAmount = BigInt(feeData.lpFee?.total || '0');
      const relayFeeAmount = BigInt(feeData.totalRelayFee?.total || '0');
      const outputAmount = BigInt(amount) - lpFeeAmount - relayFeeAmount;

      if (outputAmount <= 0n) {
        throw new Error('Output amount after fees would be zero or negative');
      }

      // 3. Set up timing parameters
      const fillDeadline = currentTimestamp + 21600; // 6 hours from now
      const exclusivityPeriod = 300; // 5 minutes

      // 4. Get wallet and contract instances
      const wallet = this.wallets[originChainId];
      const originSettlerAddress = CONFIG.ORIGIN_SETTLERS[originChainId];
      
      if (!originSettlerAddress) {
        throw new Error(`No AcrossOriginSettler found for chain ${originChainId}`);
      }

      // 5. Approve token spending to the Origin Settler (not SpokePool)
      await this.approveTokenIfNeeded(inputToken, originSettlerAddress, amount, originChainId);

      // 6. Generate the intent order data
      const order = this.generateIntentOrderData({
        inputToken,
        outputToken,
        inputAmount: amount,
        outputAmount: outputAmount.toString(),
        destinationChainId,
        recipient,
        fillDeadline,
        exclusiveRelayer: ethers.ZeroAddress,
        exclusivityPeriod,
        message
      });

      // 7. Create the Origin Settler contract instance
      const originSettler = new ethers.Contract(
        originSettlerAddress,
        CONFIG.ORIGIN_SETTLER_ABI,
        wallet
      );

      console.log('📝 Submitting intent-based bridge transaction...');

      // 8. Execute the order through the Origin Settler
      const executeTx = await originSettler.executeOrder(order, {
        value: inputToken === ethers.ZeroAddress ? amount : 0,
        gasLimit: 500000 // Increased gas limit for intent execution
      });

      console.log(`🚀 Intent bridge transaction submitted: ${executeTx.hash}`);
      console.log('⏳ Waiting for confirmation...');

      const receipt = await executeTx.wait();
      
      console.log(`✅ Intent bridge transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

      return {
        success: true,
        transactionHash: executeTx.hash,
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
        recipient,
        intentOrder: order
      };

    } catch (error) {
      console.error('❌ Intent bridge execution failed:', error.message);
      
      // Enhanced error handling
      if (error.message.includes('sendTransaction') || error.message.includes('revert')) {
        console.error('💥 Transaction Revert Details:');
        if (error.data) {
          console.error('Error data:', error.data);
        }
        if (error.reason) {
          console.error('Revert reason:', error.reason);
        }
        if (error.code) {
          console.error('Error code:', error.code);
        }
      }
      
      throw error;
    }
  }

  async executeDynamicBridge(params) {
    const {
      tokenSymbol,
      originChainId,
      destinationChainId,
      amount,
      recipient,
      message
    } = params;

    try {
      console.log(`🌉 Starting dynamic bridge for ${tokenSymbol}`);
      
      // 1. Validate token support
      const tokenValidation = await this.validateTokenSupport(
        tokenSymbol,
        originChainId,
        destinationChainId
      );
      
      // 3. Build bridge parameters
      const bridgeParams = {
        inputToken: tokenValidation.inputToken,
        outputToken: tokenValidation.outputToken,
        originChainId,
        destinationChainId,
        amount,
        recipient,
        message: message
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
}

module.exports = {
  AcrossBridge
};