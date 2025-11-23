# Quick Start: Etherscan v2 Integration

## 🚀 5-Minute Setup

### Step 1: Get Your API Keys (Optional but Recommended)

- **Etherscan v2** (one key for all supported chains)
  - Visit: https://etherscan.io/apis
  - Sign up and create a single API key
- **Infura RPC** (optional but faster/more reliable RPCs)
  - Visit: https://www.infura.io
  - Create a free project ID

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local and add your keys
nano .env.local  # or use your preferred editor
```

Add your keys:
```bash
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_key
# Optional overrides
NEXT_PUBLIC_ETHERSCAN_API_URL=https://api.etherscan.io/v2/api
INFURA_API_KEY=your_infura_project_id
```

### Step 3: Install & Run

```bash
# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

### Step 4: Test It Out

1. Open http://localhost:3000
2. Navigate to the Audit page
3. Enter a contract address (try `0x000000000022d473030f116ddee9f6b43ac78ba3`)
4. Select a chain from the dropdown
5. Click "Analyze" 

You should see the contract info load from the blockchain!

## 🎯 Popular Contracts to Test

Try these addresses on different chains:

### Ethereum Mainnet
- **Uniswap V3 Factory**: `0x1f98431c8ad98523631ae4a59f267346ea31f984`
- **USDC**: `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
- **Permit2**: `0x000000000022d473030f116ddee9f6b43ac78ba3`

### Base Mainnet
- **USDC on Base**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### Arbitrum One
- **USDC on Arbitrum**: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`

## 📊 Verify Your Setup

Run the verification script:
```bash
npm run verify-chains
```

This will:
- Test RPC connectivity for sample chains
- Show which chains have API keys configured
- List all 75+ supported chains

## 🔍 Troubleshooting

### "Failed to fetch contract source"
- Check if contract is verified on the block explorer
- Ensure you have an API key for that chain
- Verify API key is correctly set in `.env.local`

### "RPC connection failed"
- Try a different RPC endpoint (check `src/utils/constants.ts`)
- Some chains may have temporary RPC issues
- Check your internet connection

### "Rate limit exceeded"
- You're making too many requests
- Get an API key for higher limits
- Wait a minute and try again

## 🎓 Learn More

- **Full documentation**: See [ETHERSCAN_V2_UPDATE.md](./ETHERSCAN_V2_UPDATE.md)
- **Chain list**: See [etherscan_v2.md](./etherscan_v2.md)
- **Main README**: See [README.md](./README.md)

## 💡 Pro Tips

1. **Use API Keys**: Even free tier keys give you higher rate limits
2. **Test on Testnets First**: Sepolia and Holesky are great for testing
3. **Check Chain Status**: Some new chains may have unstable RPCs
4. **Use Fallback RPCs**: The system automatically tries fallback RPCs if primary fails
5. **Start Local**: Try Ollama for local AI inference - no API keys needed!

## ✨ What's Next?

Now that you're set up, you can:
- Audit contracts across 75+ chains
- Compare the same contract on different networks
- Use multiple AI providers for analysis
- Generate comprehensive security reports
- Export and share your findings

Happy auditing! 🛡️
