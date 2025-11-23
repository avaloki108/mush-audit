# Enhanced Mush Audit Design Document

## Executive Summary

This document outlines the architectural design for transforming Mush Audit from a pattern-matching tool into an advanced vulnerability detection system capable of finding exploitable fund-loss vulnerabilities across multiple blockchain languages.

## Core Problems with Current System

1. **Pattern Matching Limitations**: Current detectors use simple keyword/regex matching (e.g., `code.includes('flashLoan')`)
2. **High False Positive Rate**: No validation of whether detected patterns are actually exploitable
3. **No Cross-Contract Analysis**: Limited ability to follow logic across contract boundaries
4. **No Economic Validation**: Cannot determine if vulnerability is profitable to exploit
5. **Language-Specific Gaps**: Only Rust/Solana has detailed prompts; Move, Cairo, Vyper lack comprehensive detectors

## Enhanced Architecture

### 1. Multi-Layer Analysis Pipeline

```
Input Contract(s)
    ↓
┌─────────────────────────────────────────────┐
│ Layer 1: Language Detection & Parsing       │
│ - Detect language (Solidity/Rust/Move/Cairo)│
│ - Parse to AST                              │
│ - Extract functions, state vars, calls      │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ Layer 2: Static Analysis                    │
│ - Control flow graph (CFG)                  │
│ - Data flow analysis                        │
│ - Taint analysis                            │
│ - Call graph construction                   │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ Layer 3: Vulnerability Detection            │
│ - Pattern-based (initial candidates)        │
│ - Logic-based (path feasibility)            │
│ - Economic-based (profitability)            │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ Layer 4: Validation & Proof Generation      │
│ - Symbolic execution                        │
│ - Constraint solving (SMT)                  │
│ - PoC generation                            │
│ - False positive filtering                  │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ Layer 5: Impact Assessment                  │
│ - Economic impact calculation               │
│ - Attack capital requirements               │
│ - Severity scoring                          │
└─────────────────────────────────────────────┘
    ↓
Final Report with Validated Vulnerabilities
```

### 2. Core Modules

#### 2.1 Advanced Parser Module

**Purpose**: Convert source code to analyzable intermediate representation

**Components**:
- `SolidityParser`: Parse Solidity to AST
- `RustParser`: Parse Rust/Solana programs
- `MoveParser`: Parse Move contracts (Aptos/Sui)
- `CairoParser`: Parse Cairo contracts (StarkNet)
- `VyperParser`: Parse Vyper contracts

**Output**: Unified IR (Intermediate Representation) containing:
- Functions with parameters, return types, visibility
- State variables with types and access patterns
- External calls with targets and arguments
- Control flow information
- Data dependencies

#### 2.2 Data Flow Analysis Module

**Purpose**: Track how values flow through the contract

**Capabilities**:
- **Taint Analysis**: Mark user-controlled inputs and track propagation
- **Value Flow Tracking**: Follow token/ETH movements
- **State Dependency Analysis**: Identify which functions modify which state
- **Cross-Contract Flow**: Track values across contract boundaries

**Example**:
```typescript
// Detect if user input flows to critical operation without validation
function analyzeTaintFlow(ast: AST): TaintPath[] {
  const sources = findUserInputs(ast); // msg.sender, function params
  const sinks = findCriticalOps(ast);  // transfer, delegatecall, selfdestruct
  
  return findPaths(sources, sinks, ast)
    .filter(path => !hasValidation(path));
}
```

#### 2.3 Symbolic Execution Engine

**Purpose**: Explore all possible execution paths and generate constraints

**Approach**:
- Use symbolic values instead of concrete values
- Build path constraints for each execution path
- Use SMT solver to check path feasibility

**Implementation**:
```typescript
interface SymbolicState {
  variables: Map<string, SymbolicValue>;
  constraints: Constraint[];
  pathCondition: Constraint[];
}

class SymbolicExecutor {
  execute(function: Function): SymbolicPath[] {
    const initialState = createInitialState(function);
    const paths: SymbolicPath[] = [];
    
    // Explore all paths
    const worklist = [initialState];
    while (worklist.length > 0) {
      const state = worklist.pop();
      const nextStates = executeOneStep(state);
      
      for (const next of nextStates) {
        if (isTerminal(next)) {
          paths.push(next);
        } else {
          worklist.push(next);
        }
      }
    }
    
    return paths;
  }
  
  // Check if vulnerability is reachable
  isVulnerabilityReachable(vuln: Vulnerability): boolean {
    const paths = execute(vuln.function);
    return paths.some(path => 
      satisfiesVulnerabilityConditions(path, vuln) &&
      isSatisfiable(path.constraints)
    );
  }
}
```

#### 2.4 Cross-Contract Analysis Module

**Purpose**: Analyze interactions between multiple contracts

**Capabilities**:
- **Dependency Graph**: Build graph of contract dependencies
- **Call Chain Analysis**: Track multi-hop external calls
- **State Synchronization**: Detect inconsistencies across contracts
- **Composition Attacks**: Find vulnerabilities in contract interactions

**Key Algorithms**:
```typescript
// Build inter-contract call graph
function buildCallGraph(contracts: Contract[]): CallGraph {
  const graph = new CallGraph();
  
  for (const contract of contracts) {
    for (const func of contract.functions) {
      for (const call of func.externalCalls) {
        const target = resolveTarget(call, contracts);
        if (target) {
          graph.addEdge(func, target, call);
        }
      }
    }
  }
  
  return graph;
}

// Detect cross-contract reentrancy
function detectCrossContractReentrancy(graph: CallGraph): Vulnerability[] {
  const vulns: Vulnerability[] = [];
  
  // Find cycles in call graph
  const cycles = findCycles(graph);
  
  for (const cycle of cycles) {
    // Check if state is modified after external call
    if (hasStateModificationAfterExternalCall(cycle)) {
      vulns.push({
        type: 'CrossContractReentrancy',
        severity: 'Critical',
        path: cycle,
        description: 'State modified after external call in cycle'
      });
    }
  }
  
  return vulns;
}
```

#### 2.5 Economic Impact Calculator

**Purpose**: Determine if vulnerability is economically exploitable

**Calculations**:
```typescript
interface EconomicAnalysis {
  maxPotentialLoss: bigint;        // Maximum funds at risk
  attackCapitalRequired: bigint;   // Capital needed to execute
  attackProfit: bigint;             // Expected profit
  gasCost: bigint;                  // Gas cost of attack
  isProfitable: boolean;            // profit > gasCost + capital
  riskScore: number;                // 0-100 score
}

class EconomicAnalyzer {
  analyzeFlashLoanAttack(vuln: Vulnerability): EconomicAnalysis {
    // Calculate how much can be borrowed
    const maxBorrow = calculateMaxFlashLoan(vuln.targetContract);
    
    // Calculate price impact
    const priceImpact = simulatePriceManipulation(maxBorrow, vuln);
    
    // Calculate profit from manipulation
    const profit = calculateArbitrageProfit(priceImpact, vuln);
    
    // Calculate costs
    const flashLoanFee = maxBorrow * 0.0009; // 0.09% typical fee
    const gasCost = estimateGasCost(vuln.exploitPath);
    
    return {
      maxPotentialLoss: calculateTVLAtRisk(vuln),
      attackCapitalRequired: flashLoanFee + gasCost,
      attackProfit: profit - flashLoanFee - gasCost,
      gasCost,
      isProfitable: profit > flashLoanFee + gasCost,
      riskScore: calculateRiskScore(profit, maxPotentialLoss)
    };
  }
  
  analyzeGovernanceAttack(vuln: Vulnerability): EconomicAnalysis {
    const tokenPrice = getTokenPrice(vuln.governanceToken);
    const requiredVotes = calculateRequiredVotes(vuln);
    const capitalRequired = requiredVotes * tokenPrice;
    
    const potentialGain = calculateMaxDrainableValue(vuln);
    
    return {
      maxPotentialLoss: potentialGain,
      attackCapitalRequired: capitalRequired,
      attackProfit: potentialGain - capitalRequired,
      gasCost: estimateGasCost(vuln.exploitPath),
      isProfitable: potentialGain > capitalRequired * 1.1, // 10% margin
      riskScore: calculateRiskScore(potentialGain, capitalRequired)
    };
  }
}
```

#### 2.6 Proof-of-Concept Generator

**Purpose**: Generate executable exploit code to validate vulnerabilities

**Capabilities**:
- Generate Foundry/Hardhat test files
- Create attacker contracts
- Simulate exploits on forked mainnet
- Measure actual impact

**Example Output**:
```solidity
// Auto-generated PoC for Flash Loan Oracle Manipulation
contract FlashLoanOracleExploit {
    IVulnerableProtocol target;
    IFlashLoanProvider flashLoan;
    IERC20 token;
    
    function exploit() external {
        // Step 1: Flash loan large amount
        uint256 loanAmount = 1000000 * 1e18;
        flashLoan.flashLoan(address(this), loanAmount, "");
    }
    
    function onFlashLoan(
        address initiator,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bytes32) {
        // Step 2: Manipulate oracle price
        manipulatePrice(amount);
        
        // Step 3: Exploit at manipulated price
        target.deposit(amount / 2);
        target.withdraw();
        
        // Step 4: Repay flash loan
        token.approve(address(flashLoan), amount + fee);
        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }
    
    function manipulatePrice(uint256 amount) internal {
        // Swap to manipulate DEX price
        // ...
    }
}
```

### 3. Language-Specific Analyzers

#### 3.1 Solidity/EVM Analyzer

**Vulnerabilities to Detect**:
1. Reentrancy (classic, cross-function, cross-contract, read-only)
2. Flash loan attacks with oracle manipulation
3. Governance attacks (flash voting, proposal manipulation)
4. Integer overflow/underflow (pre-0.8.0)
5. Unchecked external calls
6. Delegatecall to untrusted contracts
7. Unprotected selfdestruct
8. Front-running vulnerabilities
9. Price oracle manipulation
10. Access control bypasses

**Advanced Detection Logic**:
```typescript
// Example: Detect exploitable flash loan oracle manipulation
function detectFlashLoanOracleManipulation(contract: Contract): Vulnerability[] {
  const vulns: Vulnerability[] = [];
  
  // 1. Find functions that accept flash loans
  const flashLoanFunctions = contract.functions.filter(f =>
    hasFlashLoanCallback(f) || callsFlashLoan(f)
  );
  
  for (const func of flashLoanFunctions) {
    // 2. Check if function reads from price oracle
    const oracleReads = findOracleReads(func);
    
    if (oracleReads.length === 0) continue;
    
    // 3. Check if oracle can be manipulated
    for (const oracle of oracleReads) {
      const manipulation = analyzeOracleManipulability(oracle);
      
      if (!manipulation.isManipulable) continue;
      
      // 4. Check if manipulation leads to profit
      const profitPath = findProfitPath(func, oracle, manipulation);
      
      if (!profitPath) continue;
      
      // 5. Validate with symbolic execution
      const isExploitable = validateWithSymbolicExecution(profitPath);
      
      if (!isExploitable) continue;
      
      // 6. Calculate economic impact
      const impact = calculateEconomicImpact(profitPath);
      
      if (!impact.isProfitable) continue;
      
      // 7. Generate PoC
      const poc = generatePoC(profitPath);
      
      vulns.push({
        type: 'FlashLoanOracleManipulation',
        severity: 'Critical',
        confidence: 'High',
        location: func.location,
        description: `Flash loan can manipulate ${oracle.name} oracle, leading to $${impact.maxPotentialLoss} potential loss`,
        attackPath: profitPath,
        economicImpact: impact,
        pocCode: poc,
        validated: true
      });
    }
  }
  
  return vulns;
}
```

#### 3.2 Rust/Solana Analyzer

**Solana-Specific Vulnerabilities**:
1. Missing signer checks
2. Missing owner checks on accounts
3. Incorrect PDA derivation
4. Account confusion/type confusion
5. Arbitrary CPI (Cross-Program Invocation)
6. Integer overflow (unchecked arithmetic)
7. Missing account discriminator checks
8. Rent exemption issues
9. Token program misuse
10. Compute budget exhaustion

**Detection Logic**:
```typescript
function detectMissingSignerCheck(program: RustProgram): Vulnerability[] {
  const vulns: Vulnerability[] = [];
  
  for (const instruction of program.instructions) {
    // Find accounts that should be signers
    const criticalAccounts = instruction.accounts.filter(acc =>
      modifiesState(acc) || transfersFunds(acc)
    );
    
    for (const account of criticalAccounts) {
      // Check if signer validation exists
      const hasCheck = instruction.body.some(stmt =>
        isSignerCheck(stmt, account)
      );
      
      if (!hasCheck) {
        // Validate this is actually exploitable
        const exploit = generateSignerBypassExploit(instruction, account);
        
        if (exploit.isValid) {
          vulns.push({
            type: 'MissingSignerCheck',
            severity: 'Critical',
            location: account.location,
            description: `Account ${account.name} can be controlled by attacker`,
            pocCode: exploit.code,
            validated: true
          });
        }
      }
    }
  }
  
  return vulns;
}
```

#### 3.3 Move Analyzer (Aptos/Sui)

**Move-Specific Vulnerabilities**:
1. Object ownership bypass
2. Global storage access control issues
3. Incorrect function visibility
4. Generic type confusion
5. Resource duplication (ability misuse)
6. Arithmetic errors (division precision)
7. ConstructorRef leaks
8. Front-running
9. Oracle manipulation
10. Reentrancy (cross-module)

**Detection Logic**:
```typescript
function detectObjectOwnershipBypass(module: MoveModule): Vulnerability[] {
  const vulns: Vulnerability[] = [];
  
  for (const func of module.functions) {
    // Find functions accepting Object<T> parameters
    const objectParams = func.parameters.filter(p =>
      p.type.startsWith('Object<')
    );
    
    for (const param of objectParams) {
      // Check if ownership is verified
      const hasOwnershipCheck = func.body.some(stmt =>
        isOwnershipCheck(stmt, param)
      );
      
      if (!hasOwnershipCheck) {
        // Check if this leads to unauthorized access
        const impact = analyzeUnauthorizedAccess(func, param);
        
        if (impact.canBypassPayment || impact.canAccessOthersResources) {
          vulns.push({
            type: 'ObjectOwnershipBypass',
            severity: 'High',
            location: param.location,
            description: `Object parameter ${param.name} not validated for ownership`,
            impact: impact.description,
            recommendation: `Add: assert!(object::owner(&${param.name}) == address_of(user), ENOT_OWNER);`,
            validated: true
          });
        }
      }
    }
  }
  
  return vulns;
}
```

#### 3.4 Cairo/StarkNet Analyzer

**Cairo-Specific Vulnerabilities**:
1. Felt overflow/underflow
2. L1/L2 type conversion issues
3. L1/L2 validation asymmetry
4. Private data in storage
5. Reentrancy
6. Access control bypass

**Detection Logic**:
```typescript
function detectFeltOverflow(contract: CairoContract): Vulnerability[] {
  const vulns: Vulnerability[] = [];
  
  for (const func of contract.functions) {
    // Find arithmetic operations on felt252
    const arithmeticOps = findArithmeticOperations(func);
    
    for (const op of arithmeticOps) {
      if (op.type !== 'felt252') continue;
      
      // Check if overflow/underflow is possible
      const bounds = calculateValueBounds(op);
      
      if (bounds.canOverflow || bounds.canUnderflow) {
        // Check if this affects security
        const impact = analyzeOverflowImpact(op, func);
        
        if (impact.affectsFunds || impact.affectsAccessControl) {
          vulns.push({
            type: 'FeltOverflow',
            severity: impact.severity,
            location: op.location,
            description: `Felt252 arithmetic can overflow/underflow`,
            recommendation: `Use integer types (u128, u256) with built-in checks`,
            validated: true
          });
        }
      }
    }
  }
  
  return vulns;
}
```

#### 3.5 Vyper Analyzer

**Vyper-Specific Vulnerabilities**:
1. Compiler bugs (version-specific)
2. Reentrancy guard bypass
3. Storage collision
4. Integer overflow/underflow
5. Access control issues

### 4. False Positive Reduction Strategy

**Multi-Stage Filtering**:

```typescript
class FalsePositiveFilter {
  async filter(candidates: Vulnerability[]): Promise<Vulnerability[]> {
    const validated: Vulnerability[] = [];
    
    for (const vuln of candidates) {
      // Stage 1: Static analysis validation
      if (!this.validateStatically(vuln)) continue;
      
      // Stage 2: Symbolic execution validation
      if (!await this.validateSymbolically(vuln)) continue;
      
      // Stage 3: Economic validation
      if (!this.validateEconomically(vuln)) continue;
      
      // Stage 4: PoC generation
      const poc = await this.generatePoC(vuln);
      if (!poc.succeeds) continue;
      
      vuln.validated = true;
      vuln.pocCode = poc.code;
      validated.push(vuln);
    }
    
    return validated;
  }
  
  validateStatically(vuln: Vulnerability): boolean {
    // Check if vulnerability conditions are met
    switch (vuln.type) {
      case 'Reentrancy':
        return this.hasExternalCall(vuln) &&
               this.hasStateChangeAfter(vuln) &&
               !this.hasReentrancyGuard(vuln);
      
      case 'FlashLoanOracle':
        return this.hasFlashLoan(vuln) &&
               this.hasOracleRead(vuln) &&
               this.oracleIsManipulable(vuln);
      
      // ... other types
    }
  }
  
  async validateSymbolically(vuln: Vulnerability): Promise<boolean> {
    const executor = new SymbolicExecutor();
    
    // Check if vulnerability is reachable
    const paths = executor.findPathsTo(vuln.location);
    
    for (const path of paths) {
      // Check if constraints are satisfiable
      const solver = new SMTSolver();
      const result = await solver.solve(path.constraints);
      
      if (result.satisfiable) {
        vuln.exploitInputs = result.model;
        return true;
      }
    }
    
    return false;
  }
  
  validateEconomically(vuln: Vulnerability): boolean {
    const analyzer = new EconomicAnalyzer();
    const impact = analyzer.analyze(vuln);
    
    vuln.economicImpact = impact;
    
    // Only report if economically viable
    return impact.isProfitable && impact.maxPotentialLoss > 1000; // $1k threshold
  }
}
```

### 5. Implementation Plan

**Phase 1: Core Infrastructure** (Current Phase)
- [ ] Create AST parsers for each language
- [ ] Build unified IR
- [ ] Implement control flow graph builder
- [ ] Implement data flow analysis

**Phase 2: Advanced Analysis**
- [ ] Implement symbolic execution engine
- [ ] Integrate SMT solver (Z3)
- [ ] Build cross-contract analyzer
- [ ] Create economic impact calculator

**Phase 3: Language-Specific Detectors**
- [ ] Enhance Solidity detectors with logic validation
- [ ] Implement Rust/Solana advanced detectors
- [ ] Implement Move advanced detectors
- [ ] Implement Cairo advanced detectors
- [ ] Implement Vyper advanced detectors

**Phase 4: Validation & PoC**
- [ ] Implement false positive filter
- [ ] Build PoC generator
- [ ] Create test harness for validation

**Phase 5: Integration**
- [ ] Integrate all modules into pipeline
- [ ] Update UI to show validation status
- [ ] Add economic impact visualization

## Success Metrics

1. **False Positive Rate**: < 10% (down from current ~60-80%)
2. **Detection Rate**: > 90% for known exploits
3. **Language Coverage**: 5 languages fully supported
4. **Validation Rate**: 100% of reported vulnerabilities validated
5. **Economic Accuracy**: ±20% of actual exploit profit

## Next Steps

1. Implement core AST parsers
2. Build data flow analysis module
3. Create first advanced detector (Flash Loan Oracle)
4. Test on historical exploits
5. Iterate and improve
