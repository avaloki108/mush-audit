# Multi-Language Support in Mush Audit

Mush Audit now supports security auditing for multiple blockchain programming languages, allowing you to analyze smart contracts and programs across different ecosystems.

## Supported Languages

### 1. Solidity (EVM-Compatible Chains)

**File Extension:** `.sol`

**Supported Ecosystems:**
- Ethereum (Mainnet and all testnets)
- Monad (High-performance EVM Layer 1)
- Layer 2s: Arbitrum, Optimism, Base, zkSync, Scroll, Linea
- Sidechains: Polygon, BSC, Gnosis, Avalanche C-Chain
- And 75+ other EVM-compatible chains

**Security Checks:**
- Reentrancy vulnerabilities
- Access control issues
- Oracle manipulation
- Flash loan attacks
- Integer overflow/underflow
- Gas optimization
- DeFi-specific exploits
- And 100+ more vulnerability patterns

### 2. Rust (Solana & Substrate)

**File Extension:** `.rs`

**Supported Ecosystems:**
- Solana (Programs and SPL tokens)
- Near Protocol
- Polkadot (Substrate-based chains)

**Solana-Specific Security Checks:**
- **Account Validation:**
  - Missing owner checks
  - Missing signer checks
  - PDA (Program Derived Address) validation
  - Account discriminator checks
  - Account type confusion
  
- **Cross-Program Invocation (CPI):**
  - Unchecked program IDs
  - CPI privilege escalation
  - Reentrancy through CPI
  
- **Anchor Framework:**
  - Missing `#[account]` constraints
  - Incorrect use of `has_one`, `constraint`, `seeds`, `bump`
  - Account initialization issues
  
- **Token Program:**
  - Token account owner validation
  - Token mint verification
  - Authority checks
  
- **Compute Budget:**
  - Unbounded loops
  - Excessive compute unit consumption
  - Algorithm optimization

### 3. Vyper (Python-based EVM)

**File Extension:** `.vy`

**Supported Ecosystems:**
- Ethereum
- All EVM-compatible chains

**Security Checks:**
- Same EVM security checks as Solidity
- Vyper-specific patterns and idioms

### 4. Move (Resource-Oriented)

**File Extension:** `.move`

**Supported Ecosystems:**
- Aptos
- Sui

**Status:** Basic support (enhanced checks coming soon)

### 5. Cairo (ZK-Rollup)

**File Extension:** `.cairo`

**Supported Ecosystems:**
- StarkNet

**Status:** Basic support (enhanced checks coming soon)

## Special Focus: Monad

Monad is a high-performance, Ethereum-compatible Layer 1 blockchain with unique characteristics:

### What is Monad?

- **Smart Contract Language:** Solidity (100% EVM-compatible at bytecode level)
- **Implementation:** Custom C++ execution engine for high performance
- **Throughput:** Up to 10,000 TPS
- **Compatibility:** Full Ethereum compatibility (same tools, libraries, ABIs)
- **Key Feature:** Parallel execution for improved performance

### Monad-Specific Audit Considerations

When analyzing contracts for Monad deployment, Mush Audit provides:

1. **Standard EVM Security:** All Solidity vulnerabilities remain relevant
2. **Performance Optimizations:** 
   - State access pattern analysis
   - Gas optimization (more critical in high-throughput environments)
   - Recommendations for concurrent execution
3. **Parallel Execution Considerations:**
   - Transaction dependency analysis
   - Shared state minimization
   - Batch operation suggestions

### How to Audit for Monad

Simply upload your Solidity contract and:
- Include "monad" in the chain name field, OR
- The system will automatically apply Monad-specific checks when detected

## Language Detection

Mush Audit automatically detects the programming language using:

1. **File Extension Analysis:** Primary detection method
2. **Content Heuristics:** Fallback detection using language-specific keywords
3. **Multi-File Projects:** Determines the primary language from file set

### Detection Examples

```solidity
// Detected as: Solidity
pragma solidity ^0.8.0;
contract MyContract { ... }
```

```rust
// Detected as: Rust (Solana)
use solana_program::*;
#[program]
pub mod my_program { ... }
```

```python
# Detected as: Vyper
# @version ^0.3.0
@external
def my_function(): ...
```

## How It Works

### 1. Upload Your Contract

- Single file or multiple files
- Automatic filtering of libraries and test files
- Language-agnostic file processing

### 2. Language Detection

```typescript
// Automatically detects language from:
const language = detectPrimaryLanguage(files);
// Returns: 'solidity' | 'rust' | 'vyper' | 'move' | 'cairo'
```

### 3. Specialized Analysis

Each language gets:
- **Custom audit prompts** tailored to the language
- **Language-specific vulnerability patterns**
- **Ecosystem-specific security checks**

### 4. Detailed Report

The audit report includes:
- Detected language indicator
- Language-specific findings
- Ecosystem-appropriate recommendations
- Code examples in the native language

## File Filtering

Mush Audit intelligently filters out third-party libraries:

### Solidity/EVM
- OpenZeppelin contracts
- Solmate, Solady
- Forge-std, Hardhat
- Node modules

### Rust/Solana
- Anchor framework dependencies
- Solana program library
- Target directory (build output)
- Test files

## Best Practices

### For Solidity Contracts
1. Upload all contract files in the project
2. System will automatically filter libraries
3. Include proxy and implementation if applicable

### For Rust/Solana Programs
1. Upload `.rs` files from `src/` or `programs/`
2. Include `lib.rs` and relevant module files
3. Avoid uploading test files or dependencies

### For Multi-Language Projects
Currently, analyze each language separately. Cross-language bridge auditing is planned for future updates.

## Limitations

- **Static Analysis Only:** Runtime behavior not analyzed
- **Language Support:** Move and Cairo have basic support (enhanced checks coming soon)
- **Cross-Language:** Cannot analyze multi-language projects in a single audit
- **Library Detection:** Some custom libraries may not be filtered

## Roadmap

### Coming Soon
- Enhanced Move language support with Aptos/Sui-specific checks
- Cairo language support with StarkNet-specific patterns
- Cross-language bridge security analysis
- Formal verification integration for supported languages
- Language-specific test generation

### Under Consideration
- Huff (low-level EVM)
- Yul (Solidity intermediate language)
- Michelson (Tezos)
- WASM-based languages (Ink!, AssemblyScript)

## Examples

### Example 1: Auditing a Solidity Contract

```bash
# Upload MyToken.sol
# System detects: Solidity
# Applies: Full EVM security analysis + DeFi patterns
```

### Example 2: Auditing a Solana Program

```bash
# Upload lib.rs
# System detects: Rust (Solana)
# Applies: PDA checks, CPI security, Anchor constraints, etc.
```

### Example 3: Auditing for Monad

```bash
# Upload MyContract.sol
# Chain: "Monad Testnet"
# System detects: Solidity (Monad)
# Applies: EVM security + parallel execution optimizations
```

## Technical Details

### Language Detection Module

Located at: `src/utils/languageDetection.ts`

Key functions:
- `detectLanguage(file)` - Detect language from a single file
- `detectPrimaryLanguage(files)` - Detect primary language from file set
- `isEvmCompatible(language)` - Check if language is EVM-compatible

### Language-Specific Prompts

Located at: `src/services/audit/languagePrompts.ts`

Specialized prompts for:
- Rust/Solana security auditing
- Monad-specific EVM optimization
- (More languages coming soon)

### File Filtering

Located at: `src/utils/contractFilters.ts`

Features:
- Multi-language file priorities
- Language-aware import removal
- Third-party library filtering

## Contributing

We welcome contributions to expand language support:

1. Add new language definitions in `languageDetection.ts`
2. Create specialized audit prompts in `languagePrompts.ts`
3. Update file filters in `contractFilters.ts`
4. Add language-specific vulnerability patterns
5. Update documentation

## Support

For questions or issues with multi-language support:
- Open an issue on GitHub
- Include: language, file type, and specific problem
- Attach sample code (non-sensitive) if possible

---

**Note:** Mush Audit is continuously evolving. Language support and security checks are regularly updated based on the latest vulnerability research and ecosystem developments.
