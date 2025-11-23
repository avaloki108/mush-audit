import type { ContractFile } from "@/types/blockchain";
import { pocGenerator } from "./modules/pocGenerator";

export interface VulnerabilityFinding {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  impact: string;
  location: string;
  recommendation: string;
  exploitScenario?: string;
  pocCode?: string;
  economicImpact?: string;
  likelihood?: 'High' | 'Medium' | 'Low';
  attackVector?: string;
  prerequisites?: string[];
  mitigations?: string[];
  testTemplate?: string;
}

export interface ExploitScenario {
  title: string;
  description: string;
  prerequisites: string[];
  steps: string[];
  impact: string;
  economicDamage: string;
  pocCode: string;
  mitigation: string;
}

export interface EnhancedAuditReport {
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    riskScore: number;
    estimatedLoss: string;
  };
  contractInfo: {
    name?: string;
    address?: string;
    chain?: string;
    compiler?: string;
    sourceLines: number;
  };
  vulnerabilities: VulnerabilityFinding[];
  exploitScenarios: ExploitScenario[];
  economicAnalysis: {
    totalPotentialLoss: string;
    riskBreakdown: { [key: string]: string };
    attackSurface: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  testSuites: {
    foundryTests: string[];
    hardhatTests: string[];
  };
  analysis: string;
}

export class EnhancedReportGenerator {

  /**
   * Strict filtering to remove "garbage" findings.
   */
  private filterGarbage(findings: VulnerabilityFinding[]): VulnerabilityFinding[] {
    return findings.filter(f => {
        // 1. Discard purely stylistic / info issues unless they have High impact
        if (f.severity === 'Low' && !f.economicImpact) return false;
        if (f.title.toLowerCase().includes('style') || f.title.toLowerCase().includes('comment')) return false;

        // 2. Discard "Gas Optimization" disguised as vulnerabilities
        if (f.title.toLowerCase().includes('gas') && f.severity !== 'Low') {
            // Downgrade gas issues if they are marked critical
            f.severity = 'Low';
            return true; // Keep them but categorized correctly
        }

        // 3. Discard vague "Best Practice" warnings without specific location
        if (f.location === 'Global' && f.title.includes('Best Practice')) return false;

        return true;
    });
  }

  generateExploitScenarios(findings: VulnerabilityFinding[]): ExploitScenario[] {
    const scenarios: ExploitScenario[] = [];

    for (const finding of findings) {
      if (finding.severity === 'Critical' || finding.severity === 'High') {
        const scenario = this.createDetailedExploitScenario(finding);
        if (scenario) {
          scenarios.push(scenario);
        }
      }
    }

    return scenarios;
  }

  private createDetailedExploitScenario(finding: VulnerabilityFinding): ExploitScenario | null {
    // Use the finding's own data if available, otherwise fallback to templates
    return {
      title: `Exploit Scenario: ${finding.title}`,
      description: finding.description,
      prerequisites: finding.prerequisites || [],
      steps: finding.exploitScenario ? [finding.exploitScenario] : [],
      impact: finding.impact,
      economicDamage: finding.economicImpact || 'Unknown',
      pocCode: finding.pocCode || pocGenerator.generateFoundryTest(finding), // Use dynamic generator
      mitigation: finding.recommendation
    };
  }

  calculateEconomicImpact(findings: VulnerabilityFinding[]): {
    totalPotentialLoss: string;
    riskBreakdown: { [key: string]: string };
    attackSurface: string[];
  } {
    let totalLoss = 0;
    const riskBreakdown: { [key: string]: string } = {};
    const attackSurface: string[] = [];

    const severityMultipliers = {
      'Critical': 1000000, // $1M base
      'High': 100000,      // $100K base
      'Medium': 10000,     // $10K base
      'Low': 1000          // $1K base
    };

    for (const finding of findings) {
      const baseValue = severityMultipliers[finding.severity];
      let adjustedValue = baseValue;

      // Adjust based on keywords
      if (finding.title.toLowerCase().includes('flash loan')) adjustedValue *= 10;
      if (finding.title.toLowerCase().includes('bridge')) adjustedValue *= 20;

      totalLoss += adjustedValue;
      riskBreakdown[finding.title] = `$${adjustedValue.toLocaleString()}`;

      if (finding.severity === 'Critical' || finding.severity === 'High') {
        attackSurface.push(finding.title);
      }
    }

    return {
      totalPotentialLoss: `$${totalLoss.toLocaleString()}`,
      riskBreakdown,
      attackSurface
    };
  }

  generateTestTemplates(findings: VulnerabilityFinding[], contractName?: string): {
    foundryTests: string[];
    hardhatTests: string[];
  } {
    const foundryTests: string[] = [];
    const hardhatTests: string[] = [];

    for (const finding of findings) {
      if (finding.severity === 'Critical' || finding.severity === 'High') {
        // Use the new PoC Generator
        const foundryTest = pocGenerator.generateFoundryTest(finding, contractName || "TargetContract");
        foundryTests.push(foundryTest);
      }
    }

    return { foundryTests, hardhatTests };
  }

  private generateFoundryTest(finding: VulnerabilityFinding): string | null {
    const testTemplates: { [key: string]: string } = {
      'Flash Loan Oracle Manipulation': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/TargetProtocol.sol";

contract FlashLoanOracleExploitTest is Test {
    TargetProtocol target;
    IERC20 token;
    IUniswapV2Pair pair;

    function setUp() public {
        // Setup contracts
        target = new TargetProtocol();
        token = IERC20(address(0x...));
        pair = IUniswapV2Pair(address(0x...));
    }

    function testFlashLoanOracleManipulation() public {
        // Setup initial state
        uint256 initialPrice = target.getPrice();

        // Execute flash loan attack
        FlashLoanAttacker attacker = new FlashLoanAttacker(address(target), address(pair));
        attacker.attack();

        // Verify exploitation
        uint256 finalPrice = target.getPrice();
        assertGt(attacker.profit(), 0, "Attack should be profitable");
        assertNotEq(initialPrice, finalPrice, "Price should be manipulated");
    }
}

contract FlashLoanAttacker {
    // Attacker contract implementation
}
      `,
      'Permit Signature Replay': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

contract PermitReplayTest is Test {
    ERC20Permit token;
    address victim;
    address attacker;

    function setUp() public {
        token = new ERC20Permit();
        victim = makeAddr("victim");
        attacker = makeAddr("attacker");

        // Setup victim with tokens
        token.transfer(victim, 1000 ether);
    }

    function testPermitSignatureReplay() public {
        // Generate permit signature for victim
        uint256 nonce = token.nonces(victim);
        uint256 deadline = block.timestamp + 1 hours;

        bytes32 digest = keccak256(abi.encodePacked(
            "\\x19\\x01",
            token.DOMAIN_SEPARATOR(),
            keccak256(abi.encode(
                token.PERMIT_TYPEHASH(),
                victim,
                attacker,
                100 ether,
                nonce,
                deadline
            ))
        ));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);

        // First permit call (legitimate)
        vm.prank(attacker);
        token.permit(victim, attacker, 100 ether, deadline, v, r, s);

        uint256 allowance1 = token.allowance(victim, attacker);
        assertEq(allowance1, 100 ether);

        // Second permit call with same signature (replay attack)
        vm.prank(attacker);
        token.permit(victim, attacker, 100 ether, deadline, v, r, s);

        uint256 allowance2 = token.allowance(victim, attacker);
        // If vulnerable, allowance will be 200 ether
        assertEq(allowance2, 100 ether, "Permit should not allow replay");
    }
}
      `
    };

    return testTemplates[finding.title] || null;
  }

  private generateHardhatTest(finding: VulnerabilityFinding): string | null {
    const testTemplates: { [key: string]: string } = {
      'Bridge Message Replay': `
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Bridge Message Replay", function () {
  let bridge: Contract;
  let attacker: Signer;

  beforeEach(async function () {
    const Bridge = await ethers.getContractFactory("Bridge");
    bridge = await Bridge.deploy();
    [attacker] = await ethers.getSigners();
  });

  it("Should prevent message replay attacks", async function () {
    // Create a valid bridge message
    const message = {
      sender: attacker.address,
      recipient: attacker.address,
      amount: ethers.utils.parseEther("100"),
      nonce: 1,
      chainId: 1
    };

    // First message processing should succeed
    await expect(bridge.processMessage(message))
      .to.emit(bridge, "MessageProcessed")
      .withArgs(message.nonce);

    // Second attempt with same message should fail
    await expect(bridge.processMessage(message))
      .to.be.revertedWith("Message already processed");
  });

  it("Should allow different nonces", async function () {
    const message1 = { sender: attacker.address, recipient: attacker.address, amount: ethers.utils.parseEther("100"), nonce: 1, chainId: 1 };
    const message2 = { sender: attacker.address, recipient: attacker.address, amount: ethers.utils.parseEther("100"), nonce: 2, chainId: 1 };

    // Both should succeed
    await bridge.processMessage(message1);
    await bridge.processMessage(message2);
  });
});
      `
    };

    return testTemplates[finding.title] || null;
  }

  /**
   * NEW: Filter out low-value findings (garbage) that lack clear path to fund loss
   * Prioritize findings with PoC and economic impact
   */
  filterGarbageFindings(findings: VulnerabilityFinding[]): VulnerabilityFinding[] {
    return findings.filter(finding => {
      // Keep all Critical and High severity findings
      if (finding.severity === 'Critical' || finding.severity === 'High') {
        return true;
      }

      // Garbage patterns to filter out
      const garbagePatterns = [
        // Stylistic/coding style issues
        /style|formatting|naming convention|indentation|whitespace/i,
        /naming pattern|variable name|function name.*should/i,
        
        // Gas optimizations disguised as security
        /gas optimization|save gas|gas efficient|reduce gas/i,
        /\+\+i.*more efficient|cache.*length|unchecked.*increment/i,
        /storage.*memory.*cheaper|constant.*immutable.*gas/i,
        
        // Low-value informational findings
        /informational|note:|fyi:/i,
        /consider using|you could|you may want/i,
        /best practice.*not.*security/i,
        
        // Vague findings without economic impact
        /potential.*issue.*further.*investigation/i,
        /may.*need.*review|should.*reviewed/i,
        
        // Non-exploitable findings
        /event.*not.*emit|missing.*event/i,
        /natspec|comment|documentation|todo/i,
        /floating.*pragma|solidity.*version.*should/i,
        /public.*instead.*external/i,
        
        // Dead code findings (unless they hide bugs)
        /unused.*variable|unused.*function|dead code/i,
        /unreachable.*code/i,
      ];

      const title = finding.title.toLowerCase();
      const description = finding.description.toLowerCase();
      const combined = `${title} ${description}`;

      // Filter out if matches garbage patterns
      if (garbagePatterns.some(pattern => pattern.test(combined))) {
        // Exception: Keep if has explicit economic impact
        if (finding.economicImpact && finding.economicImpact.length > 0) {
          return true;
        }
        // Exception: Keep if has PoC code
        if (finding.pocCode && finding.pocCode.length > 100) {
          return true;
        }
        return false;
      }

      // Filter out Medium/Low findings without concrete impact
      if (finding.severity === 'Medium' || finding.severity === 'Low') {
        // Require at least one of: economic impact, exploit scenario, or PoC
        const hasSubstance = 
          (finding.economicImpact && finding.economicImpact.length > 0) ||
          (finding.exploitScenario && finding.exploitScenario.length > 50) ||
          (finding.pocCode && finding.pocCode.length > 100);

        if (!hasSubstance) {
          return false;
        }

        // Additional filter: Require clear fund loss path
        const hasFundLossPath = 
          /fund.*loss|drain.*fund|steal.*token|theft|exploit.*\$|economic.*damage/i.test(combined) ||
          /reentrancy|flashloan|oracle.*manipulation|signature.*replay/i.test(combined) ||
          /access.*control|unauthorized|privilege.*escalation/i.test(combined);

        return hasFundLossPath;
      }

      // Keep everything else (shouldn't reach here)
      return true;
    });
  }

  prioritizeVulnerabilities(findings: VulnerabilityFinding[]): VulnerabilityFinding[] {
    // Sort by Severity -> Economic Impact -> Likelihood
    const severityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    
    return findings.sort((a, b) => {
      const diff = severityWeight[b.severity] - severityWeight[a.severity];
      if (diff !== 0) return diff;
      
      // If same severity, prioritize economic impact presence
      if (a.economicImpact && !b.economicImpact) return -1;
      if (!a.economicImpact && b.economicImpact) return 1;
      
      return 0;
    });
  }

  generateRecommendations(findings: VulnerabilityFinding[]): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    for (const finding of findings) {
      if (finding.severity === 'Critical') {
        immediate.push(finding.recommendation);
      } else if (finding.severity === 'High') {
        shortTerm.push(finding.recommendation);
      } else {
        longTerm.push(finding.recommendation);
      }
    }
    return { immediate, shortTerm, longTerm };
  }

  async generateEnhancedReport(params: {
    code: string;
    aiAnalysis: string;
    vulnerabilities: VulnerabilityFinding[];
    files: ContractFile[];
    contractName?: string;
    chain?: string;
  }): Promise<EnhancedAuditReport> {
    // NEW: Filter out garbage findings first
    const filteredVulnerabilities = this.filterGarbageFindings(params.vulnerabilities);
    
    const prioritizedVulnerabilities = this.prioritizeVulnerabilities(filteredVulnerabilities);
    // 1. Filter Garbage first
    const cleanFindings = this.filterGarbage(params.vulnerabilities);
    
    // 2. Prioritize
    const prioritizedVulnerabilities = this.prioritizeVulnerabilities(cleanFindings);
    
    const exploitScenarios = this.generateExploitScenarios(prioritizedVulnerabilities);
    const economicAnalysis = this.calculateEconomicImpact(prioritizedVulnerabilities);
    const testSuites = this.generateTestTemplates(prioritizedVulnerabilities, params.contractName);
    const recommendations = this.generateRecommendations(prioritizedVulnerabilities);

    const severityCounts = {
      Critical: prioritizedVulnerabilities.filter(v => v.severity === 'Critical').length,
      High: prioritizedVulnerabilities.filter(v => v.severity === 'High').length,
      Medium: prioritizedVulnerabilities.filter(v => v.severity === 'Medium').length,
      Low: prioritizedVulnerabilities.filter(v => v.severity === 'Low').length
    };

    // Weighted Risk Score
    const riskScore = Math.min(100,
      (severityCounts.Critical * 30) +
      (severityCounts.High * 15) +
      (severityCounts.Medium * 5)
    );

    return {
      summary: {
        totalIssues: prioritizedVulnerabilities.length,
        criticalIssues: severityCounts.Critical,
        highIssues: severityCounts.High,
        mediumIssues: severityCounts.Medium,
        lowIssues: severityCounts.Low,
        riskScore,
        estimatedLoss: economicAnalysis.totalPotentialLoss
      },
      contractInfo: {
        name: params.contractName,
        chain: params.chain,
        sourceLines: params.code.split('\n').length
      },
      vulnerabilities: prioritizedVulnerabilities,
      exploitScenarios,
      economicAnalysis,
      recommendations,
      testSuites,
      analysis: params.aiAnalysis
    };
  }
}

export const enhancedReportGenerator = new EnhancedReportGenerator();
