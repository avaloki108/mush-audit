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
