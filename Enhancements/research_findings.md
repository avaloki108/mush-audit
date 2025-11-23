# Web3 Vulnerability Research Findings

## OWASP Smart Contract Top 10 (2025)

**Source:** https://owasp.org/www-project-smart-contract-top-10/

**Total Financial Impact (2024):** $1.42 billion lost across 149 documented incidents

### Top 10 Vulnerabilities by Financial Impact:

1. **SC01 - Access Control Vulnerabilities** - $953.2M in losses
   - Unauthorized access to contract data/functions
   - Improper permission checks
   - Leading cause of fund loss in 2024

2. **SC02 - Price Oracle Manipulation** - $8.8M in losses
   - Tampering with oracle feeds
   - Affects contract logic and pricing
   - Critical for DeFi protocols

3. **SC03 - Logic Errors** - $63.8M in losses
   - Business logic vulnerabilities
   - Incorrect reward distribution
   - Token minting issues
   - Flawed lending/borrowing logic

4. **SC04 - Lack of Input Validation** - $14.6M in losses
   - Harmful or unexpected inputs
   - Breaking contract logic

5. **SC05 - Reentrancy Attacks** - $35.7M in losses
   - Repeated state changes
   - Drained contract funds

6. **SC06 - Unchecked External Calls** - $550.7K in losses
   - Failed external calls not verified
   - Integrity and functionality risks

7. **SC07 - Flash Loan Attacks** - $33.8M in losses
   - Multiple actions in single transaction
   - Drained liquidity
   - Price manipulation

8. **SC08 - Integer Overflow and Underflow**
   - Arithmetic errors
   - Token theft
   - Incorrect calculations

9. **SC09 - Insecure Randomness**
   - Predictable randomness
   - Lottery/distribution exploits

10. **SC10 - Denial of Service (DoS) Attacks**
    - Resource exhaustion
    - Contract non-functionality

## Key Insights:

- Access Control is the #1 vulnerability (67% of total losses)
- Logic Errors and Reentrancy are significant (combined ~$100M)
- Flash Loan attacks remain prevalent
- Oracle manipulation is a critical DeFi risk


## Solana/Rust Specific Vulnerabilities

**Source:** https://arxiv.org/html/2504.07419v1

### Major Solana Attacks (2022):

| Date | Target | Loss | Attack Method |
|------|--------|------|---------------|
| 11/02/2022 | Solend | $1,260,000 | Oracle Attack |
| 10/11/2022 | Mango | $100,000,000 | Flash Loan |
| 10/12/2022 | TulipProtocol | $2,500,000 | Mango Attack |
| 10/12/2022 | UXD Protocol | $20,000,000 | Mango Attack |
| 08/29/2022 | OptiFi | 661,000 USDC | Operational Error |
| 07/28/2022 | Nirvana | $3,500,000 | Flash Loan |
| 07/03/2022 | Crema Finance | $1,682,000 | Flash Loan |
| 03/23/2022 | Cashio | $52,027,994 | Bypassed unverified accounts |
| 02/02/2022 | Wormhole | 120,000 ETH | Forged signatures via deprecated function |

**Total Solana Losses (2022):** ~$181 million

### Key Insights:

- Solana uses Rust instead of Solidity
- Compiled to SBF (Solana Bytecode Format)
- Runs on modified LLVM
- Flash loan attacks are prevalent
- Oracle manipulation is a major risk
- Account validation is critical
- Unverified accounts lead to major exploits


## Move Language (Aptos/Sui) Vulnerabilities

**Source:** https://aptos.dev/build/smart-contracts/move-security-guidelines

### Key Move Security Vulnerabilities:

1. **Object Ownership Check**
   - Any Object<T> can be accessed by anyone
   - Must verify signer is rightful owner
   - Can lead to unauthorized use of paid resources

2. **Global Storage Access Control**
   - Accepting &signer not always sufficient
   - Must assert signer is expected account
   - Unauthorized users can execute privileged actions

3. **Function Visibility**
   - Improper visibility can expose internal functions
   - Must follow principle of least privilege

4. **Generics Type Check**
   - Type confusion vulnerabilities
   - Must validate generic type parameters

5. **Resource Management and Unbounded Execution**
   - Unbounded loops can cause DoS
   - Resource exhaustion attacks

6. **Move Abilities**
   - Incorrect ability assignments
   - Can lead to resource duplication or loss

7. **Arithmetic Operations**
   - Division precision loss
   - Integer overflow/underflow

8. **ConstructorRef Leak**
   - Leaked constructor references
   - Can allow unauthorized object manipulation

9. **Object Accounts**
   - Improper object account handling
   - Authorization bypass

10. **Front-running**
    - Transaction ordering attacks
    - MEV exploitation

11. **Price Oracle Manipulation**
    - Oracle data manipulation
    - Price feed attacks

12. **Token Identifier Collision**
    - Collision in token identifiers
    - Asset confusion attacks

13. **Reentrancy**
    - Cross-module reentrancy
    - State manipulation

14. **Time-of-Check vs Time-of-Use (TOCTOU)**
    - Race conditions
    - State changes between check and use

### Move-Specific Strengths:

- Resource semantics prevent double spending at compiler level
- Linear logic prevents resource duplication
- Type system provides strong guarantees
- No null pointers or dangling references

### Move-Specific Weaknesses:

- Novel language - developers unfamiliar with patterns
- Business logic complexity
- Object ownership validation required
- Access control must be explicit


## Cairo/StarkNet Vulnerabilities

**Source:** https://fuzzinglabs.com/top-4-vulnerability-cairo-starknet-smart-contract/

### Top 4 Cairo Vulnerabilities:

1. **Felt Overflow/Underflow**
   - Cairo uses felt252 type (field element)
   - Range: 0 ≤ x < P, where P = 2^251 + 17 * 2^192
   - Overflows/underflows computed modulo P
   - Can silently wrap around without errors
   - **Mitigation:** Use integer types (u128, u256, i64, etc.) with built-in checks

2. **L1/L2 Interaction Bugs**
   - **Type conversion issues:** Ethereum uint160 addresses → felt252 mismatch
   - Valid L1 addresses can map to null/unexpected L2 addresses
   - **Fund loss risk:** Tokens sent to unintended addresses
   - **Asymmetric validation:** Different checks on L1 vs L2 can cause fund loss
   - **Mitigation:** Validate parameters, ensure symmetrical checks on both layers

3. **Private Data Leak in Storage**
   - All storage data is public on StarkNet blockchain
   - Storing secrets in plaintext exposes them
   - **Mitigation:** Encrypt data off-chain or use hashes instead of plaintext

4. **Reentrancy**
   - Same mechanisms as Solidity reentrancy
   - Can drain funds through recursive calls
   - **Mitigation:** Use OpenZeppelin reentrancy guard (start/end methods)

### Cairo-Specific Characteristics:

- Language for zero-knowledge proofs (ZK-STARKs)
- Layer-2 solution on Ethereum
- Uses felt (field element) as primary type
- Provable programs for scalability

## Vyper Vulnerabilities

**Sources:** 
- https://www.halborn.com/blog/post/explained-the-vyper-bug-hack-july-2023
- https://medium.com/@sharkteam/sharkteam-analysis-of-vyper-vulnerability-leading-to-attacks-on-projects-like-curve-and-jpegd-70a3ac12ba3c

### Major Vyper Incidents:

**July 2023 Vyper Bug Hack:**
- **Total Loss:** $70+ million
- **Affected:** Curve Finance, JPEG'd, others
- **Cause:** Compiler bug in specific Vyper versions
- **Impact:** Over $61 million stolen from DeFi protocols

**March 2025 Vyper Vulnerability:**
- Millions in cryptocurrency stolen
- Multiple platforms affected
- Compiler-level vulnerability

### Vyper-Specific Vulnerabilities:

1. **Compiler Bugs**
   - Reentrancy guard bypass in certain versions
   - Malfunctioning locks in compiled bytecode
   - Version-specific vulnerabilities

2. **Reentrancy Attacks**
   - Despite reentrancy guards, compiler bugs allowed bypass
   - Curve Finance pools drained

3. **Security vs Complexity Trade-off**
   - Python-like syntax for simplicity
   - Smaller ecosystem than Solidity
   - Less battle-tested

### Key Insights:

- Vyper designed for security and simplicity
- Compiler bugs can undermine language-level protections
- Critical to use audited, patched versions
- Transparency in vulnerability disclosure process


## Advanced Vulnerability Detection Requirements

### Beyond Pattern Matching:

The current tool's weakness is reliance on simple pattern matching (e.g., detecting "flashLoan" keyword). Real exploitable vulnerabilities require:

#### 1. Deep Logic Analysis
- **Symbolic Execution:** Track all possible execution paths
- **State Transition Analysis:** Model how contract state changes
- **Data Flow Analysis:** Follow value flow across functions and contracts
- **Control Flow Analysis:** Understand branching and loop conditions
- **Invariant Detection:** Identify what should always be true

#### 2. False Positive Filtering
- **Proof Generation:** Prove vulnerability is exploitable
- **Counterexample Finding:** Show concrete attack scenario
- **Mitigation Verification:** Check if protections actually work
- **Constraint Solving:** Use SMT solvers to validate attack paths
- **Static + Dynamic Analysis:** Combine both approaches

#### 3. Cross-Contract Logic Following
- **Inter-Contract Data Flow:** Track values across contract boundaries
- **Dependency Graph Analysis:** Understand contract relationships
- **Composition Attack Detection:** Find vulnerabilities in contract interactions
- **State Synchronization Issues:** Detect inconsistencies across contracts
- **Privilege Escalation Paths:** Find unauthorized access routes

#### 4. Compound Hypothesis Generation
- **Multi-Step Attack Chains:** Generate complex attack scenarios
- **Precondition Analysis:** Determine what conditions enable exploits
- **Attack Tree Generation:** Build all possible attack paths
- **Economic Feasibility:** Calculate if attack is profitable
- **Gas Cost Analysis:** Determine if attack is economically viable

#### 5. Economic Impact Modeling
- **Value-at-Risk Calculation:** Quantify maximum potential loss
- **Profit Calculation:** Determine attacker profit potential
- **Capital Requirements:** Calculate funds needed for attack
- **Market Impact:** Model price slippage and liquidity effects
- **MEV Opportunity Detection:** Find extractable value

#### 6. Automated PoC Generation
- **Exploit Code Generation:** Create working attack contracts
- **Test Harness Creation:** Build testing environment
- **Exploit Validation:** Run exploits in forked environments
- **Success Rate Estimation:** Calculate exploit reliability
- **Remediation Verification:** Test if fixes work

### Tools and Techniques Needed:

1. **Symbolic Execution Engines**
   - Manticore, Mythril for EVM
   - Custom engines for Rust/Move/Cairo

2. **SMT Solvers**
   - Z3, CVC5 for constraint solving
   - Prove/disprove attack scenarios

3. **Formal Verification**
   - Move Prover for Move
   - Certora for Solidity
   - Property-based testing

4. **Dynamic Analysis**
   - Fuzzing with Echidna, Foundry
   - Transaction replay and simulation
   - Forked mainnet testing

5. **Graph Analysis**
   - Call graph construction
   - Dependency analysis
   - Taint analysis

6. **Economic Modeling**
   - DeFi protocol simulation
   - Price oracle modeling
   - Liquidity pool simulation

