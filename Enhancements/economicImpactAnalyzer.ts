/**
 * Economic Impact Analyzer
 * 
 * Calculates the economic feasibility and impact of vulnerabilities
 * Determines if a vulnerability is actually exploitable for profit
 */

export interface EconomicImpact {
  maxPotentialLoss: bigint;          // Maximum funds at risk
  attackCapitalRequired: bigint;     // Capital needed to execute attack
  estimatedProfit: bigint;           // Expected profit from attack
  gasCostEstimate: bigint;           // Estimated gas cost
  flashLoanFee: bigint;              // Flash loan fees if applicable
  isProfitable: boolean;             // Is attack economically viable?
  profitMargin: number;              // Profit margin percentage
  riskScore: number;                 // 0-100 risk score
  attackComplexity: 'low' | 'medium' | 'high' | 'very_high';
  timeToExecute: string;             // Estimated time to execute
  detectionLikelihood: 'low' | 'medium' | 'high';
}

export interface VulnerabilityContext {
  type: string;
  contractBalance?: bigint;
  tokenBalances?: Map<string, bigint>;
  liquidityPoolSize?: bigint;
  governanceTokenSupply?: bigint;
  governanceTokenPrice?: number;
  oracleType?: string;
  flashLoanAvailable?: boolean;
  hasTimelock?: boolean;
  timelockDuration?: number;
}

export class EconomicImpactAnalyzer {
  private readonly FLASH_LOAN_FEE_RATE = 0.0009; // 0.09% typical Aave fee
  private readonly GAS_PRICE_GWEI = 30n; // Average gas price
  private readonly PROFIT_THRESHOLD = 1000n; // Minimum $1000 to be considered profitable
  
  /**
   * Analyze economic impact of a vulnerability
   */
  analyzeImpact(vulnType: string, context: VulnerabilityContext): EconomicImpact {
    switch (vulnType) {
      case 'FlashLoanOracleManipulation':
        return this.analyzeFlashLoanAttack(context);
      
      case 'GovernanceAttack':
        return this.analyzeGovernanceAttack(context);
      
      case 'Reentrancy':
        return this.analyzeReentrancyAttack(context);
      
      case 'PriceManipulation':
        return this.analyzePriceManipulation(context);
      
      case 'AccessControl':
        return this.analyzeAccessControlBypass(context);
      
      case 'IntegerOverflow':
        return this.analyzeIntegerOverflow(context);
      
      default:
        return this.analyzeGenericVulnerability(context);
    }
  }
  
  /**
   * Analyze flash loan + oracle manipulation attack
   */
  private analyzeFlashLoanAttack(context: VulnerabilityContext): EconomicImpact {
    // Estimate maximum flash loan available
    const maxFlashLoan = context.liquidityPoolSize || 1000000n * 10n ** 18n; // 1M tokens default
    
    // Calculate flash loan fee
    const flashLoanFee = this.calculateFlashLoanFee(maxFlashLoan);
    
    // Estimate price impact from manipulation
    const priceImpact = this.estimatePriceImpact(maxFlashLoan, context);
    
    // Calculate potential profit from arbitrage
    const arbitrageProfit = this.calculateArbitrageProfit(priceImpact, maxFlashLoan);
    
    // Estimate gas cost (complex multi-step attack)
    const gasCost = this.estimateGasCost(500000n); // ~500k gas for complex attack
    
    // Calculate total capital required
    const capitalRequired = flashLoanFee + gasCost;
    
    // Calculate net profit
    const netProfit = arbitrageProfit - capitalRequired;
    
    // Determine if profitable
    const isProfitable = netProfit > this.PROFIT_THRESHOLD;
    
    // Calculate profit margin
    const profitMargin = capitalRequired > 0n 
      ? Number(netProfit * 100n / capitalRequired) 
      : 0;
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore({
      potentialLoss: arbitrageProfit,
      isProfitable,
      complexity: 'high',
      detectionLikelihood: 'medium'
    });
    
    return {
      maxPotentialLoss: context.contractBalance || arbitrageProfit,
      attackCapitalRequired: capitalRequired,
      estimatedProfit: netProfit,
      gasCostEstimate: gasCost,
      flashLoanFee,
      isProfitable,
      profitMargin,
      riskScore,
      attackComplexity: 'high',
      timeToExecute: '1 block (~12 seconds)',
      detectionLikelihood: 'medium'
    };
  }
  
  /**
   * Analyze governance attack (flash loan voting)
   */
  private analyzeGovernanceAttack(context: VulnerabilityContext): EconomicImpact {
    const tokenSupply = context.governanceTokenSupply || 1000000n * 10n ** 18n;
    const tokenPrice = context.governanceTokenPrice || 10; // $10 per token
    
    // Calculate tokens needed for majority (51%)
    const tokensNeeded = (tokenSupply * 51n) / 100n;
    
    // Calculate capital required to buy tokens
    const capitalRequired = BigInt(Math.floor(Number(tokensNeeded) * tokenPrice / 10**18));
    
    // Estimate value that can be drained
    const drainableValue = context.contractBalance || 0n;
    
    // Gas cost for governance attack
    const gasCost = this.estimateGasCost(300000n); // Proposal + vote + execute
    
    // Check if timelock exists (affects feasibility)
    const hasTimelock = context.hasTimelock || false;
    const complexity = hasTimelock ? 'very_high' : 'high';
    const timeToExecute = hasTimelock 
      ? `${context.timelockDuration || 48} hours (timelock)` 
      : '1 block';
    
    // Net profit
    const netProfit = drainableValue - capitalRequired - gasCost;
    const isProfitable = netProfit > this.PROFIT_THRESHOLD;
    
    const profitMargin = capitalRequired > 0n 
      ? Number(netProfit * 100n / capitalRequired) 
      : 0;
    
    const riskScore = this.calculateRiskScore({
      potentialLoss: drainableValue,
      isProfitable,
      complexity,
      detectionLikelihood: hasTimelock ? 'high' : 'medium'
    });
    
    return {
      maxPotentialLoss: drainableValue,
      attackCapitalRequired: capitalRequired,
      estimatedProfit: netProfit,
      gasCostEstimate: gasCost,
      flashLoanFee: 0n,
      isProfitable,
      profitMargin,
      riskScore,
      attackComplexity: complexity,
      timeToExecute,
      detectionLikelihood: hasTimelock ? 'high' : 'medium'
    };
  }
  
  /**
   * Analyze reentrancy attack
   */
  private analyzeReentrancyAttack(context: VulnerabilityContext): EconomicImpact {
    const contractBalance = context.contractBalance || 0n;
    
    // Reentrancy typically requires minimal capital (just gas)
    const gasCost = this.estimateGasCost(200000n);
    const capitalRequired = gasCost;
    
    // Can potentially drain entire contract balance
    const maxDrain = contractBalance;
    
    const netProfit = maxDrain - capitalRequired;
    const isProfitable = netProfit > this.PROFIT_THRESHOLD;
    
    const profitMargin = capitalRequired > 0n 
      ? Number(netProfit * 100n / capitalRequired) 
      : 0;
    
    const riskScore = this.calculateRiskScore({
      potentialLoss: maxDrain,
      isProfitable,
      complexity: 'medium',
      detectionLikelihood: 'low'
    });
    
    return {
      maxPotentialLoss: maxDrain,
      attackCapitalRequired: capitalRequired,
      estimatedProfit: netProfit,
      gasCostEstimate: gasCost,
      flashLoanFee: 0n,
      isProfitable,
      profitMargin,
      riskScore,
      attackComplexity: 'medium',
      timeToExecute: '1 block',
      detectionLikelihood: 'low'
    };
  }
  
  /**
   * Analyze price manipulation attack
   */
  private analyzePriceManipulation(context: VulnerabilityContext): EconomicImpact {
    const poolSize = context.liquidityPoolSize || 100000n * 10n ** 18n;
    
    // Estimate capital needed to significantly move price (10% of pool)
    const capitalRequired = poolSize / 10n;
    
    // Estimate profit from manipulation
    const priceImpact = this.estimatePriceImpact(capitalRequired, context);
    const profit = (capitalRequired * BigInt(priceImpact)) / 100n;
    
    const gasCost = this.estimateGasCost(300000n);
    const netProfit = profit - gasCost;
    const isProfitable = netProfit > this.PROFIT_THRESHOLD;
    
    const profitMargin = capitalRequired > 0n 
      ? Number(netProfit * 100n / capitalRequired) 
      : 0;
    
    const riskScore = this.calculateRiskScore({
      potentialLoss: profit,
      isProfitable,
      complexity: 'high',
      detectionLikelihood: 'high'
    });
    
    return {
      maxPotentialLoss: context.contractBalance || profit,
      attackCapitalRequired: capitalRequired,
      estimatedProfit: netProfit,
      gasCostEstimate: gasCost,
      flashLoanFee: 0n,
      isProfitable,
      profitMargin,
      riskScore,
      attackComplexity: 'high',
      timeToExecute: '1-2 blocks',
      detectionLikelihood: 'high'
    };
  }
  
  /**
   * Analyze access control bypass
   */
  private analyzeAccessControlBypass(context: VulnerabilityContext): EconomicImpact {
    const contractBalance = context.contractBalance || 0n;
    
    // Access control bypass typically requires minimal capital
    const gasCost = this.estimateGasCost(100000n);
    const capitalRequired = gasCost;
    
    // Can potentially access all funds
    const maxDrain = contractBalance;
    
    const netProfit = maxDrain - capitalRequired;
    const isProfitable = netProfit > this.PROFIT_THRESHOLD;
    
    const profitMargin = capitalRequired > 0n 
      ? Number(netProfit * 100n / capitalRequired) 
      : 0;
    
    const riskScore = this.calculateRiskScore({
      potentialLoss: maxDrain,
      isProfitable,
      complexity: 'low',
      detectionLikelihood: 'low'
    });
    
    return {
      maxPotentialLoss: maxDrain,
      attackCapitalRequired: capitalRequired,
      estimatedProfit: netProfit,
      gasCostEstimate: gasCost,
      flashLoanFee: 0n,
      isProfitable,
      profitMargin,
      riskScore,
      attackComplexity: 'low',
      timeToExecute: '1 transaction',
      detectionLikelihood: 'low'
    };
  }
  
  /**
   * Analyze integer overflow/underflow
   */
  private analyzeIntegerOverflow(context: VulnerabilityContext): EconomicImpact {
    const contractBalance = context.contractBalance || 0n;
    
    // Integer overflow can allow minting or balance manipulation
    const gasCost = this.estimateGasCost(150000n);
    const capitalRequired = gasCost;
    
    // Potential to mint unlimited tokens or manipulate balances
    const maxImpact = contractBalance * 2n; // Conservative estimate
    
    const netProfit = maxImpact - capitalRequired;
    const isProfitable = netProfit > this.PROFIT_THRESHOLD;
    
    const profitMargin = capitalRequired > 0n 
      ? Number(netProfit * 100n / capitalRequired) 
      : 0;
    
    const riskScore = this.calculateRiskScore({
      potentialLoss: maxImpact,
      isProfitable,
      complexity: 'medium',
      detectionLikelihood: 'medium'
    });
    
    return {
      maxPotentialLoss: maxImpact,
      attackCapitalRequired: capitalRequired,
      estimatedProfit: netProfit,
      gasCostEstimate: gasCost,
      flashLoanFee: 0n,
      isProfitable,
      profitMargin,
      riskScore,
      attackComplexity: 'medium',
      timeToExecute: '1 transaction',
      detectionLikelihood: 'medium'
    };
  }
  
  /**
   * Analyze generic vulnerability
   */
  private analyzeGenericVulnerability(context: VulnerabilityContext): EconomicImpact {
    const contractBalance = context.contractBalance || 0n;
    const gasCost = this.estimateGasCost(200000n);
    
    return {
      maxPotentialLoss: contractBalance,
      attackCapitalRequired: gasCost,
      estimatedProfit: contractBalance - gasCost,
      gasCostEstimate: gasCost,
      flashLoanFee: 0n,
      isProfitable: contractBalance > this.PROFIT_THRESHOLD + gasCost,
      profitMargin: 0,
      riskScore: 50,
      attackComplexity: 'medium',
      timeToExecute: 'Unknown',
      detectionLikelihood: 'medium'
    };
  }
  
  /**
   * Calculate flash loan fee
   */
  private calculateFlashLoanFee(amount: bigint): bigint {
    return BigInt(Math.floor(Number(amount) * this.FLASH_LOAN_FEE_RATE));
  }
  
  /**
   * Estimate price impact from large trade
   */
  private estimatePriceImpact(tradeSize: bigint, context: VulnerabilityContext): number {
    const poolSize = context.liquidityPoolSize || 1000000n * 10n ** 18n;
    
    // Simplified constant product formula impact
    // Actual impact = tradeSize / (poolSize + tradeSize) * 100
    const impact = Number(tradeSize * 100n / (poolSize + tradeSize));
    
    return Math.min(impact, 50); // Cap at 50% impact
  }
  
  /**
   * Calculate arbitrage profit from price manipulation
   */
  private calculateArbitrageProfit(priceImpact: number, tradeSize: bigint): bigint {
    // Simplified: profit is roughly proportional to price impact and trade size
    // In reality, this depends on multiple pools and arbitrage opportunities
    const profitRate = priceImpact / 100;
    return BigInt(Math.floor(Number(tradeSize) * profitRate * 0.5)); // 50% efficiency
  }
  
  /**
   * Estimate gas cost
   */
  private estimateGasCost(gasUnits: bigint): bigint {
    // Convert gas units to ETH cost
    const gasCostWei = gasUnits * this.GAS_PRICE_GWEI * 10n ** 9n;
    
    // Convert to USD (assuming $3000 ETH)
    const ethPrice = 3000n;
    const gasCostUSD = (gasCostWei * ethPrice) / 10n ** 18n;
    
    return gasCostUSD;
  }
  
  /**
   * Calculate risk score (0-100)
   */
  private calculateRiskScore(params: {
    potentialLoss: bigint;
    isProfitable: boolean;
    complexity: string;
    detectionLikelihood: string;
  }): number {
    let score = 0;
    
    // Potential loss factor (0-40 points)
    const lossUSD = Number(params.potentialLoss);
    if (lossUSD > 10000000) score += 40; // >$10M
    else if (lossUSD > 1000000) score += 35; // >$1M
    else if (lossUSD > 100000) score += 30; // >$100K
    else if (lossUSD > 10000) score += 20; // >$10K
    else score += 10;
    
    // Profitability factor (0-30 points)
    if (params.isProfitable) score += 30;
    else score += 5;
    
    // Complexity factor (0-15 points) - lower complexity = higher risk
    switch (params.complexity) {
      case 'low': score += 15; break;
      case 'medium': score += 10; break;
      case 'high': score += 5; break;
      case 'very_high': score += 2; break;
    }
    
    // Detection likelihood (0-15 points) - lower detection = higher risk
    switch (params.detectionLikelihood) {
      case 'low': score += 15; break;
      case 'medium': score += 10; break;
      case 'high': score += 5; break;
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * Format economic impact for display
   */
  formatImpact(impact: EconomicImpact): string {
    return `
Economic Impact Analysis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Max Potential Loss:     $${this.formatUSD(impact.maxPotentialLoss)}
💵 Attack Capital Required: $${this.formatUSD(impact.attackCapitalRequired)}
📈 Estimated Profit:        $${this.formatUSD(impact.estimatedProfit)}
⛽ Gas Cost:                $${this.formatUSD(impact.gasCostEstimate)}
${impact.flashLoanFee > 0n ? `💸 Flash Loan Fee:         $${this.formatUSD(impact.flashLoanFee)}\n` : ''}
✅ Profitable:              ${impact.isProfitable ? 'YES' : 'NO'}
📊 Profit Margin:           ${impact.profitMargin.toFixed(2)}%
🎯 Risk Score:              ${impact.riskScore}/100
⚡ Attack Complexity:       ${impact.attackComplexity.toUpperCase()}
⏱️  Time to Execute:        ${impact.timeToExecute}
👁️  Detection Likelihood:   ${impact.detectionLikelihood.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }
  
  private formatUSD(amount: bigint): string {
    const num = Number(amount);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    } else {
      return num.toFixed(2);
    }
  }
}

export const economicImpactAnalyzer = new EconomicImpactAnalyzer();
