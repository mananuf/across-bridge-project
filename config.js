const { ethers } = require('ethers');

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
    ],
  
    ORIGIN_SETTLERS: {
      1: '0x41a6fa8d160fe2d2d2fd2b227f4ce160eb88709d', // Ethereum (lowercase)
      11155111: '0x41a6fa8d160fe2d2d2fd2b227f4ce160eb88709d', // Sepolia (lowercase)
      8453: '0x41a6fa8d160fe2d2d2fd2b227f4ce160eb88709d', // Base (lowercase)
      84532: '0x41a6fa8d160fe2d2d2fd2b227f4ce160eb88709d', // Base Sepolia (lowercase)
      137: '0x41a6fa8d160fe2d2d2fd2b227f4ce160eb88709d', // Polygon (lowercase)
      42161: '0x41a6fa8d160fe2d2d2fd2b227f4ce160eb88709d', // Arbitrum (lowercase)
      10: '0x41a6fa8d160fe2d2d2fd2b227f4ce160eb88709d', // Optimism (lowercase)
    },
    
    ORIGIN_SETTLER_ABI: [
      'function executeOrder(tuple(bytes32 orderDataType, bytes orderData) order) payable',
      'function multicall(bytes[] calldata data) payable returns (bytes[] memory results)'
    ],
    
    ORDER_DATA_TYPE_HASH: '0x5c54fefb766ed428c96be865b4fef0f0e87cf42b6cd5e0e19d5c7b43ba7fe326'
  };

  module.exports = {CONFIG}