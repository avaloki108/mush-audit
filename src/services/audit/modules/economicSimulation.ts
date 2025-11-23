export interface SimulationResult {
  attackPossible: boolean;
  profitPotential: string; // USD value
  requiredCapital: string; // USD value
  riskAssessment: string;
  mitigationStrategies: string[];
  simulationSteps: string[];
  mathProof?: string; // New: Shows the equation used
}

export class FlashLoanAttackSimulatorImpl {

  /**
   * Simulates Oracle Manipulation using Constant Product (x * y = k) formula.
   * Checks if the cost of manipulation (slippage + fees) < profit from skewed price.
   */
  simulateOracleManipulation(params: {
    poolLiquidityUSD: number; // Depth of the pool
    flashLoanAmount: number;
    collateralFactor: number; // e.g., 0.75 for lending protocols
    targetProfitPerUnit: number; // Profit per unit of currency borrowed at manipulated price
  }): SimulationResult {
    const { poolLiquidityUSD, flashLoanAmount, collateralFactor, targetProfitPerUnit } = params;

    // CPMM Math: x * y = k
    // We are selling flashLoanAmount (dx) into the pool to crash the price of token X.
    // New Price P' = y / (x + dx) roughly, but let's use exact output derivation.
    
    // Simplified CPMM Impact:
    // Price Impact = dx / (x + dx)
    // x (reserves) ~ poolLiquidityUSD / 2
    const reserves = poolLiquidityUSD / 2;
    const priceImpact = flashLoanAmount / (reserves + flashLoanAmount);
    const manipulatedPriceMultiplier = 1 - priceImpact; // Price drops

    // Cost to attacker: Slippage + Swap Fee (0.3%)
    // Loss on swap ~ priceImpact * flashLoanAmount * 0.5 (approximation rule of thumb)
    const swapFee = flashLoanAmount * 0.003;
    const slippageLoss = (priceImpact / 2) * flashLoanAmount;
    const totalAttackCost = swapFee + slippageLoss;

    // Gain to attacker:
    // Borrow under-collateralized or liquidate at bad price.
    // Let's assume they borrow an asset that looks "cheap" now, or borrow against an asset that looks "expensive".
    // Simplified: Profit = (PriceChange * PositionSize)
    const potentialGain = (1 - manipulatedPriceMultiplier) * flashLoanAmount * collateralFactor; 

    const netProfit = potentialGain - totalAttackCost;
    const isProfitable = netProfit > 0;

    return {
      attackPossible: isProfitable,
      profitPotential: isProfitable ? `$${netProfit.toLocaleString()}` : '$0 (Cost exceeds gain)',
      requiredCapital: `$${flashLoanAmount.toLocaleString()}`,
      riskAssessment: isProfitable ? 'Critical' : 'Low',
      mitigationStrategies: [
        'Increase pool liquidity to reduce price impact.',
        'Use TWAP with at least 30m window.',
        'Lower collateral factors for low-liquidity assets.'
      ],
      simulationSteps: [
        `1. Flash loan $${flashLoanAmount}`,
        `2. Dump into AMM (Reserves: $${reserves})`,
        `3. Price impact: ${(priceImpact * 100).toFixed(2)}%`,
        `4. Cost (Slippage+Fees): $${totalAttackCost.toFixed(2)}`,
        `5. Gain from Protocol: $${potentialGain.toFixed(2)}`,
        `6. Net Profit: $${netProfit.toFixed(2)}`
      ],
      mathProof: `Net = (Impact * Loan * CF) - (Impact/2 * Loan + 0.003 * Loan)`
    };
  }

  /**
   * Simulates ERC4626 Inflation Attack (Donation Attack).
   * Formula: shares = (assets * totalSupply) / totalAssets
   */
  simulateVaultDonationAttack(params: {
    currentAssets: number; // Usually 0 for new vaults
    currentSupply: number; // Usually 0 for new vaults
    attackerDeposit: number; // e.g., 1 wei
    victimDeposit: number; // e.g., 10 ETH
    donationAmount: number; // Amount attacker donates
  }): SimulationResult {
    const { currentAssets, currentSupply, attackerDeposit, victimDeposit, donationAmount } = params;

    // Step 1: Attacker deposits 'attackerDeposit' (usually 1 wei)
    // Initial state: Assets = 0, Supply = 0
    // Attacker shares = 1
    let totalAssets = currentAssets + attackerDeposit;
    let totalSupply = currentSupply + 1; // 1 share minted

    // Step 2: Attacker donates 'donationAmount'
    totalAssets += donationAmount; 
    // totalSupply remains 1.
    // Share Price = totalAssets / totalSupply = (1 + donation) / 1

    // Step 3: Victim deposits 'victimDeposit'
    // New Shares = (victimDeposit * totalSupply) / totalAssets
    // If (victimDeposit * 1) < totalAssets, result is 0 due to solidity integer division.
    
    const victimShares = Math.floor((victimDeposit * totalSupply) / totalAssets);
    
    // Step 4: Attacker withdraws
    // Attacker owns 100% of shares (1 share), victim owns 0.
    // Attacker claims totalAssets + victimDeposit.
    
    const isSuccess = victimShares === 0;
    const profit = isSuccess ? victimDeposit : 0;

    return {
      attackPossible: isSuccess,
      profitPotential: `$${profit.toLocaleString()}`,
      requiredCapital: `$${donationAmount.toLocaleString()}`,
      riskAssessment: isSuccess ? 'Critical' : 'Safe',
      mitigationStrategies: [
        'Require min liquidity of 1000 wei to be burned on first mint.',
        'Use internal balance accounting instead of balanceOf(this).'
      ],
      simulationSteps: [
        `1. Attacker deposits ${attackerDeposit} wei -> gets 1 share.`,
        `2. Attacker donates ${donationAmount} assets. New Price: ${totalAssets}/share.`,
        `3. Victim deposits ${victimDeposit}.`,
        `4. Calculation: (${victimDeposit} * 1) / ${totalAssets} = ${victimShares} shares.`,
        `5. Victim receives ${victimShares} shares. Attacker retains 100% ownership.`
      ],
      mathProof: `victimShares = floor(${victimDeposit} * ${totalSupply} / ${totalAssets})`
    };
  }

  // ... Other simulation methods (Governance, MEV) can be similarly upgraded ...
}

export const flashLoanSimulator = new FlashLoanAttackSimulatorImpl();
