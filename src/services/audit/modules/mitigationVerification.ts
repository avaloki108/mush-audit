import type { ContractFile } from "@/types/blockchain";

export interface VulnerabilityFinding {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  location: string;
  impact?: string;
  recommendation?: string;
  type?: string;
}

export interface Mitigation {
  id: string;
  vulnerabilityId: string;
  description: string;
  implementation: string;
  type: 'code-change' | 'pattern' | 'library' | 'modifier' | 'check';
  appliedAt?: string;
}

export interface MitigationVerificationResult {
  vulnerabilityId: string;
  vulnerabilityTitle: string;
  mitigations: Mitigation[];
  effectiveness: 'Full' | 'Partial' | 'None' | 'Unknown';
  coverage: number; // 0-100%
  recommendations: string[];
  verificationDetails: VerificationDetail[];
  residualRisk: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface VerificationDetail {
  aspect: string;
  status: 'verified' | 'partial' | 'missing';
  description: string;
}

export interface MitigationPattern {
  name: string;
  pattern: RegExp;
  effectiveness: number; // 0-1
  vulnerabilityTypes: string[];
}

export class MitigationVerificationEngine {
  private findings: VulnerabilityFinding[];
  private mitigations: Mitigation[];
  private contracts: ContractFile[];

  // Define common mitigation patterns
  private static MITIGATION_PATTERNS: MitigationPattern[] = [
    {
      name: 'ReentrancyGuard',
      pattern: /ReentrancyGuard|nonReentrant|mutex|locked/,
      effectiveness: 0.95,
      vulnerabilityTypes: ['reentrancy', 'cross-contract reentrancy']
    },
    {
      name: 'Checks-Effects-Interactions',
      pattern: /\/\/.*checks.*effects.*interactions|require.*before.*call/i,
      effectiveness: 0.90,
      vulnerabilityTypes: ['reentrancy']
    },
    {
      name: 'SafeMath',
      pattern: /SafeMath|unchecked\s*\{.*?\}/s,
      effectiveness: 0.85,
      vulnerabilityTypes: ['integer overflow', 'integer underflow']
    },
    {
      name: 'Access Control Modifier',
      pattern: /onlyOwner|onlyAdmin|require\s*\(\s*msg\.sender\s*==|modifier.*only/,
      effectiveness: 0.90,
      vulnerabilityTypes: ['access control', 'unauthorized access']
    },
    {
      name: 'Pausable',
      pattern: /Pausable|whenNotPaused|pause\(\)|unpause\(\)/,
      effectiveness: 0.80,
      vulnerabilityTypes: ['emergency pause bypass']
    },
    {
      name: 'Pull Payment Pattern',
      pattern: /withdraw|claim.*pending|balanceOf.*pending/,
      effectiveness: 0.85,
      vulnerabilityTypes: ['reentrancy', 'dos']
    },
    {
      name: 'Oracle Security',
      pattern: /TWAP|Chainlink|multiple.*oracle|oracle.*check/i,
      effectiveness: 0.80,
      vulnerabilityTypes: ['oracle manipulation', 'price manipulation']
    },
    {
      name: 'Storage Gap',
      pattern: /__gap|uint256\[\d+\]\s+private\s+__gap/,
      effectiveness: 0.95,
      vulnerabilityTypes: ['storage collision', 'upgradeability']
    },
    {
      name: 'Return Value Check',
      pattern: /require\s*\(\s*.*\.call|bool\s+success.*=.*\.call.*require\s*\(\s*success/s,
      effectiveness: 0.90,
      vulnerabilityTypes: ['unchecked call', 'external call']
    },
    {
      name: 'Slippage Protection',
      pattern: /minAmount|maxAmount|slippage|deadline/,
      effectiveness: 0.75,
      vulnerabilityTypes: ['mev', 'sandwich attack', 'front-running']
    }
  ];

  constructor(findings: VulnerabilityFinding[], mitigations: Mitigation[], contracts?: ContractFile[]) {
    this.findings = findings;
    this.mitigations = mitigations;
    this.contracts = contracts || [];
  }

  verifyMitigations(): MitigationVerificationResult[] {
    const results: MitigationVerificationResult[] = [];

    this.findings.forEach(finding => {
      const relevantMitigations = this.mitigations.filter(mitigation =>
        mitigation.vulnerabilityId === finding.id
      );

      // If no explicit mitigations, check for implicit mitigations in code
      let effectiveMitigations = relevantMitigations;
      if (relevantMitigations.length === 0 && this.contracts.length > 0) {
        effectiveMitigations = this.detectImplicitMitigations(finding);
      }

      const verificationResult = this.verifyMitigationEffectiveness(
        finding,
        effectiveMitigations
      );
      results.push(verificationResult);
    });

    return results;
  }

  private detectImplicitMitigations(finding: VulnerabilityFinding): Mitigation[] {
    const implicitMitigations: Mitigation[] = [];

    // Analyze contract code for mitigation patterns
    this.contracts.forEach(contract => {
      const content = contract.content;
      const vulnerabilityType = (finding.type || finding.title).toLowerCase();

      MitigationVerificationEngine.MITIGATION_PATTERNS.forEach(pattern => {
        if (pattern.vulnerabilityTypes.some(type => vulnerabilityType.includes(type.toLowerCase()))) {
          if (pattern.pattern.test(content)) {
            implicitMitigations.push({
              id: `implicit-${finding.id}-${pattern.name}`,
              vulnerabilityId: finding.id,
              description: `${pattern.name} pattern detected in code`,
              implementation: `Pattern found in ${contract.name}`,
              type: 'pattern',
              appliedAt: contract.name
            });
          }
        }
      });
    });

    return implicitMitigations;
  }

  private verifyMitigationEffectiveness(
    finding: VulnerabilityFinding,
    mitigations: Mitigation[]
  ): MitigationVerificationResult {
    const verificationDetails: VerificationDetail[] = [];
    let totalEffectiveness = 0;
    let count = 0;

    const vulnerabilityType = (finding.type || finding.title).toLowerCase();

    // Check each mitigation
    mitigations.forEach(mitigation => {
      const detail = this.verifyMitigation(mitigation, finding);
      verificationDetails.push(detail);

      // Calculate effectiveness based on mitigation type and pattern matching
      const patternMatch = MitigationVerificationEngine.MITIGATION_PATTERNS.find(p =>
        p.name.toLowerCase() === mitigation.type ||
        p.pattern.test(mitigation.implementation) ||
        p.pattern.test(mitigation.description)
      );

      if (patternMatch && patternMatch.vulnerabilityTypes.some(type =>
        vulnerabilityType.includes(type.toLowerCase())
      )) {
        totalEffectiveness += patternMatch.effectiveness;
        count++;
      } else {
        // Generic mitigation effectiveness
        totalEffectiveness += 0.5;
        count++;
      }
    });

    // If no mitigations found, check contract code for patterns
    if (mitigations.length === 0 && this.contracts.length > 0) {
      const codeAnalysis = this.analyzeCodeForMitigations(finding);
      verificationDetails.push(...codeAnalysis.details);
      totalEffectiveness = codeAnalysis.effectiveness;
      count = codeAnalysis.details.length || 1;
    }

    const averageEffectiveness = count > 0 ? totalEffectiveness / count : 0;
    const coverage = Math.min(100, Math.round(averageEffectiveness * 100));

    // Determine overall effectiveness
    let effectiveness: 'Full' | 'Partial' | 'None' | 'Unknown';
    if (mitigations.length === 0 && this.contracts.length === 0) {
      effectiveness = 'Unknown';
    } else if (averageEffectiveness >= 0.9) {
      effectiveness = 'Full';
    } else if (averageEffectiveness >= 0.5) {
      effectiveness = 'Partial';
    } else {
      effectiveness = 'None';
    }

    // Calculate residual risk
    const residualRisk = this.calculateResidualRisk(finding.severity, effectiveness, coverage);

    // Generate recommendations
    const recommendations = this.generateRecommendations(finding, mitigations, effectiveness, verificationDetails);

    return {
      vulnerabilityId: finding.id,
      vulnerabilityTitle: finding.title,
      mitigations,
      effectiveness,
      coverage,
      recommendations,
      verificationDetails,
      residualRisk
    };
  }

  private verifyMitigation(mitigation: Mitigation, finding: VulnerabilityFinding): VerificationDetail {
    const vulnerabilityType = (finding.type || finding.title).toLowerCase();

    // Check if mitigation matches known patterns
    const matchingPattern = MitigationVerificationEngine.MITIGATION_PATTERNS.find(p =>
      p.pattern.test(mitigation.implementation) ||
      p.pattern.test(mitigation.description)
    );

    if (matchingPattern) {
      const isRelevant = matchingPattern.vulnerabilityTypes.some(type =>
        vulnerabilityType.includes(type.toLowerCase())
      );

      if (isRelevant) {
        return {
          aspect: matchingPattern.name,
          status: 'verified',
          description: `${matchingPattern.name} pattern correctly applied`
        };
      } else {
        return {
          aspect: matchingPattern.name,
          status: 'partial',
          description: `${matchingPattern.name} found but may not fully address ${finding.title}`
        };
      }
    }

    // Check for generic mitigation indicators
    if (mitigation.implementation.length > 50) {
      return {
        aspect: 'Custom mitigation',
        status: 'partial',
        description: 'Custom mitigation implemented, requires manual verification'
      };
    }

    return {
      aspect: 'Generic mitigation',
      status: 'partial',
      description: 'Mitigation described but effectiveness unclear'
    };
  }

  private analyzeCodeForMitigations(finding: VulnerabilityFinding): {
    effectiveness: number;
    details: VerificationDetail[];
  } {
    const details: VerificationDetail[] = [];
    let totalEffectiveness = 0;
    let count = 0;

    const vulnerabilityType = (finding.type || finding.title).toLowerCase();
    const location = finding.location.toLowerCase();

    this.contracts.forEach(contract => {
      // Only analyze contracts related to the finding location
      if (location.includes(contract.name.toLowerCase()) || location === contract.name.toLowerCase()) {
        const content = contract.content;

        MitigationVerificationEngine.MITIGATION_PATTERNS.forEach(pattern => {
          if (pattern.vulnerabilityTypes.some(type => vulnerabilityType.includes(type.toLowerCase()))) {
            if (pattern.pattern.test(content)) {
              details.push({
                aspect: pattern.name,
                status: 'verified',
                description: `${pattern.name} pattern detected in ${contract.name}`
              });
              totalEffectiveness += pattern.effectiveness;
              count++;
            }
          }
        });

        // Check for specific vulnerability-type mitigations
        if (vulnerabilityType.includes('reentrancy')) {
          if (!content.includes('ReentrancyGuard') && !content.includes('nonReentrant')) {
            details.push({
              aspect: 'Reentrancy Protection',
              status: 'missing',
              description: 'No ReentrancyGuard pattern detected'
            });
          }
        }

        if (vulnerabilityType.includes('access control')) {
          const hasAccessControl = /onlyOwner|onlyAdmin|require\s*\(\s*msg\.sender/.test(content);
          if (!hasAccessControl) {
            details.push({
              aspect: 'Access Control',
              status: 'missing',
              description: 'No access control modifiers detected'
            });
          }
        }

        if (vulnerabilityType.includes('overflow') || vulnerabilityType.includes('underflow')) {
          const pragmaMatch = content.match(/pragma\s+solidity\s+\^?([\d.]+)/);
          if (pragmaMatch) {
            const version = pragmaMatch[1];
            const majorVersion = parseInt(version.split('.')[1]);
            if (majorVersion >= 8) {
              details.push({
                aspect: 'Overflow Protection',
                status: 'verified',
                description: `Solidity ${version} has built-in overflow protection`
              });
              totalEffectiveness += 0.95;
              count++;
            } else if (content.includes('SafeMath')) {
              details.push({
                aspect: 'SafeMath',
                status: 'verified',
                description: 'SafeMath library in use'
              });
              totalEffectiveness += 0.85;
              count++;
            } else {
              details.push({
                aspect: 'Overflow Protection',
                status: 'missing',
                description: 'No overflow protection detected (pre-0.8.0 without SafeMath)'
              });
            }
          }
        }
      }
    });

    const effectiveness = count > 0 ? totalEffectiveness / count : 0;
    return { effectiveness, details };
  }

  private calculateResidualRisk(
    originalSeverity: string,
    effectiveness: string,
    coverage: number
  ): 'Low' | 'Medium' | 'High' | 'Critical' {
    // Map severity to numeric value
    const severityMap: { [key: string]: number } = {
      'Critical': 4,
      'High': 3,
      'Medium': 2,
      'Low': 1
    };

    const severityValue = severityMap[originalSeverity] || 2;

    // Calculate risk reduction based on effectiveness
    let riskReduction = 0;
    if (effectiveness === 'Full') {
      riskReduction = 0.9;
    } else if (effectiveness === 'Partial') {
      riskReduction = 0.5;
    } else if (effectiveness === 'None') {
      riskReduction = 0.1;
    } else {
      riskReduction = 0.3; // Unknown
    }

    // Adjust for coverage
    riskReduction *= (coverage / 100);

    // Calculate residual risk
    const residualValue = severityValue * (1 - riskReduction);

    if (residualValue >= 3.5) return 'Critical';
    if (residualValue >= 2.5) return 'High';
    if (residualValue >= 1.5) return 'Medium';
    return 'Low';
  }

  private generateRecommendations(
    finding: VulnerabilityFinding,
    mitigations: Mitigation[],
    effectiveness: string,
    verificationDetails: VerificationDetail[]
  ): string[] {
    const recommendations: string[] = [];

    if (effectiveness === 'None' || mitigations.length === 0) {
      recommendations.push(`URGENT: No mitigations found for ${finding.title}. Implement recommended fixes immediately.`);
      if (finding.recommendation) {
        recommendations.push(finding.recommendation);
      }
    } else if (effectiveness === 'Partial') {
      recommendations.push(`Current mitigations for ${finding.title} are incomplete. Strengthen existing controls.`);

      // Check for missing aspects
      const missingAspects = verificationDetails.filter(d => d.status === 'missing');
      if (missingAspects.length > 0) {
        recommendations.push(`Missing: ${missingAspects.map(a => a.aspect).join(', ')}`);
      }
    } else if (effectiveness === 'Full') {
      recommendations.push(`Mitigations for ${finding.title} appear adequate. Continue monitoring and testing.`);
    }

    // Add specific recommendations based on vulnerability type
    const vulnerabilityType = (finding.type || finding.title).toLowerCase();

    if (vulnerabilityType.includes('reentrancy')) {
      if (!mitigations.some(m => m.description.includes('ReentrancyGuard'))) {
        recommendations.push('Consider using OpenZeppelin ReentrancyGuard for additional protection');
      }
      recommendations.push('Ensure checks-effects-interactions pattern is followed in all functions');
    }

    if (vulnerabilityType.includes('access control')) {
      recommendations.push('Implement role-based access control (RBAC) for granular permissions');
      recommendations.push('Add event emissions for all privileged operations');
    }

    if (vulnerabilityType.includes('oracle')) {
      recommendations.push('Use multiple oracle sources and implement circuit breakers');
      recommendations.push('Add price deviation checks and TWAP mechanisms');
    }

    if (vulnerabilityType.includes('upgradeable') || vulnerabilityType.includes('proxy')) {
      recommendations.push('Ensure storage layout compatibility using storage gaps');
      recommendations.push('Implement initialization guards to prevent re-initialization');
    }

    return recommendations;
  }
}
