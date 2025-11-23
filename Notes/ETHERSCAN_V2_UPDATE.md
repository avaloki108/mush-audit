# Etherscan v2 API Integration Update

## Overview
This project has been updated to support **Etherscan v2 API** with comprehensive multi-chain support. The update adds support for **75+ blockchain networks** across Ethereum, Layer 2s, sidechains, and testnets.

## What's New

### 🌐 Supported Networks (75+ Chains)

#### Ethereum Networks
- **Ethereum Mainnet** (Chain ID: 1)
- **Sepolia Testnet** (Chain ID: 11155111)
- **Holesky Testnet** (Chain ID: 17000)
- **Hoodi Testnet** (Chain ID: 560048)

#### Layer 2 Networks
- **Arbitrum One** (Chain ID: 42161)
- **Arbitrum Nova** (Chain ID: 42170)
- **Arbitrum Sepolia** (Chain ID: 421614)
- **Base Mainnet** (Chain ID: 8453)
- **Base Sepolia** (Chain ID: 84532)
- **Optimism Mainnet** (Chain ID: 10)
- **Optimism Sepolia** (Chain ID: 11155420)
- **Polygon Mainnet** (Chain ID: 137)
- **Polygon Amoy Testnet** (Chain ID: 80002)
- **Blast Mainnet** (Chain ID: 81457)
- **Blast Sepolia** (Chain ID: 168587773)
- **Scroll Mainnet** (Chain ID: 534352)
- **Scroll Sepolia** (Chain ID: 534351)
- **zkSync Mainnet** (Chain ID: 324)
- **zkSync Sepolia** (Chain ID: 300)
- **Linea Mainnet** (Chain ID: 59144)
- **Linea Sepolia** (Chain ID: 59141)
- **Mantle Mainnet** (Chain ID: 5000)
- **Mantle Sepolia** (Chain ID: 5003)
- **Taiko Mainnet** (Chain ID: 167000)
- **Taiko Hoodi** (Chain ID: 167013)
- **opBNB Mainnet** (Chain ID: 204)
- **opBNB Testnet** (Chain ID: 5611)

#### Other EVM Chains
- **BNB Smart Chain** (Chain ID: 56)
- **BNB Smart Chain Testnet** (Chain ID: 97)
- **Avalanche C-Chain** (Chain ID: 43114)
- **Avalanche Fuji Testnet** (Chain ID: 43113)
- **Gnosis Chain** (Chain ID: 100)
- **Celo Mainnet** (Chain ID: 42220)
- **Celo Sepolia** (Chain ID: 11142220)
- **Aurora** (Chain ID: 1313161554)
- **Moonbeam** (Chain ID: 1284)
- **Moonriver** (Chain ID: 1285)
- **Moonbase Alpha** (Chain ID: 1287)
- **BitTorrent Chain** (Chain ID: 199)
- **BitTorrent Chain Testnet** (Chain ID: 1029)

#### Emerging Networks
- **Abstract Mainnet** (Chain ID: 2741)
- **Abstract Sepolia** (Chain ID: 11124)
- **ApeChain Mainnet** (Chain ID: 33139)
- **ApeChain Curtis Testnet** (Chain ID: 33111)
- **Berachain Mainnet** (Chain ID: 80094)
- **Berachain Bepolia Testnet** (Chain ID: 80069)
- **Fraxtal Mainnet** (Chain ID: 252)
- **Fraxtal Hoodi Testnet** (Chain ID: 2523)
- **HyperEVM Mainnet** (Chain ID: 999)
- **Katana Mainnet** (Chain ID: 747474)
- **Katana Bokuto** (Chain ID: 737373)
- **Memecore Testnet** (Chain ID: 43521)
- **Monad Testnet** (Chain ID: 10143)
- **Sei Mainnet** (Chain ID: 1329)
- **Sei Testnet** (Chain ID: 1328)
- **Sonic Mainnet** (Chain ID: 146)
- **Sonic Testnet** (Chain ID: 14601)
- **Stable Testnet** (Chain ID: 2201)
- **Swellchain Mainnet** (Chain ID: 1923)
- **Swellchain Testnet** (Chain ID: 1924)
- **Unichain Mainnet** (Chain ID: 130)
- **Unichain Sepolia** (Chain ID: 1301)
- **World Mainnet** (Chain ID: 480)
- **World Sepolia** (Chain ID: 4801)
- **XDC Mainnet** (Chain ID: 50)
- **XDC Apothem Testnet** (Chain ID: 51)

### 🔑 API Key Configuration

Etherscan v2 now uses a single API key across every supported chain. Update your `.env.local` file:

```bash
# One key for all chains
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_api_key
# Optional override (defaults to https://api.etherscan.io/v2/api)
NEXT_PUBLIC_ETHERSCAN_API_URL=https://api.etherscan.io/v2/api

# RPC (optional but recommended)
INFURA_API_KEY=your_infura_project_id
```

### 🔧 Updated Files

1. **`src/utils/chainServices.ts`**
   - Uses the shared Etherscan v2 endpoint with `chainid`
   - Prefers Infura RPC endpoints when `INFURA_API_KEY` is present

2. **`src/utils/constants.ts`**
   - Chain metadata (IDs, explorer URLs, fallbacks) for 75+ networks
   - All explorers now reference the shared `NEXT_PUBLIC_ETHERSCAN_API_KEY`

3. **`.env.local`**
   - Simplified to a single Etherscan key + optional base URL override
   - Adds `INFURA_API_KEY` for RPC defaults

4. **`next.config.ts`**
   - Single CORS proxy pointing at `https://api.etherscan.io/v2/api`

## API Tier Information

According to Etherscan v2 documentation:

### Free Tier Available
Most chains support free tier API access, including:
- Ethereum Mainnet
- Sepolia, Holesky testnets
- Abstract, ApeChain, Arbitrum networks
- Berachain, Blast, BTTC
- Celo, Fraxtal, Gnosis
- Most L2s and emerging chains

### Not Available on Free Tier
- Avalanche C-Chain (43114)
- Avalanche Fuji Testnet (43113)
- Base Mainnet (8453)
- Base Sepolia (84532)
- BNB Smart Chain Mainnet (56)
- BNB Smart Chain Testnet (97)
- OP Mainnet (10)
- OP Sepolia (11155420)

> **Note**: For chains without free tier access, you'll need a paid API subscription from the respective block explorer.

## Usage

### Checking Contract on Multiple Chains

```typescript
import { checkContractOnChains } from '@/utils/blockchain';

// Check a contract across all supported chains
const results = await checkContractOnChains('0x...');

// Results will include data for all chains where the contract exists
console.log(results.ethereum);  // Ethereum data
console.log(results.arbitrum);  // Arbitrum data
console.log(results.base);      // Base data
// ... etc for all 75+ chains
```

### Getting Chain-Specific Information

```typescript
import { CHAINS } from '@/utils/constants';
import { getRpcUrl, getApiScanConfig } from '@/utils/chainServices';

// Get RPC URL for a chain
const rpcUrl = getRpcUrl('linea');

// Get block explorer API config
const { url, apiKey } = getApiScanConfig('scroll');

// Access chain metadata
const chainInfo = CHAINS['taiko'];
console.log(chainInfo.displayName);  // "Taiko Mainnet"
console.log(chainInfo.id);           // "167000"
```

### Fetching Contract Source Code

```typescript
// The API route automatically uses the correct explorer based on chain
const response = await fetch(
  `/api/source?address=${contractAddress}&chain=${chainName}`
);
const data = await response.json();
```

## RPC Providers

Each chain configuration includes:
- **Default RPC**: Primary endpoint (usually official or most reliable)
- **Fallback RPCs**: 1-3 backup endpoints for redundancy

This ensures high availability even if one RPC provider is down.

## Block Explorer Integration

### Supported Explorer Features
- Contract source code verification
- ABI retrieval
- Proxy contract detection
- Implementation contract resolution
- Transaction history
- Token information (ERC20, ERC721, ERC1155)

### CORS Proxy Routes
All requests now share the single Etherscan v2 endpoint:

```
/api/etherscan/*    → https://api.etherscan.io/v2/api/*
```

## Migration Guide

If you're upgrading from the previous version:

1. **Update environment variables**
   ```bash
   # Only one explorer key required
   NEXT_PUBLIC_ETHERSCAN_API_KEY=your_key_here
   # Optional overrides
   NEXT_PUBLIC_ETHERSCAN_API_URL=https://api.etherscan.io/v2/api
   INFURA_API_KEY=your_infura_project_id
   ```

2. **Chain names may have changed**
   - Old: `bsc` → Still valid ✅
   - New chains available: `sepolia`, `holesky`, `arbitrumNova`, `baseSepolia`, etc.

3. **No per-chain API keys**
   - Etherscan v2 `chainid` parameter handles every supported network with the same key
   - Infura RPCs are preferred automatically when available

## Benefits

✅ **75+ blockchain networks** supported  
✅ **Unified API interface** across all chains  
✅ **Automatic failover** with multiple RPC endpoints  
✅ **CORS-safe** API proxying  
✅ **Type-safe** TypeScript configurations  
✅ **Free tier support** for most chains  
✅ **Future-proof** - easy to add new chains  

## Testing

To verify the integration:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test contract lookup on different chains
# Navigate to: http://localhost:3000/audit
# Enter a contract address and select different chains
```

## Troubleshooting

### API Rate Limits
If you encounter rate limit errors:
1. Check your API key is correctly set in `.env.local`
2. Consider upgrading to a paid tier for high-volume chains
3. Use multiple API keys for load distribution

### RPC Connection Issues
If RPC requests fail:
1. The system will automatically try fallback RPCs
2. Check the chain's RPC status on their official status page
3. Consider using a custom RPC endpoint in the chain config

### Missing API Keys
Some explorers require API keys even for basic queries:
1. Sign up for free API keys at the respective explorer
2. Add the key to `.env.local`
3. Restart the development server

## Contributing

To add a new chain:

1. Update `src/utils/constants.ts` with chain config
2. Add API key variable to `.env.local` (if needed)
3. Add rewrite rule to `next.config.ts` (if needed)
4. Update this documentation

## Resources

- [Etherscan v2 Documentation](https://docs.etherscan.io/)
- [Supported Chains List](./etherscan_v2.md)
- [Block Explorer APIs](https://docs.etherscan.io/api-endpoints)

## License

This update maintains the same license as the main project.

---

**Last Updated**: November 23, 2025  
**Etherscan v2 Version**: Latest  
**Total Chains Supported**: 75+
