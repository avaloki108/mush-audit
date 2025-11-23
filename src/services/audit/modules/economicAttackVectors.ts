import type { ContractFile } from "@/types/blockchain";

export interface EconomicAttackVector {
  id: string;
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  contracts: string[];
  description: string;
  location: string;
  economicImpact: string;
  exploitScenario: string;
  recommendation: string;
  probability: 'Low' | 'Medium' | 'High';
  potentialLoss: string; // e.g., "Up to $X million"
}

export interface EconomicAttackAnalysisResult {
  attackVectors: EconomicAttackVector[];
  totalRiskScore: number;
  fundLossExposure: string;
  mitigationEffectiveness: number; // 0-100%
  recommendations: string[];
}

export class EconomicAttackVectorAnalyzer {
  private contracts: ContractFile[];

  constructor(contracts: ContractFile[]) {
    this.contracts = contracts;
  }

  analyzeEconomicAttackVectors(): EconomicAttackAnalysisResult {
    const attackVectors: EconomicAttackVector[] = [];

    // Analyze each contract for economic attack vectors
    this.contracts.forEach(contract => {
      // 1. Flash loan attack vectors
      attackVectors.push(...this.detectFlashLoanVectors(contract));

      // 2. Oracle manipulation vectors
      attackVectors.push(...this.detectOracleManipulationVectors(contract));

      // 3. Governance attack vectors
      attackVectors.push(...this.detectGovernanceAttackVectors(contract));

      // 4. MEV opportunities that could harm users
      attackVectors.push(...this.detectMEVOpportunities(contract));

      // 5. Cross-contract value drain vectors
      attackVectors.push(...this.detectValueDrainVectors(contract));

      // 6. Economic incentive misalignment
      attackVectors.push(...this.detectEconomicMisalignment(contract));

      // 7. Fee-on-transfer token vulnerabilities
      attackVectors.push(...this.detectFeeOnTransferVulnerabilities(contract));

      // 8. Reentrancy economic attacks
      attackVectors.push(...this.detectEconomicReentrancyVectors(contract));
    });

    // Perform cross-contract analysis
    attackVectors.push(...this.detectCrossContractEconomicAttacks());

    // Calculate risk metrics
    const totalRiskScore = this.calculateRiskScore(attackVectors);
    const fundLossExposure = this.estimateFundLossExposure(attackVectors);
    const mitigationEffectiveness = this.estimateMitigationEffectiveness(attackVectors);
    const recommendations = this.generateEconomicRecommendations(attackVectors);

    return {
      attackVectors,
      totalRiskScore,
      fundLossExposure,
      mitigationEffectiveness,
      recommendations
    };
  }

  private detectFlashLoanVectors(contract: ContractFile): EconomicAttackVector[] {
    const vectors: EconomicAttackVector[] = [];
    const content = contract.content;

    // Look for patterns that make flash loan attacks possible
    const hasOracles = /oracle|price|getPrice|latestAnswer/.test(content);
    const hasSwaps = /swap|uniswap|sushiswap|curve|balancer/.test(content);
    const hasStateChanges = /balances?\[|totalSupply|reserve|liquidity/.test(content);

    if (hasOracles && hasSwaps && hasStateChanges) {
      vectors.push({
        id: `flash-loan-${contract.name}-${Date.now()}`,
        type: 'Flash Loan Oracle Manipulation',
        severity: 'Critical',
        contracts: [contract.name],
        description: `Contract ${contract.name} combines oracle usage, swap functionality, and state changes, making it vulnerable to flash loan oracle manipulation attacks`,
        location: contract.path,
        economicImpact: 'Attacker can manipulate oracle prices through flash loans to drain funds or profit from arbitrage',
        exploitScenario: 'Borrow large amounts of tokens → manipulate DEX price → use manipulated oracle for favorable rates → repay flash loan → profit',
        recommendation: 'Use TWAP oracles with sufficient time windows. Implement transaction value limits. Add reentrancy guards.',
        probability: 'High',
        potentialLoss: 'Up to total protocol liquidity'
      });
    }

    // Check for flash loan callbacks without proper validation
    if (/function\s+onFlashLoan|executeOperation|receiveFlashLoan/.test(content)) {
      const hasValidation = /require.*msg\.sender|onlyOwner|authorized/.test(content);
      
      if (!hasValidation) {
        vectors.push({
          id: `flash-callback-${contract.name}-${Date.now()}`,
          type: 'Unprotected Flash Loan Callback',
          severity: 'High',
          contracts: [contract.name],
          description: `Flash loan callback in ${contract.name} lacks proper validation`,
          location: contract.path,
          economicImpact: 'Attacker can directly exploit the callback function for unauthorized operations',
          exploitScenario: 'Attacker creates their own flash loan contract → calls protocol\'s flash loan function → executes malicious callback',
          recommendation: 'Validate the flash loan initiator. Ensure callback can only be called by trusted flash loan providers.',
          probability: 'Medium',
          potentialLoss: 'Up to contract balance'
        });
      }
    }

    return vectors;
  }

  private detectOracleManipulationVectors(contract: ContractFile): EconomicAttackVector[] {
    const vectors: EconomicAttackVector[] = [];
    const content = contract.content;

    // Check for single-source oracle usage
    const oracleCallPattern = /\.getPrice|\.latestAnswer|\.latestRoundData|price\s*\(/g;
    const oracleCalls = content.match(oracleCallPattern);

    if (oracleCalls && oracleCalls.length > 0) {
      // Check if TWAP or multi-oracle is used
      const hasTWAP = /TWAP|timeWeighted|observe|consult/.test(content);
      const hasMultiOracle = /oracle.*oracle|chainlink.*uniswap/i.test(content);

      if (!hasTWAP && !hasMultiOracle) {
        vectors.push({
          id: `oracle-single-${contract.name}-${Date.now()}`,
          type: 'Single Oracle Dependency',
          severity: 'High',
          contracts: [contract.name],
          description: `Contract ${contract.name} relies on a single oracle source without TWAP protection`,
          location: contract.path,
          economicImpact: 'Attacker can manipulate oracle prices to cause incorrect valuations and fund loss',
          exploitScenario: 'Flash loan → manipulate AMM pool → read incorrect price from oracle → execute operation with bad price → repay loan',
          recommendation: 'Use TWAP oracles with sufficient time windows (15-30 minutes). Implement multi-oracle validation.',
          probability: 'High',
          potentialLoss: 'Up to total locked value'
        });
      }

      // Check for spot price usage in critical operations
      if (/swap|mint|burn|liquidate|deposit|withdraw/.test(content) && /\.balanceOf|\.reserves/.test(content)) {
        vectors.push({
          id: `oracle-spot-${contract.name}-${Date.now()}`,
          type: 'Spot Price Manipulation Risk',
          severity: 'Critical',
          contracts: [contract.name],
          description: `Contract ${contract.name} may use spot prices from AMM pools for critical operations`,
          location: contract.path,
          economicImpact: 'Immediate fund loss through price manipulation',
          exploitScenario: 'Manipulate AMM pool reserves → read spot price → execute critical operation at manipulated price → profit extraction',
          recommendation: 'Never use spot prices from AMM pools directly. Use TWAP with minimum time window.',
          probability: 'High',
          potentialLoss: 'Up to total pool value'
        });
      }
    }

    return vectors;
  }

  private detectGovernanceAttackVectors(contract: ContractFile): EconomicAttackVector[] {
    const vectors: EconomicAttackVector[] = [];
    const content = contract.content;

    // Check for voting mechanisms
    const hasVoting = /vote|proposal|governance|delegate/i.test(content);

    if (hasVoting) {
      // Check for flash loan usage with voting
      const hasFlashLoan = /flashLoan|borrow|flash/.test(content);

      if (hasFlashLoan) {
        vectors.push({
          id: `governance-flash-${contract.name}-${Date.now()}`,
          type: 'Flash Loan Governance Attack',
          severity: 'Critical',
          contracts: [contract.name],
          description: `Governance mechanism in ${contract.name} may be vulnerable to flash loan attacks`,
          location: contract.path,
          economicImpact: 'Complete protocol takeover and fund theft through malicious governance proposals',
          exploitScenario: 'Flash loan governance tokens → gain majority voting power → pass malicious proposals → steal funds → repay loan',
          recommendation: 'Implement voting delays and time locks. Use snapshot-based voting. Require minimum holding period.',
          probability: 'Medium',
          potentialLoss: 'All protocol funds'
        });
      }

      // Check for timelock on governance actions
      const hasTimelock = /timelock|delay|waitPeriod/i.test(content);

      if (!hasTimelock) {
        vectors.push({
          id: `governance-timelock-${contract.name}-${Date.now()}`,
          type: 'Missing Governance Timelock',
          severity: 'High',
          contracts: [contract.name],
          description: `Governance in ${contract.name} lacks timelock protection`,
          location: contract.path,
          economicImpact: 'Immediate execution of potentially malicious governance proposals',
          exploitScenario: 'Pass malicious proposal → immediate execution → no time for community response or fund withdrawal',
          recommendation: 'Add timelock delays to all governance actions. Implement multi-sig requirements.',
          probability: 'Low',
          potentialLoss: 'Governance-controlled funds'
        });
      }
    }

    return vectors;
  }

  private detectMEVOpportunities(contract: ContractFile): EconomicAttackVector[] {
    const vectors: EconomicAttackVector[] = [];
    const content = contract.content;

    // Check for front-running opportunities
    const hasUserParams = /minAmount|maxAmount|deadline|recipient/.test(content);
    const hasSensitivity = /price|rate|exchange|value/.test(content);

    if (hasUserParams && hasSensitivity) {
      vectors.push({
        id: `mev-frontrun-${contract.name}-${Date.now()}`,
        type: 'Front-running Opportunity',
        severity: 'Medium',
        contracts: [contract.name],
        description: `Contract ${contract.name} may expose users to front-running attacks due to sensitive user-provided parameters`,
        location: contract.path,
        economicImpact: 'Users lose value to MEV bots that front-run their transactions',
        exploitScenario: 'MEV bot monitors mempool → sees user transaction with favorable rates → submits own transaction with higher gas → frontruns user',
        recommendation: 'Implement commit-reveal schemes or use time-locked transactions for sensitive operations.',
        probability: 'High',
        potentialLoss: 'Dependent on market conditions and user transaction fees'
      });
    }

    // Check for sandwich attack opportunities
    const hasSwaps = /swap|router/.test(content);
    const hasSlippageProtection = /minAmount|deadline|slippage/.test(content);
    const hasSwapsAndSlippage = hasSwaps && !hasSlippageProtection;

    if (hasSwapsAndSlippage) {
      vectors.push({
        id: `mev-sandwich-${contract.name}-${Date.now()}`,
        type: 'Sandwich Attack Opportunity',
        severity: 'Medium',
        contracts: [contract.name],
        description: `Swap functionality in ${contract.name} may expose users to sandwich attacks`,
        location: contract.path,
        economicImpact: 'Users pay higher prices due to MEV bots sandwiching their transactions',
        exploitScenario: 'MEV bot detects user swap → buy before user at low price → user buys at higher price → sell after user at higher price',
        recommendation: 'Implement slippage protection and minimum output parameters for all swaps.',
        probability: 'High',
        potentialLoss: 'Dependent on swap size and slippage'
      });
    }

    return vectors;
  }

  private detectValueDrainVectors(contract: ContractFile): EconomicAttackVector[] {
    const vectors: EconomicAttackVector[] = [];
    const content = contract.content;

    // Check for functions that send value without proper checks
    const hasValueTransfer = /transfer|send|call\.value/.test(content);
    const hasUserControl = /msg\.value|input|user|recipient/.test(content);

    if (hasValueTransfer && hasUserControl) {
      // Check for access controls
      const hasAccessControl = /onlyOwner|require.*msg\.sender|accessControl/.test(content);

      if (!hasAccessControl) {
        vectors.push({
          id: `drain-unauthorized-${contract.name}-${Date.now()}`,
          type: 'Unauthorized Value Transfer',
          severity: 'Critical',
          contracts: [contract.name],
          description: `Function in ${contract.name} allows value transfer without proper access controls`,
          location: contract.path,
          economicImpact: 'Attacker can drain contract of all funds',
          exploitScenario: 'Call function that transfers value → no access control check → contract funds drained',
          recommendation: 'Add access control modifiers to all functions that can transfer value.',
          probability: 'High',
          potentialLoss: 'All contract funds'
        });
      }
    }

    // Check for vault/distribution contract vulnerabilities
    if (contract.name.toLowerCase().includes('vault') || contract.name.toLowerCase().includes('distributor')) {
      const hasDirectTransfer = /receive\(\)|\bfallback\(\)|address\.transfer/.test(content);

      if (hasDirectTransfer && hasValueTransfer) {
        vectors.push({
          id: `drain-vault-${contract.name}-${Date.now()}`,
          type: 'Forced Value Injection & Drain',
          severity: 'High',
          contracts: [contract.name],
          description: `Vault contract ${contract.name} vulnerable to forced value injection followed by drain`,
          location: contract.path,
          economicImpact: 'Attacker can force-send ether and then drain contract',
          exploitScenario: 'Selfdestruct a contract to force-send ether to vault → withdraw forced funds → drain contract',
          recommendation: 'Use pull-payment pattern and avoid relying on address(this).balance',
          probability: 'Low',
          potentialLoss: 'Contract balance at time of attack'
        });
      }
    }

    return vectors;
  }

  private detectEconomicMisalignment(contract: ContractFile): EconomicAttackVector[] {
    const vectors: EconomicAttackVector[] = [];
    const content = contract.content;

    // Check for fee/fee sharing mechanisms that may create perverse incentives
    const hasFeeLogic = /fee|protocolFee|performanceFee|feeTo|feeRate/.test(content);

    if (hasFeeLogic) {
      // Check if fees can be manipulated to benefit protocol at user expense
      const hasUserDisadvantage = /fee.*user|tax|charge/.test(content);

      if (hasUserDisadvantage) {
        vectors.push({
          id: `misalign-fee-${contract.name}-${Date.now()}`,
          type: 'Economic Incentive Misalignment',
          severity: 'Medium',
          contracts: [contract.name],
          description: `Fee structure in ${contract.name} may create incentives that harm users`,
          location: contract.path,
          economicImpact: 'Protocol may prioritize fee collection over user welfare',
          exploitScenario: 'Protocol manipulates fee collection mechanisms to maximize fees at user expense',
          recommendation: 'Review fee structure for proper incentive alignment. Implement fee caps or user protections.',
          probability: 'Low',
          potentialLoss: 'Accumulated over time through fees'
        });
      }
    }

    return vectors;
  }

  private detectFeeOnTransferVulnerabilities(contract: ContractFile): EconomicAttackVector[] {
    const vectors: EconomicAttackVector[] = [];
    const content = contract.content;

    // Check for token transfer operations without balance checks
    const hasTokenTransfer = /transfer|\.call|\.delegatecall/.test(content);
    const hasTokenBalance = /balanceOf|tokenBalance/.test(content);

    // Look for patterns that ignore fee-on-transfer token behavior
    if (hasTokenTransfer && !hasTokenBalance) {
      vectors.push({
        id: `feeontransfer-${contract.name}-${Date.now()}`,
        type: 'Fee-on-Transfer Token Ignorance',
        severity: 'High',
        contracts: [contract.name],
        description: `Contract ${contract.name} may not properly handle fee-on-transfer tokens`,
        location: contract.path,
        economicImpact: 'Incorrect accounting leads to fund loss when using fee-on-transfer tokens',
        exploitScenario: 'User sends fee-on-transfer token → contract expects full amount → actual received less → accounting error → fund loss',
        recommendation: 'Implement balance checks before and after token transfers to account for fees.',
        probability: 'Medium',
        potentialLoss: 'Amount of fee-on-transfer tokens sent'
      });
    }

    return vectors;
  }

  private detectEconomicReentrancyVectors(contract: ContractFile): EconomicAttackVector[] {
    const vectors: EconomicAttackVector[] = [];
    const content = contract.content;

    // Check for external calls followed by state changes
    const externalCallPattern = /(\w+)\.(call|delegatecall|transfer|send)\s*\(/g;
    const stateChangePattern = /(\w+)\s*=\s*|(\w+)\+\+|(\w+)--|(\w+)\+=|(\w+)\-=/g;

    if (externalCallPattern.test(content) && stateChangePattern.test(content)) {
      // Check if state changes happen after external calls
      const callMatches = Array.from(content.matchAll(externalCallPattern));
      const stateMatches = Array.from(content.matchAll(stateChangePattern));

      if (callMatches.length > 0 && stateMatches.length > 0) {
        // Simple position-based check for potential reentrancy
        const lastCallIndex = content.lastIndexOf(callMatches[callMatches.length - 1][0]);
        const firstStateChangeIndex = content.indexOf(stateMatches[0][0]);

        if (firstStateChangeIndex > lastCallIndex) {
          vectors.push({
            id: `reentrancy-economic-${contract.name}-${Date.now()}`,
            type: 'Economic Reentrancy',
            severity: 'High',
            contracts: [contract.name],
            description: `Function in ${contract.name} vulnerable to reentrancy after external calls`,
            location: contract.path,
            economicImpact: 'Attacker can reenter function to drain funds or manipulate state',
            exploitScenario: 'External call → callback to attacker contract → reenter original function → repeat malicious operations',
            recommendation: 'Use checks-effects-interactions pattern. Implement ReentrancyGuard.',
            probability: 'Medium',
            potentialLoss: 'All contract funds'
          });
        }
      }
    }

    // Check for read-only reentrancy (view functions making external calls)
    const viewFunctionPattern = /function\s+(\w+)\s*\([^)]*\)\s+(?:public|external)\s+view/g;
    const viewMatches = content.matchAll(viewFunctionPattern);

    for (const match of viewMatches) {
      const functionName = match[1];
      const funcStart = match.index!;
      
      // Extract function body
      let braceCount = 0;
      let endIdx = funcStart + match[0].length;
      while (endIdx < content.length) {
        if (content[endIdx] === '{') {
          braceCount++;
          if (braceCount === 1) {
            // We found the start of the function body
            break;
          }
        }
        endIdx++;
      }

      if (braceCount === 1) {
        let funcEnd = endIdx;
        braceCount = 1; // We start with one open brace
        while (funcEnd < content.length && braceCount > 0) {
          if (content[funcEnd] === '{') braceCount++;
          if (content[funcEnd] === '}') braceCount--;
          funcEnd++;
        }

        if (braceCount === 0) {
          const functionBody = content.substring(endIdx, funcEnd - 1);
          
          // Check if view function makes external calls
          if (/\w+\.(call|transfer|send|delegatecall)/.test(functionBody)) {
            vectors.push({
              id: `readonly-reentrancy-${contract.name}-${Date.now()}`,
              type: 'Read-Only Reentrancy',
              severity: 'High',
              contracts: [contract.name],
              description: `View function ${functionName} in ${contract.name} makes external calls, vulnerable to read-only reentrancy`,
              location: `${contract.path}::${functionName}`,
              economicImpact: 'Attacker can manipulate state while view function is being read',
              exploitScenario: 'View function calls external contract → external contract calls back → manipulates state during read operation',
              recommendation: 'Avoid external calls in view functions. If necessary, use ReentrancyGuard.',
              probability: 'Low',
              potentialLoss: 'Dependent on state being read'
            });
          }
        }
      }
    }

    return vectors;
  }

  private detectCrossContractEconomicAttacks(): EconomicAttackVector[] {
    const vectors: EconomicAttackVector[] = [];

    // Analyze interactions between contracts
    if (this.contracts.length > 1) {
      // Look for patterns where multiple contracts interact with shared state
      const tokenContracts = this.contracts.filter(contract => 
        contract.name.toLowerCase().includes('token') || 
        contract.name.toLowerCase().includes('erc20') ||
        /totalSupply|balanceOf|transfer|approve/.test(contract.content)
      );

      const vaultContracts = this.contracts.filter(contract => 
        contract.name.toLowerCase().includes('vault') || 
        contract.name.toLowerCase().includes('pool') ||
        /deposit|withdraw|shares|totalAssets/.test(contract.content)
      );

      if (tokenContracts.length > 0 && vaultContracts.length > 0) {
        // Check for share inflation attacks
        vectors.push({
          id: `cross-share-inflation-${Date.now()}`,
          type: 'Cross-Contract Share Inflation Attack',
          severity: 'Critical',
          contracts: [...tokenContracts.map(c => c.name), ...vaultContracts.map(c => c.name)],
          description: 'Token and vault contracts may be vulnerable to share inflation through donation attacks',
          location: 'Cross-contract interaction',
          economicImpact: 'Attacker can inflate share prices and drain funds from vaults',
          exploitScenario: 'Direct transfer tokens to vault → manipulate share price → redeem inflated shares → drain vault',
          recommendation: 'Implement proper share price calculation with balanceOf checks. Add minimum share amounts.',
          probability: 'Medium',
          potentialLoss: 'Total value in all vaults'
        });
      }

      // Look for cross-protocol composability risks
      const protocolContracts = this.contracts.filter(contract => {
        const content = contract.content;
        return /uniswap|curve|aave|compound|maker|yearn/.test(content);
      });

      if (protocolContracts.length > 1) {
        vectors.push({
          id: `cross-protocol-${Date.now()}`,
          type: 'Cross-Protocol Composability Risk',
          severity: 'High',
          contracts: protocolContracts.map(c => c.name),
          description: 'Multiple DeFi protocols used together may create complex exploit vectors',
          location: 'Cross-protocol interaction',
          economicImpact: 'Complex attacks spanning multiple protocols can drain funds',
          exploitScenario: 'Attack spans multiple protocols simultaneously, exploiting state inconsistencies',
          recommendation: 'Validate assumptions at each protocol boundary. Implement circuit breakers.',
          probability: 'Low',
          potentialLoss: 'Total value across all connected protocols'
        });
      }
    }

    return vectors;
  }

  private calculateRiskScore(vectors: EconomicAttackVector[]): number {
    const severityWeights: { [key: string]: number } = {
      'Critical': 10,
      'High': 7,
      'Medium': 4,
      'Low': 1
    };

    const probabilityWeights: { [key: string]: number } = {
      'High': 3,
      'Medium': 2,
      'Low': 1
    };

    return vectors.reduce((sum, vector) => {
      const severityWeight = severityWeights[vector.severity] || 0;
      const probabilityWeight = probabilityWeights[vector.probability] || 0;
      return sum + (severityWeight * probabilityWeight);
    }, 0);
  }

  private estimateFundLossExposure(vectors: EconomicAttackVector[]): string {
    // Calculate maximum potential loss based on critical and high severity vectors
    const criticalVectors = vectors.filter(v => v.severity === 'Critical');
    const highVectors = vectors.filter(v => v.severity === 'High');

    if (criticalVectors.length > 0) {
      return 'High - Critical vulnerabilities may result in total fund loss';
    } else if (highVectors.length > 0) {
      return 'Medium - High severity vulnerabilities may result in significant fund loss';
    } else {
      return 'Low - Primarily medium/low severity risks';
    }
  }

  private estimateMitigationEffectiveness(vectors: EconomicAttackVector[]): number {
    // Start with 100% and reduce based on severity and probability
    let effectiveness = 100;

    vectors.forEach(vector => {
      if (vector.severity === 'Critical' && vector.probability === 'High') {
        effectiveness -= 30; // Critical high probability = big reduction
      } else if (vector.severity === 'Critical' || vector.probability === 'High') {
        effectiveness -= 20; // Either critical or high probability = medium reduction
      } else if (vector.severity === 'High' || vector.probability === 'Medium') {
        effectiveness -= 10; // Other combinations = small reduction
      }
    });

    return Math.max(0, effectiveness); // Cap at 0%
  }

  private generateEconomicRecommendations(vectors: EconomicAttackVector[]): string[] {
    const recommendations: string[] = [];
    
    const criticalCount = vectors.filter(v => v.severity === 'Critical').length;
    const highCount = vectors.filter(v => v.severity === 'High').length;
    const flashLoanVectors = vectors.filter(v => v.type.includes('Flash Loan'));
    const oracleVectors = vectors.filter(v => v.type.includes('Oracle'));

    if (criticalCount > 0) {
      recommendations.push(`URGENT: ${criticalCount} critical economic attack vectors detected. Immediate remediation required to prevent fund loss.`);
    }

    if (highCount > 0) {
      recommendations.push(`${highCount} high severity economic risks identified. Address these to protect user funds.`);
    }

    if (flashLoanVectors.length > 0) {
      recommendations.push(`Implement flash loan resistant designs. Consider TWAP oracles and transaction value limits.`);
    }

    if (oracleVectors.length > 0) {
      recommendations.push(`Review oracle implementation. Use multi-oracle systems or TWAP mechanisms for critical operations.`);
    }

    if (vectors.some(v => v.type.includes('Reentrancy'))) {
      recommendations.push(`Implement ReentrancyGuard and follow checks-effects-interactions pattern in all value-handling functions.`);
    }

    if (vectors.some(v => v.type.includes('Governance'))) {
      recommendations.push(`Add governance timelocks and voting power validation to prevent flash loan governance attacks.`);
    }

    return recommendations;
  }
}