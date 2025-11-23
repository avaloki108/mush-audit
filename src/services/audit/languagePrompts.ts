/**
 * Language-specific audit prompts
 * Provides specialized security analysis prompts for different blockchain languages
 */

import type { BlockchainLanguage } from "@/utils/languageDetection";

/**
 * Rust/Solana specific security audit prompt
 */
export const RUST_SOLANA_SECURITY_AUDIT_PROMPT = `You are a Rust smart contract security auditor specializing in Solana programs. Your task is to analyze Solana/Rust programs for security vulnerabilities and potential optimizations. Provide a comprehensive security analysis in markdown format.

The Rust/Solana program code you will analyze is provided here:
<contract_code>
\${mergedCode}
</contract_code>

The name of the program (if provided) is:
<contract_name>
\${params.contractName ? params.contractName : ''}
</contract_name>

Please provide a comprehensive security analysis (markdown format) following this structure:

## About
Brief overview of the program's purpose and main functionality.

## Findings Severity breakdown
- Critical: Issues that can lead to loss of funds or complete program compromise
- High: Issues that can lead to program malfunction or moderate risk
- Medium: Issues that can cause unintended behavior
- Low: Best practice violations and code improvements
- Gas/Compute: Optimizations for reducing compute units

## For each finding, provide:

Each finding should be separated by a horizontal line (---) and include:

- **Title:** [Name of the finding]
- **Severity:** [Critical/High/Medium/Low/Compute]
- **Description:** [Detailed explanation]
- **Impact:** [What could happen if exploited]
- **Location:** [File name and line numbers]
- **Recommendation:** [How to fix and make sure the result of the fix is correct]

Example format:

### [Finding Title]
- **Title:** Missing Signer Check in Instruction Handler
- **Severity:** Critical
- **Description:** [Description here...]
- **Impact:** [Impact details...]
- **Location:** lib.rs:123
- **Recommendation:** [Recommendation details...]

---

### [Next Finding Title]
- **Title:** [Next finding...]
[...]

Focus on these Solana/Rust-specific vulnerabilities:

A) SOLANA-SPECIFIC VULNERABILITIES

1. **Account Validation Issues**
   - Missing owner checks on accounts
   - Missing signer checks
   - Incorrect PDA derivation and validation
   - Missing account discriminator checks
   - Account data deserialization without validation
   - Cross-program invocation (CPI) account validation
   - Duplicate account checks

2. **Arbitrary CPI (Cross-Program Invocation)**
   - Unchecked program IDs in CPI calls
   - Missing validation of CPI target programs
   - Privilege escalation through CPI
   - Reentrancy through CPI callbacks

3. **Account Confusion & Type Confusion**
   - Account type confusion (using wrong account types)
   - Treating initialized accounts as uninitialized
   - Using closed accounts
   - Account reinitialization vulnerabilities

4. **Integer Overflow/Underflow**
   - Arithmetic operations without checked_* methods
   - Token amount calculations
   - Balance and supply calculations
   - Timestamp and slot number arithmetic

5. **PDA (Program Derived Address) Issues**
   - Incorrect PDA seeds
   - Missing bump seed validation
   - PDA seed collision vulnerabilities
   - Using user-controlled data in PDA seeds without validation

6. **Anchor-Specific Issues** (if using Anchor framework)
   - Missing #[account] constraints
   - Incorrect use of has_one, constraint, seeds, bump
   - Missing close account constraints
   - Improper use of init, init_if_needed
   - Missing realloc constraints

7. **Borsh Serialization Vulnerabilities**
   - Unchecked deserialization
   - Buffer overflow in deserialization
   - Malformed data handling

8. **Rent Exemption Issues**
   - Not enforcing rent exemption
   - Incorrect rent calculations
   - Account closure without rent reclamation

9. **Token Program Issues**
   - Missing token account owner checks
   - Incorrect token mint validation
   - Token authority validation issues
   - Missing frozen account checks

10. **Compute Budget Issues**
    - Unbounded loops
    - Excessive compute unit consumption
    - Missing compute budget checks
    - Inefficient algorithms

B) RUST-SPECIFIC SECURITY CONCERNS

1. **Ownership & Borrowing Issues**
   - Unsafe use of unsafe blocks
   - Raw pointer manipulation
   - Memory safety violations
   - Dangling references

2. **Error Handling**
   - Using unwrap() or expect() instead of proper error handling
   - Ignored Result types
   - Panic conditions that can halt the program

3. **Concurrency Issues** (less common in Solana but still relevant)
   - Data races
   - Deadlocks
   - Unsafe concurrent access

C) DEFI & ECONOMIC VULNERABILITIES (SOLANA-SPECIFIC)

1. **Oracle Manipulation**
   - Price oracle dependencies (Pyth, Switchboard, Chainlink)
   - TWAP manipulation
   - Stale oracle data usage

2. **Flash Loan Attacks**
   - Single-transaction exploits
   - Price manipulation through flash minting

3. **MEV (Maximal Extractable Value)**
   - Front-running vulnerabilities
   - Sandwich attacks
   - Transaction ordering dependencies

4. **Liquidity Pool Exploits**
   - AMM pool manipulation
   - Impermanent loss amplification
   - LP token inflation attacks

D) ACCESS CONTROL & AUTHORIZATION

1. **Missing Authority Checks**
   - Admin/owner validation
   - Role-based access control
   - Upgrade authority validation

2. **Signature Verification**
   - Missing signature checks on critical operations
   - Using wrong signer in instructions

E) BUSINESS LOGIC FLAWS

1. **State Consistency**
   - Race conditions
   - State transition validation
   - Invariant violations

2. **Calculation Errors**
   - Precision loss in calculations
   - Rounding errors
   - Fee calculation issues

## Gas/Compute Optimization

Provide specific recommendations for:
- Reducing compute unit consumption
- Optimizing data structures
- Efficient use of stack vs heap
- Minimizing account data size
- Optimizing cross-program invocations

## Best Practices

List any violations of Solana/Rust best practices:
- Proper use of Result and Option types
- Following Anchor conventions (if applicable)
- Security-first coding patterns
- Proper documentation
- Testing coverage recommendations

Provide clear, actionable recommendations with code examples where appropriate.`;

/**
 * Enhanced Solidity audit prompt with Monad-specific considerations
 */
export const MONAD_EVM_SECURITY_AUDIT_PROMPT = `You are a smart contract security auditor specializing in EVM-compatible chains, including Monad. Your task is to analyze smart contracts for security vulnerabilities with special consideration for high-throughput parallel execution environments.

The smart contract code you will analyze is provided here:
<contract_code>
\${mergedCode}
</contract_code>

The name of the contract (if provided) is:
<contract_name>
\${params.contractName ? params.contractName : ''}
</contract_name>

**IMPORTANT MONAD CONTEXT:**
If this contract is intended for Monad deployment, note that Monad is a high-performance, Ethereum-compatible Layer 1 blockchain that:
- Is fully EVM-compatible at the bytecode level (uses Solidity/Vyper)
- Implements parallel execution for up to 10,000 TPS
- Maintains full Ethereum compatibility (same tools, libraries, ABIs)
- The underlying runtime is written in C++ for performance, but smart contracts use standard Solidity

## Additional Monad-Specific Considerations:

While Monad is fully EVM-compatible, consider these aspects for high-performance parallel execution:

1. **State Access Patterns**
   - Contracts that will be executed in parallel should minimize shared state
   - Consider transaction dependencies and state conflicts
   - Optimize for concurrent execution where possible

2. **Gas Optimization is MORE Important**
   - Higher throughput means more transactions competing for block space
   - Efficient gas usage is critical for cost-effective operations

3. **Standard EVM Security Still Applies**
   - All traditional Solidity vulnerabilities remain relevant
   - Reentrancy, access control, oracle manipulation, etc.
   - No new attack vectors introduced by Monad's architecture

4. **Performance Considerations**
   - Contracts should be optimized for quick execution
   - Avoid unnecessary storage reads/writes
   - Consider batch operations where applicable

[Continue with standard Solidity security audit checklist...]

Focus on all standard EVM vulnerabilities plus performance optimizations for high-throughput environments.`;

/**
 * Get language-specific audit prompt
 */
export function getLanguageSpecificPrompt(
  language: BlockchainLanguage,
  mergedCode: string,
  contractName: string = '',
  isMonad: boolean = false
): string {
  const params = { contractName };
  
  switch (language) {
    case 'rust':
      return RUST_SOLANA_SECURITY_AUDIT_PROMPT
        .replace('${mergedCode}', mergedCode)
        .replace('${params.contractName ? params.contractName : \'\'}', contractName);
    
    case 'solidity':
      if (isMonad) {
        return MONAD_EVM_SECURITY_AUDIT_PROMPT
          .replace('${mergedCode}', mergedCode)
          .replace('${params.contractName ? params.contractName : \'\'}', contractName);
      }
      // Will use the existing enhanced prompts for standard EVM
      return '';
    
    case 'vyper':
      // Vyper uses same prompt as Solidity since it's EVM-compatible
      return '';
    
    case 'move':
    case 'cairo':
    default:
      // For now, these will fall back to generic analysis
      // Can be extended in the future
      return '';
  }
}
