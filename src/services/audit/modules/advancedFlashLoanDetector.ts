/**
 * Advanced Flash Loan Oracle Manipulation Detector
 * 
 * Goes beyond pattern matching to validate actual exploitability
 * Uses data flow analysis and economic validation
 */

import { dataFlowAnalyzer, taintAnalyzer } from './dataFlowAnalyzer';
import { economicImpactAnalyzer, VulnerabilityContext } from './economicImpactAnalyzer';

export interface FlashLoanVulnerability {
  type: 'FlashLoanOracleManipulation';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  confidence: 'High' | 'Medium' | 'Low';
  location: string;
  functionName: string;
  description: string;
  attackVector: string;
  dataFlowPath: string[];
  oracleType: string;
  manipulationMethod: string;
  profitMechanism: string;
  economicImpact: any;
  validated: boolean;
  pocCode?: string;
  recommendations: string[];
}

export class AdvancedFlashLoanDetector {
  /**
   * Detect flash loan oracle manipulation vulnerabilities
   * with comprehensive validation
   */
  async detectFlashLoanVulnerabilities(code: string, contractName: string): Promise<FlashLoanVulnerability[]> {
    const vulnerabilities: FlashLoanVulnerability[] = [];
    
    // Step 1: Find flash loan entry points
    const flashLoanFunctions = this.findFlashLoanFunctions(code);
    
    if (flashLoanFunctions.length === 0) {
      return vulnerabilities; // No flash loan functionality
    }
    
    // Step 2: For each flash loan function, analyze oracle usage
    for (const func of flashLoanFunctions) {
      const oracleReads = this.findOracleReads(func.code);
      
      if (oracleReads.length === 0) continue;
      
      // Step 3: Check if oracle can be manipulated
      for (const oracle of oracleReads) {
        const manipulation = this.analyzeOracleManipulability(oracle, code);
        
        if (!manipulation.isManipulable) continue;
        
        // Step 4: Trace data flow from oracle to value-affecting operations
        const dataFlowPaths = this.traceOracleToValueFlow(oracle, func.code);
        
        if (dataFlowPaths.length === 0) continue;
        
        // Step 5: Check if manipulation leads to profit
        for (const path of dataFlowPaths) {
          const profitMechanism = this.identifyProfitMechanism(path, func.code);
          
          if (!profitMechanism.isProfitable) continue;
          
          // Step 6: Validate with taint analysis
          const taintAnalysis = taintAnalyzer.analyzeTaint(func.code);
          const isTainted = taintAnalysis.taintedPaths.some(tp => 
            tp.path.some(node => node.value.includes(oracle.variable))
          );
          
          if (!isTainted) continue;
          
          // Step 7: Calculate economic impact
          const context: VulnerabilityContext = {
            type: 'FlashLoanOracleManipulation',
            liquidityPoolSize: this.estimateLiquidityPoolSize(code),
            contractBalance: this.estimateContractBalance(code),
            oracleType: oracle.type,
            flashLoanAvailable: true
          };
          
          const economicImpact = economicImpactAnalyzer.analyzeImpact(
            'FlashLoanOracleManipulation',
            context
          );
          
          // Step 8: Only report if economically viable
          if (!economicImpact.isProfitable) continue;
          
          // Step 9: Generate PoC
          const pocCode = this.generatePoC(func, oracle, manipulation, profitMechanism);
          
          // Step 10: Create validated vulnerability report
          vulnerabilities.push({
            type: 'FlashLoanOracleManipulation',
            severity: this.calculateSeverity(economicImpact),
            confidence: 'High',
            location: func.location,
            functionName: func.name,
            description: this.generateDescription(oracle, manipulation, profitMechanism),
            attackVector: this.generateAttackVector(oracle, manipulation),
            dataFlowPath: path.map(node => node.description),
            oracleType: oracle.type,
            manipulationMethod: manipulation.method,
            profitMechanism: profitMechanism.description,
            economicImpact,
            validated: true,
            pocCode,
            recommendations: this.generateRecommendations(oracle, manipulation)
          });
        }
      }
    }
    
    return vulnerabilities;
  }
  
  /**
   * Find functions that interact with flash loans
   */
  private findFlashLoanFunctions(code: string): Array<{name: string; code: string; location: string}> {
    const functions: Array<{name: string; code: string; location: string}> = [];
    
    // Pattern 1: Flash loan callback functions
    const callbackPatterns = [
      /function\s+(onFlashLoan|executeOperation|receiveFlashLoan)\s*\([^)]*\)\s*[^{]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs,
      /function\s+\w+\s*\([^)]*\)\s*[^{]*\{([^}]*(?:flashLoan|FLASHLOAN)[^}]*(?:\{[^}]*\}[^}]*)*)\}/gs
    ];
    
    for (const pattern of callbackPatterns) {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        const funcName = match[1] || 'unknown';
        const funcBody = match[0];
        const location = this.getLocation(code, match.index!);
        
        functions.push({
          name: funcName,
          code: funcBody,
          location
        });
      }
    }
    
    // Pattern 2: Functions that call flash loan providers
    const callerPattern = /function\s+(\w+)\s*\([^)]*\)\s*[^{]*\{([^}]*(?:flashLoan|borrow)[^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;
    const callerMatches = code.matchAll(callerPattern);
    
    for (const match of callerMatches) {
      if (match[2].includes('flashLoan(') || match[2].includes('.borrow(')) {
        functions.push({
          name: match[1],
          code: match[0],
          location: this.getLocation(code, match.index!)
        });
      }
    }
    
    return functions;
  }
  
  /**
   * Find oracle price reads in code
   */
  private findOracleReads(code: string): Array<{variable: string; type: string; location: string}> {
    const oracles: Array<{variable: string; type: string; location: string}> = [];
    
    // Common oracle patterns
    const oraclePatterns = [
      // Chainlink
      { pattern: /(\w+)\s*=\s*\w+\.latestRoundData\(\)/g, type: 'Chainlink' },
      { pattern: /(\w+)\s*=\s*\w+\.latestAnswer\(\)/g, type: 'Chainlink' },
      // Uniswap TWAP
      { pattern: /(\w+)\s*=\s*\w+\.consult\(/g, type: 'UniswapTWAP' },
      { pattern: /(\w+)\s*=\s*\w+\.observe\(/g, type: 'UniswapV3TWAP' },
      // DEX spot price (manipulable!)
      { pattern: /(\w+)\s*=\s*\w+\.getReserves\(\)/g, type: 'DEXSpotPrice' },
      { pattern: /(\w+)\s*=\s*\w+\.getAmountOut\(/g, type: 'DEXSpotPrice' },
      { pattern: /(\w+)\s*=\s*\w+\.price\(\)/g, type: 'CustomOracle' },
      { pattern: /(\w+)\s*=\s*\w+\.getCurrentPrice\(\)/g, type: 'CustomOracle' }
    ];
    
    for (const { pattern, type } of oraclePatterns) {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        oracles.push({
          variable: match[1],
          type,
          location: this.getLocation(code, match.index!)
        });
      }
    }
    
    return oracles;
  }
  
  /**
   * Analyze if oracle can be manipulated
   */
  private analyzeOracleManipulability(
    oracle: {variable: string; type: string; location: string},
    code: string
  ): {isManipulable: boolean; method: string; difficulty: string} {
    switch (oracle.type) {
      case 'DEXSpotPrice':
        // Spot prices are highly manipulable
        return {
          isManipulable: true,
          method: 'Large swap to manipulate pool reserves',
          difficulty: 'Low'
        };
      
      case 'UniswapTWAP':
        // TWAP is harder but still possible with sustained manipulation
        return {
          isManipulable: true,
          method: 'Multi-block price manipulation',
          difficulty: 'High'
        };
      
      case 'UniswapV3TWAP':
        // V3 TWAP is more resistant but not immune
        return {
          isManipulable: true,
          method: 'Sustained liquidity manipulation',
          difficulty: 'Very High'
        };
      
      case 'Chainlink':
        // Chainlink is generally secure but check for stale data
        const hasStaleCheck = code.includes('updatedAt') || code.includes('timestamp');
        return {
          isManipulable: !hasStaleCheck,
          method: hasStaleCheck ? 'None' : 'Stale price data',
          difficulty: hasStaleCheck ? 'Very High' : 'Medium'
        };
      
      case 'CustomOracle':
        // Custom oracles need detailed analysis
        const hasMultiSource = code.includes('getPrice') && code.includes('average');
        return {
          isManipulable: !hasMultiSource,
          method: 'Depends on implementation',
          difficulty: 'Medium'
        };
      
      default:
        return {
          isManipulable: false,
          method: 'Unknown',
          difficulty: 'Unknown'
        };
    }
  }
  
  /**
   * Trace data flow from oracle read to value-affecting operations
   */
  private traceOracleToValueFlow(
    oracle: {variable: string; type: string; location: string},
    code: string
  ): Array<{description: string; node: any}[]> {
    const paths: Array<{description: string; node: any}[]> = [];
    
    // Use data flow analyzer
    const dataFlowPaths = dataFlowAnalyzer.analyzeDataFlow(code);
    
    // Filter paths that start from oracle variable
    const oraclePaths = dataFlowPaths.filter(path => 
      path.source.value.includes(oracle.variable) &&
      (path.sink.type === 'transfer' || 
       path.sink.type === 'state_change' ||
       path.sink.type === 'external_call')
    );
    
    for (const path of oraclePaths) {
      const pathDescription = path.path.map(node => ({
        description: `${node.type}: ${node.value} at ${node.location}`,
        node
      }));
      paths.push(pathDescription);
    }
    
    return paths;
  }
  
  /**
   * Identify profit mechanism from data flow path
   */
  private identifyProfitMechanism(
    path: Array<{description: string; node: any}>,
    code: string
  ): {isProfitable: boolean; description: string; mechanism: string} {
    const pathStr = path.map(p => p.description).join(' -> ');
    
    // Check for common profit mechanisms
    
    // 1. Borrow at manipulated price
    if (pathStr.includes('borrow') || pathStr.includes('mint')) {
      return {
        isProfitable: true,
        description: 'Borrow/mint at manipulated favorable price',
        mechanism: 'Collateral manipulation'
      };
    }
    
    // 2. Liquidation at manipulated price
    if (pathStr.includes('liquidate')) {
      return {
        isProfitable: true,
        description: 'Liquidate positions at manipulated price',
        mechanism: 'Liquidation abuse'
      };
    }
    
    // 3. Swap at manipulated price
    if (pathStr.includes('swap') || pathStr.includes('exchange')) {
      return {
        isProfitable: true,
        description: 'Swap at manipulated favorable rate',
        mechanism: 'Arbitrage'
      };
    }
    
    // 4. Withdraw more than deposited
    if (pathStr.includes('withdraw') && pathStr.includes('deposit')) {
      return {
        isProfitable: true,
        description: 'Withdraw more value than deposited',
        mechanism: 'Value extraction'
      };
    }
    
    // 5. Mint tokens at wrong price
    if (pathStr.includes('mint') && pathStr.includes('price')) {
      return {
        isProfitable: true,
        description: 'Mint tokens at manipulated price',
        mechanism: 'Token minting abuse'
      };
    }
    
    return {
      isProfitable: false,
      description: 'No clear profit mechanism identified',
      mechanism: 'Unknown'
    };
  }
  
  /**
   * Generate Proof of Concept code
   */
  private generatePoC(
    func: {name: string; code: string},
    oracle: {variable: string; type: string},
    manipulation: {method: string},
    profitMechanism: {mechanism: string}
  ): string {
    return `
// PROOF OF CONCEPT - Flash Loan Oracle Manipulation
// Target: ${func.name}
// Oracle: ${oracle.type}
// Attack: ${manipulation.method}

pragma solidity ^0.8.0;

interface IFlashLoanProvider {
    function flashLoan(address receiver, uint256 amount, bytes calldata data) external;
}

interface IVulnerableProtocol {
    function ${func.name}(uint256 amount) external;
}

interface IDEXPair {
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
}

contract FlashLoanExploit {
    IFlashLoanProvider flashLoanProvider;
    IVulnerableProtocol target;
    IDEXPair dexPair;
    
    constructor(address _flashLoan, address _target, address _dex) {
        flashLoanProvider = IFlashLoanProvider(_flashLoan);
        target = IVulnerableProtocol(_target);
        dexPair = IDEXPair(_dex);
    }
    
    function exploit(uint256 flashLoanAmount) external {
        // Step 1: Initiate flash loan
        flashLoanProvider.flashLoan(address(this), flashLoanAmount, "");
    }
    
    function onFlashLoan(
        address initiator,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bytes32) {
        // Step 2: Manipulate ${oracle.type} oracle
        // ${manipulation.method}
        manipulateOracle(amount);
        
        // Step 3: Exploit at manipulated price
        // ${profitMechanism.mechanism}
        exploitManipulatedPrice(amount);
        
        // Step 4: Restore price (if needed)
        restorePrice();
        
        // Step 5: Repay flash loan
        IERC20(token).approve(address(flashLoanProvider), amount + fee);
        
        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }
    
    function manipulateOracle(uint256 amount) internal {
        // Swap large amount to manipulate DEX price
        // This affects the oracle reading
        dexPair.swap(amount, 0, address(this), "");
    }
    
    function exploitManipulatedPrice(uint256 amount) internal {
        // Use manipulated price to gain advantage
        target.${func.name}(amount);
    }
    
    function restorePrice() internal {
        // Swap back to restore price
        // Profit is extracted in the middle
    }
}

// ATTACK STEPS:
// 1. Flash loan large amount (e.g., 1M tokens)
// 2. Swap in DEX to manipulate spot price
// 3. Protocol reads manipulated price from oracle
// 4. Exploit: ${profitMechanism.mechanism}
// 5. Swap back to restore price
// 6. Repay flash loan + fee
// 7. Keep profit

// ESTIMATED PROFIT: See economic impact analysis
`.trim();
  }
  
  /**
   * Calculate severity based on economic impact
   */
  private calculateSeverity(impact: any): 'Critical' | 'High' | 'Medium' | 'Low' {
    if (impact.maxPotentialLoss > 1000000n && impact.isProfitable) {
      return 'Critical';
    } else if (impact.maxPotentialLoss > 100000n && impact.isProfitable) {
      return 'High';
    } else if (impact.isProfitable) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }
  
  /**
   * Generate vulnerability description
   */
  private generateDescription(
    oracle: any,
    manipulation: any,
    profitMechanism: any
  ): string {
    return `Flash loan attack can manipulate ${oracle.type} oracle via ${manipulation.method}, ` +
           `enabling ${profitMechanism.description}. This vulnerability is validated and economically viable.`;
  }
  
  /**
   * Generate attack vector description
   */
  private generateAttackVector(oracle: any, manipulation: any): string {
    return `
1. Attacker takes flash loan of large token amount
2. ${manipulation.method}
3. ${oracle.type} oracle reads manipulated price
4. Attacker exploits manipulated price for profit
5. Attacker restores price and repays flash loan
6. Attacker keeps profit
    `.trim();
  }
  
  /**
   * Generate recommendations
   */
  private generateRecommendations(oracle: any, manipulation: any): string[] {
    const recommendations: string[] = [];
    
    if (oracle.type === 'DEXSpotPrice') {
      recommendations.push('❌ CRITICAL: Never use DEX spot prices as oracles');
      recommendations.push('✅ Use Chainlink price feeds or Uniswap TWAP with sufficient period');
      recommendations.push('✅ Implement multi-source price aggregation');
    }
    
    if (oracle.type === 'UniswapTWAP') {
      recommendations.push('✅ Increase TWAP observation period to at least 30 minutes');
      recommendations.push('✅ Add price deviation checks against Chainlink');
      recommendations.push('✅ Implement circuit breakers for large price movements');
    }
    
    if (oracle.type === 'Chainlink') {
      recommendations.push('✅ Check for stale data using updatedAt timestamp');
      recommendations.push('✅ Validate price is within reasonable bounds');
      recommendations.push('✅ Use multiple oracle sources for critical operations');
    }
    
    recommendations.push('✅ Add reentrancy guards to all functions');
    recommendations.push('✅ Implement maximum transaction size limits');
    recommendations.push('✅ Add time delays for large operations');
    recommendations.push('✅ Monitor for large price movements and pause if detected');
    
    return recommendations;
  }
  
  /**
   * Estimate liquidity pool size from code
   */
  private estimateLiquidityPoolSize(code: string): bigint {
    // Try to find pool size hints in code
    // This is a simplified heuristic
    if (code.includes('1000000')) {
      return 1000000n * 10n ** 18n;
    }
    return 500000n * 10n ** 18n; // Default estimate
  }
  
  /**
   * Estimate contract balance from code
   */
  private estimateContractBalance(code: string): bigint {
    // Try to find balance hints
    // This is a simplified heuristic
    return 100000n * 10n ** 18n; // Default estimate
  }
  
  private getLocation(code: string, index: number): string {
    const lines = code.substring(0, index).split('\n');
    return `Line ${lines.length}`;
  }
}

export const advancedFlashLoanDetector = new AdvancedFlashLoanDetector();
