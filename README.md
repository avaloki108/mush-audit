# `Mush Audit`
----------------------------------------

Mush Audit is an AI-powered smart contract security analysis platform that leverages multiple AI models to provide comprehensive security audits for blockchain contracts.

----------------------------------------

![image](https://github.com/user-attachments/assets/336fae3c-06af-4e09-a59a-3d815e1f0f53)

----------------------------------------


## Features

### 🛡️ Security Analysis
- Comprehensive vulnerability detection based on **2024-2025 exploit data**
- Smart contract security risk assessment
- Real-time security analysis
- **NEW:** ERC-4337 Account Abstraction vulnerabilities
- **NEW:** Layer 2/Rollup specific security checks
- **NEW:** DeFi 3.0 protocol risks (LSD, RWA, Restaking)
- **NEW:** MEV and PBS vulnerability detection
- **NEW:** Cross-chain bridge security analysis
- **NEW:** Zero-Knowledge proof implementation checks

### ⚡ Gas Optimization
- Transaction cost analysis
- Gas usage optimization suggestions
- Performance improvement recommendations

### 📊 AI-Powered Reports
- Detailed security audit reports
- Multiple AI models analysis
- Clear and actionable insights

### 🔄 Multi-Model Support
- OpenAI GPT (o1, GPT-4o, GPT-4 Turbo)
- Anthropic Claude (Claude 3.5 Sonnet, Opus, Haiku)
- Google Gemini (Gemini 2.0 Flash, Pro)
- xAI Grok (Grok 2)
- **NEW:** Groq (Fast inference with Llama 3.3, Mixtral, Gemma)
- **NEW:** Ollama (Local inference with Llama, Mistral, CodeLlama, and more)
- More models coming soon

### 🌐 Multi-Chain Support
- Ethereum
- Base
- Arbitrum
- Optimism
- BSC
- Polygon
- Avalanche-C
- Aurora
- More chains coming soon

### 🚀 Super Prompt
- Enhanced analysis capabilities
- Specialized security prompts
- Deeper security insights

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- (Optional) Ollama installed locally for local AI inference

### Installation
1. Clone the repository: 
   ```bash
   git clone https://github.com/mush-support/mush-audit
   ```
2. Navigate to the directory:
   ```bash
   cd mush-audit
   ```
3. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```
4. Create `.env.local` from `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
5. Fill in your API keys in `.env.local`:
   - At least one AI provider key (OpenAI, Claude, Gemini, xAI, or Groq)
   - For Ollama: Install from [ollama.ai](https://ollama.ai) and configure the URL
   - Blockchain explorer API keys for contract verification

6. Start the development server:
   ```bash
   bun dev
   # or
   npm run dev
   ```

### Using Ollama (Local AI)
1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a model:
   ```bash
   ollama pull llama3.3
   # or
   ollama pull codellama
   ```
3. Ollama runs on `http://localhost:11434` by default
4. Select "Ollama (Local)" as your AI provider in the app


## Usage

1. Visit the platform (http://localhost:3000 in development)
2. Configure your AI provider:
   - Click on AI Configuration
   - Select your preferred provider (GPT, Claude, Gemini, xAI, Groq, or Ollama)
   - Enter your API key or Ollama URL
   - Choose your preferred model
3. Input your smart contract address
4. Select the blockchain network
5. Get comprehensive security analysis with **2024-2025 vulnerability coverage**

### AI Provider Comparison

| Provider | Speed | Cost | Privacy | Best For |
|----------|-------|------|---------|----------|
| **Groq** | ⚡⚡⚡ Fastest | 💰 Free tier | ☁️ Cloud | Quick analysis, iteration |
| **Ollama** | ⚡⚡ Fast | 💰💰💰 Free | 🔒 100% Private | Sensitive contracts, offline |
| **OpenAI GPT** | ⚡ Standard | 💰💰 Moderate | ☁️ Cloud | General purpose, reliable |
| **Claude** | ⚡ Standard | 💰💰 Moderate | ☁️ Cloud | Complex logic, detailed analysis |
| **Gemini** | ⚡⚡ Fast | 💰 Free tier | ☁️ Cloud | Large codebases |
| **xAI Grok** | ⚡ Standard | 💰💰 Moderate | ☁️ Cloud | Latest AI capabilities |

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Multiple AI Models Integration

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE)

