// Add ChainConfig interface definition
interface ChainConfig {
  id: string;
  name: string;
  displayName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: string;
    fallbacks: string[];
  };
  blockExplorers: {
    default: {
      name: string;
      url: string;
      apiUrl: string;
      apiKey?: string;
    };
  };
}

export const CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    id: "1",
    name: "ethereum",
    displayName: "Ethereum Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://eth.llamarpc.com",
      fallbacks: [
        "https://ethereum.publicnode.com",
        "https://rpc.ankr.com/eth",
        "https://cloudflare-eth.com",
      ],
    },
    blockExplorers: {
      default: {
        name: "Etherscan",
        url: "https://etherscan.io",
        apiUrl: "https://api.etherscan.io/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  sepolia: {
    id: "11155111",
    name: "sepolia",
    displayName: "Sepolia Testnet",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://ethereum-sepolia-rpc.publicnode.com",
      fallbacks: ["https://rpc.sepolia.org", "https://rpc2.sepolia.org"],
    },
    blockExplorers: {
      default: {
        name: "Etherscan",
        url: "https://sepolia.etherscan.io",
        apiUrl: "https://api-sepolia.etherscan.io/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  holesky: {
    id: "17000",
    name: "holesky",
    displayName: "Holesky Testnet",
    nativeCurrency: {
      name: "Holesky Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://ethereum-holesky-rpc.publicnode.com",
      fallbacks: ["https://holesky.drpc.org"],
    },
    blockExplorers: {
      default: {
        name: "Etherscan",
        url: "https://holesky.etherscan.io",
        apiUrl: "https://api-holesky.etherscan.io/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  hoodi: {
    id: "560048",
    name: "hoodi",
    displayName: "Hoodi Testnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.hoodi.io",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Hoodscan",
        url: "https://hoodscan.io",
        apiUrl: "https://api.hoodscan.io/api",
      },
    },
  },
  abstract: {
    id: "2741",
    name: "abstract",
    displayName: "Abstract Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://api.abstract.xyz",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Abstractscan",
        url: "https://explorer.abstract.xyz",
        apiUrl: "https://api.explorer.abstract.xyz/api",
      },
    },
  },
  abstractSepolia: {
    id: "11124",
    name: "abstractSepolia",
    displayName: "Abstract Sepolia Testnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://api.testnet.abstract.xyz",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Abstractscan",
        url: "https://sepolia.explorer.abstract.xyz",
        apiUrl: "https://api.sepolia.explorer.abstract.xyz/api",
      },
    },
  },
  apechainCurtis: {
    id: "33111",
    name: "apechainCurtis",
    displayName: "ApeChain Curtis Testnet",
    nativeCurrency: {
      name: "ApeCoin",
      symbol: "APE",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://curtis.rpc.caldera.xyz/http",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "ApeChain Explorer",
        url: "https://curtis.explorer.caldera.xyz",
        apiUrl: "https://api.curtis.explorer.caldera.xyz/api",
      },
    },
  },
  apechain: {
    id: "33139",
    name: "apechain",
    displayName: "ApeChain Mainnet",
    nativeCurrency: {
      name: "ApeCoin",
      symbol: "APE",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://apechain.calderachain.xyz/http",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "ApeChain Explorer",
        url: "https://apechain.calderaexplorer.xyz",
        apiUrl: "https://api.apechain.calderaexplorer.xyz/api",
      },
    },
  },
  arbitrumNova: {
    id: "42170",
    name: "arbitrumNova",
    displayName: "Arbitrum Nova",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://nova.arbitrum.io/rpc",
      fallbacks: ["https://arbitrum-nova.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "Arbiscan",
        url: "https://nova.arbiscan.io",
        apiUrl: "https://api-nova.arbiscan.io/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  arbitrum: {
    id: "42161",
    name: "arbitrum",
    displayName: "Arbitrum One",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://arb1.arbitrum.io/rpc",
      fallbacks: [
        "https://arbitrum.publicnode.com",
        "https://arbitrum-one.publicnode.com",
        "https://arbitrum.meowrpc.com",
      ],
    },
    blockExplorers: {
      default: {
        name: "Arbiscan",
        url: "https://arbiscan.io",
        apiUrl: "https://api.arbiscan.io/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  arbitrumSepolia: {
    id: "421614",
    name: "arbitrumSepolia",
    displayName: "Arbitrum Sepolia",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://sepolia-rollup.arbitrum.io/rpc",
      fallbacks: ["https://arbitrum-sepolia.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "Arbiscan",
        url: "https://sepolia.arbiscan.io",
        apiUrl: "https://api-sepolia.arbiscan.io/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  avalanche: {
    id: "43114",
    name: "avalanche",
    displayName: "Avalanche C-Chain",
    nativeCurrency: {
      name: "AVAX",
      symbol: "AVAX",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://api.avax.network/ext/bc/C/rpc",
      fallbacks: [
        "https://avalanche.public-rpc.com",
        "https://avalanche.api.onfinality.io/public",
        "https://avalanche.publicnode.com",
      ],
    },
    blockExplorers: {
      default: {
        name: "SnowTrace",
        url: "https://snowtrace.io",
        apiUrl: "https://api.snowtrace.io/api",
      },
    },
  },
  avalancheFuji: {
    id: "43113",
    name: "avalancheFuji",
    displayName: "Avalanche Fuji Testnet",
    nativeCurrency: {
      name: "AVAX",
      symbol: "AVAX",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://api.avax-test.network/ext/bc/C/rpc",
      fallbacks: ["https://avalanche-fuji-c-chain-rpc.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "SnowTrace",
        url: "https://testnet.snowtrace.io",
        apiUrl: "https://api-testnet.snowtrace.io/api",
      },
    },
  },
  base: {
    id: "8453",
    name: "base",
    displayName: "Base Mainnet",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://mainnet.base.org",
      fallbacks: [
        "https://base.blockpi.network/v1/rpc/public",
        "https://base.meowrpc.com",
        "https://base.publicnode.com",
      ],
    },
    blockExplorers: {
      default: {
        name: "Basescan",
        url: "https://basescan.org",
        apiUrl: "https://api.basescan.org/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  baseSepolia: {
    id: "84532",
    name: "baseSepolia",
    displayName: "Base Sepolia Testnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://sepolia.base.org",
      fallbacks: ["https://base-sepolia-rpc.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "Basescan",
        url: "https://sepolia.basescan.org",
        apiUrl: "https://api-sepolia.basescan.org/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  berachainBepolia: {
    id: "80069",
    name: "berachainBepolia",
    displayName: "Berachain Bepolia Testnet",
    nativeCurrency: {
      name: "BERA",
      symbol: "BERA",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.berachain.com",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Beratrail",
        url: "https://artio.beratrail.io",
        apiUrl: "https://api.artio.beratrail.io/api",
      },
    },
  },
  berachain: {
    id: "80094",
    name: "berachain",
    displayName: "Berachain Mainnet",
    nativeCurrency: {
      name: "BERA",
      symbol: "BERA",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.berachain.com",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Beratrail",
        url: "https://beratrail.io",
        apiUrl: "https://api.beratrail.io/api",
      },
    },
  },
  bttc: {
    id: "199",
    name: "bttc",
    displayName: "BitTorrent Chain",
    nativeCurrency: {
      name: "BitTorrent",
      symbol: "BTT",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.bittorrentchain.io",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "BTTCScan",
        url: "https://bttcscan.com",
        apiUrl: "https://api.bttcscan.com/api",
      },
    },
  },
  bttcTestnet: {
    id: "1029",
    name: "bttcTestnet",
    displayName: "BitTorrent Chain Testnet",
    nativeCurrency: {
      name: "BitTorrent",
      symbol: "BTT",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://testrpc.bittorrentchain.io",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "BTTCScan",
        url: "https://testnet.bttcscan.com",
        apiUrl: "https://api-testnet.bttcscan.com/api",
      },
    },
  },
  blast: {
    id: "81457",
    name: "blast",
    displayName: "Blast Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.blast.io",
      fallbacks: ["https://blast.blockpi.network/v1/rpc/public"],
    },
    blockExplorers: {
      default: {
        name: "Blastscan",
        url: "https://blastscan.io",
        apiUrl: "https://api.blastscan.io/api",
      },
    },
  },
  blastSepolia: {
    id: "168587773",
    name: "blastSepolia",
    displayName: "Blast Sepolia Testnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://sepolia.blast.io",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Blastscan",
        url: "https://sepolia.blastscan.io",
        apiUrl: "https://api-sepolia.blastscan.io/api",
      },
    },
  },
  bsc: {
    id: "56",
    name: "bsc",
    displayName: "BNB Smart Chain",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://bsc-dataseed.binance.org",
      fallbacks: [
        "https://bsc-dataseed1.defibit.io",
        "https://bsc-dataseed1.ninicoin.io",
        "https://bsc.publicnode.com",
      ],
    },
    blockExplorers: {
      default: {
        name: "BscScan",
        url: "https://bscscan.com",
        apiUrl: "https://api.bscscan.com/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  bscTestnet: {
    id: "97",
    name: "bscTestnet",
    displayName: "BNB Smart Chain Testnet",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://data-seed-prebsc-1-s1.binance.org:8545",
      fallbacks: ["https://bsc-testnet-rpc.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "BscScan",
        url: "https://testnet.bscscan.com",
        apiUrl: "https://api-testnet.bscscan.com/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  celo: {
    id: "42220",
    name: "celo",
    displayName: "Celo Mainnet",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://forno.celo.org",
      fallbacks: ["https://celo.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "Celoscan",
        url: "https://celoscan.io",
        apiUrl: "https://api.celoscan.io/api",
      },
    },
  },
  celoSepolia: {
    id: "11142220",
    name: "celoSepolia",
    displayName: "Celo Sepolia Testnet",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://alfajores-forno.celo-testnet.org",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Celoscan",
        url: "https://sepolia.celoscan.io",
        apiUrl: "https://api-sepolia.celoscan.io/api",
      },
    },
  },
  fraxtal: {
    id: "252",
    name: "fraxtal",
    displayName: "Fraxtal Mainnet",
    nativeCurrency: {
      name: "Frax Ether",
      symbol: "frxETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.frax.com",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Fraxscan",
        url: "https://fraxscan.com",
        apiUrl: "https://api.fraxscan.com/api",
      },
    },
  },
  fraxtalHoodi: {
    id: "2523",
    name: "fraxtalHoodi",
    displayName: "Fraxtal Hoodi Testnet",
    nativeCurrency: {
      name: "Frax Ether",
      symbol: "frxETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.testnet.frax.com",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Fraxscan",
        url: "https://holesky.fraxscan.com",
        apiUrl: "https://api-holesky.fraxscan.com/api",
      },
    },
  },
  gnosis: {
    id: "100",
    name: "gnosis",
    displayName: "Gnosis Chain",
    nativeCurrency: {
      name: "xDAI",
      symbol: "xDAI",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.gnosischain.com",
      fallbacks: ["https://gnosis-rpc.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "Gnosisscan",
        url: "https://gnosisscan.io",
        apiUrl: "https://api.gnosisscan.io/api",
      },
    },
  },
  hyperevm: {
    id: "999",
    name: "hyperevm",
    displayName: "HyperEVM Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.hyperevm.com",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "HyperEVM Explorer",
        url: "https://explorer.hyperevm.com",
        apiUrl: "https://api.explorer.hyperevm.com/api",
      },
    },
  },
  katanaBokuto: {
    id: "737373",
    name: "katanaBokuto",
    displayName: "Katana Bokuto",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.bokuto.katana.network",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Katana Explorer",
        url: "https://explorer.bokuto.katana.network",
        apiUrl: "https://api.explorer.bokuto.katana.network/api",
      },
    },
  },
  katana: {
    id: "747474",
    name: "katana",
    displayName: "Katana Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.katana.network",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Katana Explorer",
        url: "https://explorer.katana.network",
        apiUrl: "https://api.explorer.katana.network/api",
      },
    },
  },
  linea: {
    id: "59144",
    name: "linea",
    displayName: "Linea Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.linea.build",
      fallbacks: ["https://linea.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "Lineascan",
        url: "https://lineascan.build",
        apiUrl: "https://api.lineascan.build/api",
      },
    },
  },
  lineaSepolia: {
    id: "59141",
    name: "lineaSepolia",
    displayName: "Linea Sepolia",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.sepolia.linea.build",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Lineascan",
        url: "https://sepolia.lineascan.build",
        apiUrl: "https://api-sepolia.lineascan.build/api",
      },
    },
  },
  mantle: {
    id: "5000",
    name: "mantle",
    displayName: "Mantle Mainnet",
    nativeCurrency: {
      name: "MNT",
      symbol: "MNT",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.mantle.xyz",
      fallbacks: ["https://mantle-rpc.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "Mantlescan",
        url: "https://mantlescan.xyz",
        apiUrl: "https://api.mantlescan.xyz/api",
      },
    },
  },
  mantleSepolia: {
    id: "5003",
    name: "mantleSepolia",
    displayName: "Mantle Sepolia",
    nativeCurrency: {
      name: "MNT",
      symbol: "MNT",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.sepolia.mantle.xyz",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Mantlescan",
        url: "https://sepolia.mantlescan.xyz",
        apiUrl: "https://api-sepolia.mantlescan.xyz/api",
      },
    },
  },
  memecoreTestnet: {
    id: "43521",
    name: "memecoreTestnet",
    displayName: "Memecore Testnet",
    nativeCurrency: {
      name: "MEME",
      symbol: "MEME",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.testnet.memecore.com",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Memecore Explorer",
        url: "https://explorer.testnet.memecore.com",
        apiUrl: "https://api.explorer.testnet.memecore.com/api",
      },
    },
  },
  monadTestnet: {
    id: "10143",
    name: "monadTestnet",
    displayName: "Monad Testnet",
    nativeCurrency: {
      name: "MON",
      symbol: "MON",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.testnet.monad.xyz",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Monad Explorer",
        url: "https://explorer.testnet.monad.xyz",
        apiUrl: "https://api.explorer.testnet.monad.xyz/api",
      },
    },
  },
  moonbaseAlpha: {
    id: "1287",
    name: "moonbaseAlpha",
    displayName: "Moonbase Alpha",
    nativeCurrency: {
      name: "DEV",
      symbol: "DEV",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.api.moonbase.moonbeam.network",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Moonscan",
        url: "https://moonbase.moonscan.io",
        apiUrl: "https://api-moonbase.moonscan.io/api",
      },
    },
  },
  moonbeam: {
    id: "1284",
    name: "moonbeam",
    displayName: "Moonbeam",
    nativeCurrency: {
      name: "GLMR",
      symbol: "GLMR",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.api.moonbeam.network",
      fallbacks: ["https://moonbeam.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "Moonscan",
        url: "https://moonscan.io",
        apiUrl: "https://api-moonbeam.moonscan.io/api",
      },
    },
  },
  moonriver: {
    id: "1285",
    name: "moonriver",
    displayName: "Moonriver",
    nativeCurrency: {
      name: "MOVR",
      symbol: "MOVR",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.api.moonriver.moonbeam.network",
      fallbacks: ["https://moonriver.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "Moonscan",
        url: "https://moonriver.moonscan.io",
        apiUrl: "https://api-moonriver.moonscan.io/api",
      },
    },
  },
  optimism: {
    id: "10",
    name: "optimism",
    displayName: "OP Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://mainnet.optimism.io",
      fallbacks: [
        "https://optimism.publicnode.com",
        "https://optimism.meowrpc.com",
        "https://opt-mainnet.g.alchemy.com/v2/demo",
      ],
    },
    blockExplorers: {
      default: {
        name: "Optimistic Etherscan",
        url: "https://optimistic.etherscan.io",
        apiUrl: "https://api-optimistic.etherscan.io/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  optimismSepolia: {
    id: "11155420",
    name: "optimismSepolia",
    displayName: "OP Sepolia",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://sepolia.optimism.io",
      fallbacks: ["https://optimism-sepolia.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "Optimistic Etherscan",
        url: "https://sepolia-optimism.etherscan.io",
        apiUrl: "https://api-sepolia-optimistic.etherscan.io/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  opbnb: {
    id: "204",
    name: "opbnb",
    displayName: "opBNB Mainnet",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://opbnb-mainnet-rpc.bnbchain.org",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "opBNBScan",
        url: "https://opbnbscan.com",
        apiUrl: "https://api-opbnb.bscscan.com/api",
      },
    },
  },
  opbnbTestnet: {
    id: "5611",
    name: "opbnbTestnet",
    displayName: "opBNB Testnet",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://opbnb-testnet-rpc.bnbchain.org",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "opBNBScan",
        url: "https://testnet.opbnbscan.com",
        apiUrl: "https://api-opbnb-testnet.bscscan.com/api",
      },
    },
  },
  polygonAmoy: {
    id: "80002",
    name: "polygonAmoy",
    displayName: "Polygon Amoy Testnet",
    nativeCurrency: {
      name: "POL",
      symbol: "POL",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc-amoy.polygon.technology",
      fallbacks: ["https://polygon-amoy.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "PolygonScan",
        url: "https://amoy.polygonscan.com",
        apiUrl: "https://api-amoy.polygonscan.com/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  polygon: {
    id: "137",
    name: "polygon",
    displayName: "Polygon Mainnet",
    nativeCurrency: {
      name: "POL",
      symbol: "POL",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://polygon-rpc.com",
      fallbacks: [
        "https://polygon.llamarpc.com",
        "https://polygon.publicnode.com",
        "https://polygon.meowrpc.com",
      ],
    },
    blockExplorers: {
      default: {
        name: "PolygonScan",
        url: "https://polygonscan.com",
        apiUrl: "https://api.polygonscan.com/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  scroll: {
    id: "534352",
    name: "scroll",
    displayName: "Scroll Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.scroll.io",
      fallbacks: ["https://scroll.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "Scrollscan",
        url: "https://scrollscan.com",
        apiUrl: "https://api.scrollscan.com/api",
      },
    },
  },
  scrollSepolia: {
    id: "534351",
    name: "scrollSepolia",
    displayName: "Scroll Sepolia",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://sepolia-rpc.scroll.io",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Scrollscan",
        url: "https://sepolia.scrollscan.com",
        apiUrl: "https://api-sepolia.scrollscan.com/api",
      },
    },
  },
  sei: {
    id: "1329",
    name: "sei",
    displayName: "Sei Mainnet",
    nativeCurrency: {
      name: "SEI",
      symbol: "SEI",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://evm-rpc.sei-apis.com",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Seitrace",
        url: "https://seitrace.com",
        apiUrl: "https://seitrace.com/api",
      },
    },
  },
  seiTestnet: {
    id: "1328",
    name: "seiTestnet",
    displayName: "Sei Testnet",
    nativeCurrency: {
      name: "SEI",
      symbol: "SEI",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://evm-rpc-testnet.sei-apis.com",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Seitrace",
        url: "https://seitrace.com/?chain=atlantic-2",
        apiUrl: "https://seitrace.com/api",
      },
    },
  },
  sonic: {
    id: "146",
    name: "sonic",
    displayName: "Sonic Mainnet",
    nativeCurrency: {
      name: "Sonic",
      symbol: "S",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.soniclabs.com",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Sonicscan",
        url: "https://sonicscan.org",
        apiUrl: "https://api.sonicscan.org/api",
      },
    },
  },
  sonicTestnet: {
    id: "14601",
    name: "sonicTestnet",
    displayName: "Sonic Testnet",
    nativeCurrency: {
      name: "Sonic",
      symbol: "S",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.testnet.soniclabs.com",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Sonicscan",
        url: "https://testnet.sonicscan.org",
        apiUrl: "https://api-testnet.sonicscan.org/api",
      },
    },
  },
  stableTestnet: {
    id: "2201",
    name: "stableTestnet",
    displayName: "Stable Testnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.testnet.stable.com",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Stable Explorer",
        url: "https://explorer.testnet.stable.com",
        apiUrl: "https://api.explorer.testnet.stable.com/api",
      },
    },
  },
  swellchain: {
    id: "1923",
    name: "swellchain",
    displayName: "Swellchain Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.swell.network",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Swellscan",
        url: "https://explorer.swell.network",
        apiUrl: "https://api.explorer.swell.network/api",
      },
    },
  },
  swellchainTestnet: {
    id: "1924",
    name: "swellchainTestnet",
    displayName: "Swellchain Testnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.testnet.swell.network",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Swellscan",
        url: "https://explorer.testnet.swell.network",
        apiUrl: "https://api.explorer.testnet.swell.network/api",
      },
    },
  },
  taikoHoodi: {
    id: "167013",
    name: "taikoHoodi",
    displayName: "Taiko Hoodi",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.holesky.taiko.xyz",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Taikoscan",
        url: "https://holesky.taikoscan.io",
        apiUrl: "https://api-holesky.taikoscan.io/api",
      },
    },
  },
  taiko: {
    id: "167000",
    name: "taiko",
    displayName: "Taiko Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.taiko.xyz",
      fallbacks: ["https://taiko.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "Taikoscan",
        url: "https://taikoscan.io",
        apiUrl: "https://api.taikoscan.io/api",
      },
    },
  },
  unichain: {
    id: "130",
    name: "unichain",
    displayName: "Unichain Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.unichain.org",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Uniscan",
        url: "https://uniscan.xyz",
        apiUrl: "https://api.uniscan.xyz/api",
      },
    },
  },
  unichainSepolia: {
    id: "1301",
    name: "unichainSepolia",
    displayName: "Unichain Sepolia",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://sepolia.unichain.org",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Uniscan",
        url: "https://sepolia.uniscan.xyz",
        apiUrl: "https://api-sepolia.uniscan.xyz/api",
      },
    },
  },
  world: {
    id: "480",
    name: "world",
    displayName: "World Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://rpc.worldchain.io",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Worldscan",
        url: "https://worldscan.org",
        apiUrl: "https://api.worldscan.org/api",
      },
    },
  },
  worldSepolia: {
    id: "4801",
    name: "worldSepolia",
    displayName: "World Sepolia",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://sepolia.worldchain.io",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "Worldscan",
        url: "https://sepolia.worldscan.org",
        apiUrl: "https://api-sepolia.worldscan.org/api",
      },
    },
  },
  xdcApothem: {
    id: "51",
    name: "xdcApothem",
    displayName: "XDC Apothem Testnet",
    nativeCurrency: {
      name: "XDC",
      symbol: "XDC",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://erpc.apothem.network",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "XDC Explorer",
        url: "https://explorer.apothem.network",
        apiUrl: "https://explorer.apothem.network/api",
      },
    },
  },
  xdc: {
    id: "50",
    name: "xdc",
    displayName: "XDC Mainnet",
    nativeCurrency: {
      name: "XDC",
      symbol: "XDC",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://erpc.xinfin.network",
      fallbacks: ["https://rpc.xinfin.network"],
    },
    blockExplorers: {
      default: {
        name: "XDC Explorer",
        url: "https://explorer.xinfin.network",
        apiUrl: "https://explorer.xinfin.network/api",
      },
    },
  },
  zksync: {
    id: "324",
    name: "zksync",
    displayName: "zkSync Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://mainnet.era.zksync.io",
      fallbacks: ["https://zksync.publicnode.com"],
    },
    blockExplorers: {
      default: {
        name: "zkSync Explorer",
        url: "https://explorer.zksync.io",
        apiUrl: "https://block-explorer-api.mainnet.zksync.io/api",
      },
    },
  },
  zksyncSepolia: {
    id: "300",
    name: "zksyncSepolia",
    displayName: "zkSync Sepolia",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://sepolia.era.zksync.dev",
      fallbacks: [],
    },
    blockExplorers: {
      default: {
        name: "zkSync Explorer",
        url: "https://sepolia.explorer.zksync.io",
        apiUrl: "https://block-explorer-api.sepolia.zksync.dev/api",
      },
    },
  },
  aurora: {
    id: "1313161554",
    name: "aurora",
    displayName: "Aurora",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://mainnet.aurora.dev",
      fallbacks: [
        "https://aurora.drpc.org",
        "https://endpoints.omniatech.io/v1/aurora/mainnet/public",
        "https://1rpc.io/aurora",
      ],
    },
    blockExplorers: {
      default: {
        name: "Aurora Explorer",
        url: "https://explorer.aurora.dev",
        apiUrl: "https://explorer.aurora.dev/api",
      },
    },
  },
} as const;

export const KNOWN_CONTRACTS: Record<
  string,
  { labels: string[]; projectName: string }
> = {
  // Uniswap Protocol Contracts
  "0x000000000022d473030f116ddee9f6b43ac78ba3": {
    labels: ["Permit2"],
    projectName: "Uniswap Protocol",
  },
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": {
    labels: ["Universal Router"],
    projectName: "Uniswap Protocol",
  },
  "0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b": {
    labels: ["Universal Router"],
    projectName: "Uniswap Protocol",
  },
  "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad": {
    labels: ["Universal Router 2"],
    projectName: "Uniswap Protocol",
  },
  "0x1f98431c8ad98523631ae4a59f267346ea31f984": {
    labels: ["Factory"],
    projectName: "Uniswap V3",
  },
  "0xe592427a0aece92de3edee1f18e0157c05861564": {
    labels: ["Router"],
    projectName: "Uniswap V3",
  },

  // OpenSea Contracts
  "0x00000000006c3852cbef3e08e8df289169ede581": {
    labels: ["Seaport 1.1"],
    projectName: "OpenSea",
  },
  "0x00000000000006c7676171937c444f6bde3d6282": {
    labels: ["Seaport 1.5"],
    projectName: "OpenSea",
  },

  // Chainlink Contracts
  "0x47fb2585d2c56fe188d0e6ec628a38b74fceeedf": {
    labels: ["Price Feed"],
    projectName: "Chainlink",
  },
  "0xc18f85a6dd3bcd0516a1ca08d3b1f0a4e191c2c2": {
    labels: ["Validator"],
    projectName: "Chainlink",
  },

  // AAVE Contracts
  "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2": {
    labels: ["Pool V3"],
    projectName: "AAVE",
  },
  "0x2f39d218133afab8f2b819b1066c7e434ad94e9e": {
    labels: ["Pool Proxy"],
    projectName: "AAVE",
  },

  // Lido Contracts
  "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": {
    labels: ["stETH"],
    projectName: "Lido",
  },
  "0x1982b2f5814301d4e9a8b0201555376e62f82428": {
    labels: ["Staking Router"],
    projectName: "Lido",
  },

  // Compound Contracts
  "0xc0da01a04c3f3e0be433606045bb7017a7323e38": {
    labels: ["Timelock"],
    projectName: "Compound",
  },
  "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b": {
    labels: ["Comptroller"],
    projectName: "Compound",
  },

  // 1inch Contracts
  "0x1111111254eeb25477b68fb85ed929f73a960582": {
    labels: ["Router"],
    projectName: "1inch",
  },
  "0x1111111254760f7ab3f16433eea9304126dcd199": {
    labels: ["Aggregation Router V5"],
    projectName: "1inch",
  },

  // Curve Contracts
  "0xd51a44d3fae010294c616388b506acda1bfaae46": {
    labels: ["Tricrypto2 Pool"],
    projectName: "Curve",
  },
  "0xbabe61887f1de2713c6f97e567623453d3c79f67": {
    labels: ["Factory"],
    projectName: "Curve",
  },

  // Balancer Contracts
  "0xba12222222228d8ba445958a75a0704d566bf2c8": {
    labels: ["Vault"],
    projectName: "Balancer",
  },
  "0x4e7bbd911cf1efa442bc1b2e9ea01ffe785412ec": {
    labels: ["Gauge Factory"],
    projectName: "Balancer",
  },

  // ENS Contracts
  "0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e": {
    labels: ["Registry"],
    projectName: "ENS",
  },
  "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85": {
    labels: ["Base Registrar"],
    projectName: "ENS",
  },

  // orbitchain
  "0x1bf68a9d1eaee7826b3593c20a0ca93293cb489a": {
    labels: ["ETH Vault"],
    projectName: "OrbitChain",
  },
};

// Change to your own domain
export const WEBSITE_URL = "mush-audit.vercel.app";
