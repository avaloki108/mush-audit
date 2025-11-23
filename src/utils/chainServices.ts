import { CHAINS } from "./constants";

const ETHERSCAN_V2_API_URL =
  process.env.NEXT_PUBLIC_ETHERSCAN_API_URL ||
  "https://api.etherscan.io/v2/api";
const ETHERSCAN_API_KEY =
  process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";

const INFURA_RPC_MAP: Record<string, string> = {
  // Ethereum family
  ethereum: "https://mainnet.infura.io/v3/",
  sepolia: "https://sepolia.infura.io/v3/",
  hoodi: "https://hoodi.infura.io/v3/",

  // L2s and sidechains
  arbitrum: "https://arbitrum-mainnet.infura.io/v3/",
  arbitrumsepolia: "https://arbitrum-sepolia.infura.io/v3/",
  base: "https://base-mainnet.infura.io/v3/",
  basesepolia: "https://base-sepolia.infura.io/v3/",
  blast: "https://blast-mainnet.infura.io/v3/",
  blastsepolia: "https://blast-sepolia.infura.io/v3/",
  linea: "https://linea-mainnet.infura.io/v3/",
  lineasepolia: "https://linea-sepolia.infura.io/v3/",
  optimism: "https://optimism-mainnet.infura.io/v3/",
  optimismsepolia: "https://optimism-sepolia.infura.io/v3/",
  polygon: "https://polygon-mainnet.infura.io/v3/",
  polygonamoy: "https://polygon-amoy.infura.io/v3/",
  scroll: "https://scroll-mainnet.infura.io/v3/",
  scrollsepolia: "https://scroll-sepolia.infura.io/v3/",
  zksync: "https://zksync-mainnet.infura.io/v3/",
  zksyncsepolia: "https://zksync-sepolia.infura.io/v3/",

  // Alt L1s
  avalanche: "https://avalanche-mainnet.infura.io/v3/",
  avalanchefuji: "https://avalanche-fuji.infura.io/v3/",
  bsc: "https://bsc-mainnet.infura.io/v3/",
  bsctestnet: "https://bsc-testnet.infura.io/v3/",
  celo: "https://celo-mainnet.infura.io/v3/",
  mantle: "https://mantle-mainnet.infura.io/v3/",
  mantlesepolia: "https://mantle-sepolia.infura.io/v3/",
  opbnb: "https://opbnb-mainnet.infura.io/v3/",
  opbnbtestnet: "https://opbnb-testnet.infura.io/v3/",
  sei: "https://sei-mainnet.infura.io/v3/",
  seitestnet: "https://sei-testnet.infura.io/v3/",
  swellchain: "https://swellchain-mainnet.infura.io/v3/",
  swellchaintestnet: "https://swellchain-testnet.infura.io/v3/",
  unichain: "https://unichain-mainnet.infura.io/v3/",
  unichainsepolia: "https://unichain-sepolia.infura.io/v3/",
};

function findChainConfig(chain: string) {
  const normalized = chain.toLowerCase();
  const matchEntry = Object.entries(CHAINS).find(([key, c]) => {
    const keyNormalized = key.toLowerCase();
    return (
      keyNormalized === normalized ||
      c.name.toLowerCase() === normalized ||
      c.displayName.toLowerCase() === normalized ||
      c.id === chain ||
      c.id === normalized
    );
  });

  return matchEntry?.[1];
}

// Get chainId function
export function getChainId(chain: string): string | undefined {
  const chainConfig = findChainConfig(chain);
  return chainConfig?.id;
}

// Get RPC URL
export function getRpcUrl(chain: string): string {
  const chainConfig = findChainConfig(chain);
  if (!chainConfig) throw new Error(`Unsupported chain: ${chain}`);

  if (INFURA_API_KEY) {
    const normalizedName = chainConfig.name.toLowerCase();
    const infuraBase =
      INFURA_RPC_MAP[normalizedName] || INFURA_RPC_MAP[chainConfig.id];
    if (infuraBase) {
      return `${infuraBase}${INFURA_API_KEY}`;
    }
  }

  return chainConfig.rpcUrls.default;
}

// Get API Scan configuration
export function getApiScanConfig(chain: string): {
  url: string;
  apiKey: string;
  chainId: string;
} {
  const chainConfig = findChainConfig(chain);
  if (!chainConfig) throw new Error(`Unsupported chain: ${chain}`);
  const explorer = chainConfig.blockExplorers.default;

  return {
    url: ETHERSCAN_V2_API_URL || explorer.apiUrl,
    apiKey: ETHERSCAN_API_KEY || explorer.apiKey || "",
    chainId: chainConfig.id,
  };
}

// Get block explorer URL
export function getExplorerUrl(chain: string, address: string): string {
  const chainConfig = findChainConfig(chain);
  if (!chainConfig) return "#";
  return `${chainConfig.blockExplorers.default.url}/address/${address}`;
}

// Get block explorer URL for tokens
export function getExplorerTokenUrl(chain: string, address: string): string {
  const chainConfig = findChainConfig(chain);
  if (!chainConfig) return "#";
  return `${chainConfig.blockExplorers.default.url}/token/${address}`;
}

// Get AVAX C-Chain specific explorer URL for bytecode
export function getAVAXCExplorerBytecodeUrl(address: string): string {
  return `https://snowtrace.io/token/${address}/contract/code?chainid=43114`;
}

// Get Aurora specific explorer URL for bytecode
export function getAuroraExplorerBytecodeUrl(address: string): string {
  return `https://explorer.mainnet.aurora.dev/api/v2/smart-contracts/${address}`;
}
