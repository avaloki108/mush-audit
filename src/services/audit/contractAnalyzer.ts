import { analyzeWithAI, getAIConfig } from "@/utils/ai";
import { generateReport } from "./reportGenerator";
import { mergeContractContents } from "@/utils/contractFilters";
import type { ContractFile } from "@/types/blockchain";
import { ENHANCED_ENHANCED_SECURITY_AUDIT_PROMPT } from "@/services/audit/enhancedPrompts";
import { createPromptWithSupperPrompt } from "@/utils/prompts";
import { createPromptWithLanguage } from "@/utils/language";
import { AIConfig } from "@/types/ai";
import { economicExploitDetector } from "./modules/economicExploits";
import { signatureAnalyzer } from "./modules/signatureAnalysis";
import { crossChainAnalyzer } from "./modules/crossChainAnalysis";
import { mapContractDependencies } from "./modules/dependencyMapping";
import { MitigationVerificationEngine } from "./modules/mitigationVerification";
import { StateFlowAnalyzer } from "./modules/stateFlowAnalysis";
import { ThreatIntelligenceEngine } from "./modules/threatIntelligence";
import { Mitigation } from "./modules/mitigationVerification";
import { ContractState } from "./modules/stateFlowAnalysis";
import { SecurityMonitoringEngine } from "./modules/securityMonitoring";
import { EconomicAttackVectorAnalyzer } from "./modules/economicAttackVectors";
// Logger utility for monitoring
const logger = {
  info: (category: string, message: string) => console.log(`[${category}] ${message}`),
  debug: (category: string, message: string) => console.debug(`[${category}] ${message}`),
  error: (category: string, message: string, error?: any) => console.error(`[${category}] ${message}`, error),
  warn: (category: string, message: string) => console.warn(`[${category}] ${message}`)
};

// Format AI response content
function formatAIResponse(content: string): string {
  if (!content) return "";
  let formatted = content;

  // make sure each ### title has a newline after it
  formatted = formatted.replace(/(### [^\n]+)(\n\*\*)/g, "$1\n$2");

  // Remove "```markdown"
  formatted = formatted.replace(/```markdown/g, "");

  // Remove extra newlines (more than 2 consecutive empty lines)
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted;
}

interface AnalysisResult {
  filteredFiles: ContractFile[];
  vulnerabilities: any[];
  optimizations: any[];
  report: {
    analysis: string;
    [key: string]: any;
  };
  threatAssessment?: any;
  monitoringMetrics?: any;
  dependencyGraph?: any;
  stateFlowAnalysis?: any;
  mitigationVerification?: any;
  economicAttackAnalysis?: any;
}

// Initialize global threat intelligence and monitoring engines
let threatIntelEngine: ThreatIntelligenceEngine | null = null;
let securityMonitor: SecurityMonitoringEngine | null = null;

function getThreatIntelEngine(): ThreatIntelligenceEngine {
  if (!threatIntelEngine) {
    threatIntelEngine = new ThreatIntelligenceEngine({
      enableRealTimeFeeds: false, // Offline mode by default
      confidenceThreshold: 0.7
    });
  }
  return threatIntelEngine;
}

function getSecurityMonitor(): SecurityMonitoringEngine {
  if (!securityMonitor) {
    securityMonitor = new SecurityMonitoringEngine({
      enableContinuousMonitoring: true,
      accuracyThreshold: 0.85,
      performanceThreshold: 5000,
      alertsEnabled: true
    });
  }
  return securityMonitor;
}

export async function analyzeContract(params: {
  files: ContractFile[];
  contractName?: string;
  chain?: string;
  signal?: AbortSignal;
  isMultiFile?: boolean;
  analysisMode?: 'protocol' | 'contract';
}): Promise<AnalysisResult> {
  // Protocol-level analysis mode - enable enhanced cross-contract analysis
  const isProtocolMode = params.analysisMode === 'protocol' || params.isMultiFile;
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: any;

  // Check if localStorage is available (client-side only)
  if (typeof window === 'undefined') {
    throw new Error("Contract analysis must be performed on the client side");
  }

  const savedConfig = typeof window !== 'undefined' ? localStorage.getItem("ai_config") : null;
  if (!savedConfig) {
    throw new Error("AI configuration not found");
  }
  const config: AIConfig = JSON.parse(savedConfig);

  while (retryCount < maxRetries) {
    try {
      if (params.signal?.aborted) {
        throw new Error("Analysis cancelled");
      }

      // Skip filtering for multi-file mode
      let filesToAnalyze = params.isMultiFile
        ? params.files
        : params.files.filter((file) => {
            if (
              file.path.includes("/interfaces/") ||
              file.path.includes("Interface") ||
              file.path.startsWith("IERC") ||
              file.path.startsWith("ERC") ||
              file.path.startsWith("EIP")
            ) {
              return false;
            }

            if (
              file.path.includes("@openzeppelin/") ||
              file.path.includes("node_modules/") ||
              file.path.includes("@paulrberg/")
            ) {
              return false;
            }

            return true;
          });

      if (filesToAnalyze.length === 0) {
        throw new Error("No contract files to analyze after filtering");
      }

      // For non-multi-file mode, handle proxy/implementation separation
      if (!params.isMultiFile) {
        const proxyFiles = filesToAnalyze.filter((f) =>
          f.path.startsWith("proxy/")
        );
        const implementationFiles = filesToAnalyze.filter((f) =>
          f.path.startsWith("implementation/")
        );
        const regularFiles = filesToAnalyze.filter(
          (f) =>
            !f.path.startsWith("proxy/") &&
            !f.path.startsWith("implementation/")
        );

        if (proxyFiles.length > 0 && implementationFiles.length > 0) {
          filesToAnalyze = implementationFiles;
        } else {
          filesToAnalyze = regularFiles;
        }
      }

      const mergedCode = mergeContractContents(
        filesToAnalyze,
        !params.isMultiFile
      );
      if (!mergedCode) {
        throw new Error("No valid contract code to analyze");
      }

      // Debug: Check merged code before analysis
      // console.log("Merged code:", mergedCode);

      let finalPrompt = createPromptWithLanguage(
        ENHANCED_ENHANCED_SECURITY_AUDIT_PROMPT.replace("${mergedCode}", mergedCode).replace(
          "${params.contractName ? params.contractName : ''}",
          params.contractName || ""
        ),
        config.language
      );

      // if we have super prompt, add it to the final prompt
      // exclude o1-mini and o1 because they don't support super prompt
      if (
        config.superPrompt &&
        config.selectedModel !== "o1-mini" &&
        config.selectedModel !== "o1" &&
        config.selectedModel !== "o1-preview"
      ) {
        // console.log("Using super prompt");
        finalPrompt = await createPromptWithSupperPrompt(finalPrompt);
      }

      // Get AI response
      const aiResponse = await analyzeWithAI(finalPrompt, params.signal);
      if (!aiResponse) {
        throw new Error("Failed to get AI analysis response");
      }

      // Format AI response
      let formattedResponse = formatAIResponse(aiResponse);
      formattedResponse =
        "# Generated by [Mush Audit](https://mush-audit.vercel.app/)\n\n" +
        formattedResponse;

      // Track analysis start time for performance monitoring
      const analysisStartTime = Date.now();

      // Run specialized economic exploit detection
      const economicFindings = [
        ...economicExploitDetector.detectFlashLoanOracleManipulation(mergedCode),
        ...economicExploitDetector.detectGovernanceFlashVote(mergedCode),
        ...economicExploitDetector.detectVaultDonationAttack(mergedCode),
        ...economicExploitDetector.detectCrossProtocolExploits(mergedCode),
        ...economicExploitDetector.detectMEVSandwichAttacks(mergedCode),
        ...economicExploitDetector.detectProxyStorageCollision(mergedCode),
        ...economicExploitDetector.detectFeeOnTransferBugs(mergedCode),
        ...economicExploitDetector.detectTWAPOracleAttacks(mergedCode),
        ...economicExploitDetector.detectLogicalReentrancy(mergedCode),
        ...economicExploitDetector.detectForcedEtherInjection(mergedCode),
        ...economicExploitDetector.detectReadOnlyReentrancy(mergedCode),
        ...economicExploitDetector.detectPermitSignatureReplay(mergedCode),
        ...economicExploitDetector.detectBridgeReplay(mergedCode),
        ...economicExploitDetector.detectRoundingDrift(mergedCode),
        ...economicExploitDetector.detectGriefingSpam(mergedCode),
        ...economicExploitDetector.detectEmergencyPauseBypass(mergedCode),
        ...economicExploitDetector.detectFlashMintExploits(mergedCode),
        ...economicExploitDetector.detectRebaseSnapshotAttacks(mergedCode),
        ...economicExploitDetector.detectMulticallDoubleSpend(mergedCode),
        ...economicExploitDetector.detectProfitCapBypass(mergedCode),
        ...economicExploitDetector.detectFundingRateDrain(mergedCode),
        ...economicExploitDetector.detectLeverageBypass(mergedCode),
        ...economicExploitDetector.detectLossSocialization(mergedCode),
        ...economicExploitDetector.detectBridgeVerifierFlaws(mergedCode),
        ...economicExploitDetector.detectArbitraryCallDispatch(mergedCode),
      ].map((finding, index) => ({
        ...finding,
        id: `vuln-${index}-${finding.title.replace(/\s+/g, '-').toLowerCase()}`,
        type: finding.title
      }));
      
      // Format economic findings for report
      const formattedEconomicFindings = economicFindings.map(finding =>
        `---\n\n### ${finding.title}\n- **Title:** ${finding.title}\n- **Severity:** ${finding.severity}\n- **Description:** ${finding.description}\n- **Impact:** ${finding.impact}\n- **Location:** ${finding.location}\n- **Recommendation:** ${finding.recommendation}${finding.exploitScenario ? `\n- **Exploit Scenario:** ${finding.exploitScenario}` : ''}${finding.economicImpact ? `\n- **Economic Impact:** ${finding.economicImpact}` : ''}${finding.pocCode ? `\n\n**PoC Code:**\n\`\`\`solidity\n${finding.pocCode}\n\`\`\`` : ''}`
      ).join('\n\n');
      
      // Run threat intelligence assessment
      const threatEngine = getThreatIntelEngine();
      const threatAssessment = await threatEngine.assessContractThreats(
        mergedCode,
        economicFindings
      );
    
      // Cross-contract analysis - only in protocol/multi-file mode
      let dependencyGraph = null;
      let mitigationVerificationResults = null;
      let stateFlowResults = null;
      let economicAttackAnalysisResults = null;

      if (isProtocolMode && params.files.length > 1) {
        logger.info('Protocol Analysis', 'Running cross-contract dependency mapping...');

        // Generate dependency graph for protocol-level analysis
        dependencyGraph = mapContractDependencies(params.files);

        logger.info('Protocol Analysis', `Dependency graph: ${dependencyGraph.nodes.length} contracts, ${dependencyGraph.edges.length} dependencies, ${dependencyGraph.vulnerabilities.length} cross-contract vulnerabilities`);

        // Analyze state flow with actual contract content
        logger.info('Protocol Analysis', 'Analyzing state flow and transitions...');
        const stateFlowAnalyzer = new StateFlowAnalyzer(params.files);
        stateFlowResults = stateFlowAnalyzer.analyzeStateFlow();

        logger.info('Protocol Analysis', `State flow analysis completed: ${stateFlowResults.potentialIssues.length} issues found, ${stateFlowResults.criticalPaths.length} critical paths identified`);

        // Perform mitigation verification with actual contract content
        logger.info('Protocol Analysis', 'Verifying mitigations...');
        const vulnerabilityFindings = economicFindings;
        const mitigations: Mitigation[] = []; // Empty initially - will detect implicit mitigations from code
        const mitigationVerificationEngine = new MitigationVerificationEngine(
          vulnerabilityFindings,
          mitigations,
          params.files // Pass actual contracts for code analysis
        );
        mitigationVerificationResults = mitigationVerificationEngine.verifyMitigations();

        logger.info('Protocol Analysis', `Mitigation verification: ${mitigationVerificationResults.length} vulnerabilities assessed`);

        // Perform economic attack vector analysis
        logger.info('Protocol Analysis', 'Analyzing economic attack vectors...');
        const economicAttackAnalyzer = new EconomicAttackVectorAnalyzer(params.files);
        economicAttackAnalysisResults = economicAttackAnalyzer.analyzeEconomicAttackVectors();

        logger.info('Protocol Analysis', `Economic attack analysis: ${economicAttackAnalysisResults.attackVectors.length} economic attack vectors found, risk score: ${economicAttackAnalysisResults.totalRiskScore}`);
      }

      // Format cross-contract analysis results
      let crossContractSection = '';

      if (isProtocolMode && dependencyGraph) {
        crossContractSection += '\n\n## Cross-Contract Analysis\n\n';

        // Dependency Graph Summary
        crossContractSection += '### Contract Dependency Graph\n\n';
        crossContractSection += `**Total Contracts:** ${dependencyGraph.nodes.length}\n`;
        crossContractSection += `**Total Dependencies:** ${dependencyGraph.edges.length}\n`;
        crossContractSection += `**Cyclic Dependencies:** ${dependencyGraph.metrics.cyclicDependencies.length}\n`;
        crossContractSection += `**Critical Contracts:** ${dependencyGraph.metrics.criticalContracts.join(', ') || 'None'}\n\n`;

        if (dependencyGraph.metrics.cyclicDependencies.length > 0) {
          crossContractSection += '**⚠️ Cyclic Dependency Chains:**\n';
          dependencyGraph.metrics.cyclicDependencies.forEach((cycle: string[]) => {
            crossContractSection += `- ${cycle.join(' → ')}\n`;
          });
          crossContractSection += '\n';
        }

        // Contract nodes with details
        crossContractSection += '#### Contract Details\n\n';
        dependencyGraph.nodes.forEach((node: any) => {
          crossContractSection += `**${node.name}**\n`;
          crossContractSection += `- Functions: ${node.functions.length}\n`;
          crossContractSection += `- State Variables: ${node.stateVariables.length}\n`;
          if (node.isProxy) crossContractSection += `- Type: Proxy Contract\n`;
          if (node.hasUpgradeable) crossContractSection += `- Upgradeable: Yes\n`;
          crossContractSection += '\n';
        });

        // Cross-contract vulnerabilities
        if (dependencyGraph.vulnerabilities.length > 0) {
          crossContractSection += '### Cross-Contract Vulnerabilities\n\n';
          
          // Group by severity
          const criticalVulns = dependencyGraph.vulnerabilities.filter((v: any) => v.severity === 'Critical');
          const highVulns = dependencyGraph.vulnerabilities.filter((v: any) => v.severity === 'High');
          const mediumVulns = dependencyGraph.vulnerabilities.filter((v: any) => v.severity === 'Medium');
          const lowVulns = dependencyGraph.vulnerabilities.filter((v: any) => v.severity === 'Low');

          if (criticalVulns.length > 0) {
            crossContractSection += `⚠️ **${criticalVulns.length} CRITICAL** cross-contract vulnerabilities found\n\n`;
          }
          if (highVulns.length > 0) {
            crossContractSection += `⚠️ **${highVulns.length} HIGH** severity cross-contract vulnerabilities found\n\n`;
          }

          dependencyGraph.vulnerabilities.forEach((vuln: any) => {
            crossContractSection += `---\n\n`;
            crossContractSection += `#### ${vuln.type}\n`;
            crossContractSection += `- **Severity:** ${vuln.severity}\n`;
            crossContractSection += `- **Affected Contracts:** ${vuln.contracts.join(', ')}\n`;
            crossContractSection += `- **Location:** ${vuln.location}\n`;
            crossContractSection += `- **Description:** ${vuln.description}\n`;
            
            if (vuln.dataFlow) {
              crossContractSection += `- **Attack Flow:** ${vuln.dataFlow}\n`;
            }

            // Add economic impact assessment
            if (vuln.severity === 'Critical' || vuln.severity === 'High') {
              crossContractSection += `- **Economic Impact:** `;
              if (vuln.type.toLowerCase().includes('oracle') || vuln.type.toLowerCase().includes('flash loan')) {
                crossContractSection += `HIGH - Potential for total value locked (TVL) drainage through oracle manipulation\n`;
              } else if (vuln.type.toLowerCase().includes('governance')) {
                crossContractSection += `CRITICAL - Complete protocol takeover possible, all funds at risk\n`;
              } else if (vuln.type.toLowerCase().includes('reentrancy')) {
                crossContractSection += `HIGH - Repeated unauthorized withdrawals can drain contract balances\n`;
              } else if (vuln.type.toLowerCase().includes('access control')) {
                crossContractSection += `HIGH - Unauthorized operations can lead to fund theft or protocol disruption\n`;
              } else {
                crossContractSection += `MEDIUM to HIGH - User funds at risk depending on exploit conditions\n`;
              }
            }

            crossContractSection += `- **Recommendation:** ${vuln.recommendation}\n\n`;
          });

          // Add overall risk assessment
          crossContractSection += '\n#### Overall Cross-Contract Risk Assessment\n\n';
          const totalVulns = dependencyGraph.vulnerabilities.length;
          const riskScore = (criticalVulns.length * 10 + highVulns.length * 5 + mediumVulns.length * 2 + lowVulns.length * 1);
          
          crossContractSection += `- **Total Cross-Contract Vulnerabilities:** ${totalVulns}\n`;
          crossContractSection += `- **Risk Score:** ${riskScore}/100\n`;
          crossContractSection += `- **Risk Level:** `;
          if (riskScore >= 40) {
            crossContractSection += `**CRITICAL** ⚠️\n`;
          } else if (riskScore >= 20) {
            crossContractSection += `**HIGH** ⚠️\n`;
          } else if (riskScore >= 10) {
            crossContractSection += `**MEDIUM**\n`;
          } else {
            crossContractSection += `**LOW**\n`;
          }
          
          if (criticalVulns.length > 0 || highVulns.length > 0) {
            crossContractSection += `\n**⚠️ URGENT ACTION REQUIRED:** This protocol has ${criticalVulns.length + highVulns.length} critical/high severity cross-contract vulnerabilities that could lead to significant fund loss. Immediate remediation is recommended before deployment or when handling user funds.\n`;
          }
        }

        // State Flow Analysis Results
        if (stateFlowResults && stateFlowResults.potentialIssues && stateFlowResults.potentialIssues.length > 0) {
          crossContractSection += '### State Flow Analysis\n\n';
          
          // Group issues by contract
          const issuesByContract = new Map<string, any[]>();
          stateFlowResults.potentialIssues.forEach((issue: any) => {
            if (!issuesByContract.has(issue.contract)) {
              issuesByContract.set(issue.contract, []);
            }
            issuesByContract.get(issue.contract)!.push(issue);
          });

          // Display issues grouped by contract
          issuesByContract.forEach((issues, contractName) => {
            crossContractSection += `**Contract: ${contractName}**\n\n`;
            issues.forEach((issue: any) => {
              crossContractSection += `- **${issue.severity}**: ${issue.description} (${issue.function})\n`;
              if (issue.recommendation) {
                crossContractSection += `  - Recommendation: ${issue.recommendation}\n`;
              }
            });
            crossContractSection += '\n';
          });

          // Add critical paths if available
          if (stateFlowResults.criticalPaths && stateFlowResults.criticalPaths.length > 0) {
            crossContractSection += '#### Critical Execution Paths\n\n';
            stateFlowResults.criticalPaths.forEach((path: any) => {
              crossContractSection += `- **${path.risk.toUpperCase()}**: ${path.description}\n`;
              crossContractSection += `  - Path: ${path.path.join(' → ')}\n`;
              crossContractSection += `  - Impact: ${path.impact}\n\n`;
            });
          }

          // Add state invariants if violated
          const violatedInvariants = stateFlowResults.stateInvariants?.filter((inv: any) => inv.violated) || [];
          if (violatedInvariants.length > 0) {
            crossContractSection += '#### Protocol Invariant Violations\n\n';
            violatedInvariants.forEach((inv: any) => {
              crossContractSection += `- **${inv.description}**\n`;
              crossContractSection += `  - Affected Contracts: ${inv.contracts.join(', ')}\n`;
              crossContractSection += `  - Impact: ${inv.impact}\n\n`;
            });
          }
        }

        // Mitigation Verification Results
        if (mitigationVerificationResults && mitigationVerificationResults.length > 0) {
          crossContractSection += '### Mitigation Verification\n\n';

          const criticalUnmitigated = mitigationVerificationResults.filter(
            (r: any) => (r.effectiveness === 'None' || r.effectiveness === 'Partial') && r.residualRisk === 'Critical'
          );
          const highRiskUnmitigated = mitigationVerificationResults.filter(
            (r: any) => (r.effectiveness === 'None' || r.effectiveness === 'Partial') && r.residualRisk === 'High'
          );

          if (criticalUnmitigated.length > 0) {
            crossContractSection += `⚠️ **CRITICAL:** ${criticalUnmitigated.length} vulnerabilities with inadequate mitigation\n\n`;
          }
          if (highRiskUnmitigated.length > 0) {
            crossContractSection += `⚠️ **HIGH RISK:** ${highRiskUnmitigated.length} vulnerabilities with partial mitigation\n\n`;
          }

          mitigationVerificationResults.forEach((result: any) => {
            if (result.effectiveness !== 'Full') {
              crossContractSection += `**${result.vulnerabilityTitle}**\n`;
              crossContractSection += `- Mitigation Effectiveness: ${result.effectiveness}\n`;
              crossContractSection += `- Coverage: ${result.coverage}%\n`;
              crossContractSection += `- Residual Risk: ${result.residualRisk}\n`;
              crossContractSection += `- Mitigations Applied: ${result.mitigations.length}\n`;

              if (result.verificationDetails.length > 0) {
                crossContractSection += '- Verification Details:\n';
                result.verificationDetails.forEach((detail: any) => {
                  const statusIcon = detail.status === 'verified' ? '✓' : detail.status === 'partial' ? '⚠' : '✗';
                  crossContractSection += `  ${statusIcon} ${detail.aspect}: ${detail.description}\n`;
                });
              }

              if (result.recommendations.length > 0) {
                crossContractSection += '- Recommendations:\n';
                result.recommendations.forEach((rec: string) => {
                  crossContractSection += `  - ${rec}\n`;
                });
              }
              crossContractSection += '\n';
            }
          });
        }

        // Economic Attack Vector Analysis Results
        if (economicAttackAnalysisResults) {
          crossContractSection += '### Economic Attack Vector Analysis\n\n';

          crossContractSection += `- **Total Economic Attack Vectors:** ${economicAttackAnalysisResults.attackVectors.length}\n`;
          crossContractSection += `- **Risk Score:** ${economicAttackAnalysisResults.totalRiskScore}/100\n`;
          crossContractSection += `- **Fund Loss Exposure:** ${economicAttackAnalysisResults.fundLossExposure}\n`;
          crossContractSection += `- **Mitigation Effectiveness:** ${economicAttackAnalysisResults.mitigationEffectiveness}%\n\n`;

          if (economicAttackAnalysisResults.attackVectors.length > 0) {
            const criticalAttacks = economicAttackAnalysisResults.attackVectors.filter((v: any) => v.severity === 'Critical');
            const highAttacks = economicAttackAnalysisResults.attackVectors.filter((v: any) => v.severity === 'High');

            if (criticalAttacks.length > 0) {
              crossContractSection += `🚨 **${criticalAttacks.length} CRITICAL** economic attack vectors identified\n\n`;
            }
            if (highAttacks.length > 0) {
              crossContractSection += `⚠️ **${highAttacks.length} HIGH** severity economic attack vectors identified\n\n`;
            }

            // Group by attack type
            const attacksByType = new Map<string, any[]>();
            economicAttackAnalysisResults.attackVectors.forEach((attack: any) => {
              if (!attacksByType.has(attack.type)) {
                attacksByType.set(attack.type, []);
              }
              attacksByType.get(attack.type)!.push(attack);
            });

            attacksByType.forEach((attacks, type) => {
              crossContractSection += `#### ${type}\n`;
              attacks.forEach((attack: any) => {
                crossContractSection += `- **Severity:** ${attack.severity} | **Probability:** ${attack.probability}\n`;
                crossContractSection += `  - **Contracts:** ${attack.contracts.join(', ')}\n`;
                crossContractSection += `  - **Impact:** ${attack.economicImpact}\n`;
                crossContractSection += `  - **Potential Loss:** ${attack.potentialLoss}\n`;
                crossContractSection += `  - **Scenario:** ${attack.exploitScenario}\n`;
                crossContractSection += `  - **Recommendation:** ${attack.recommendation}\n\n`;
              });
            });
          }

          // Add economic recommendations
          if (economicAttackAnalysisResults.recommendations.length > 0) {
            crossContractSection += '#### Economic Risk Recommendations\n\n';
            economicAttackAnalysisResults.recommendations.forEach((rec: string) => {
              crossContractSection += `- ${rec}\n`;
            });
            crossContractSection += '\n';
          }
        }
      }

      // Format threat intelligence findings
      let threatIntelSection = '\n\n## Threat Intelligence Assessment\n\n';
      threatIntelSection += `**Overall Risk Level:** ${threatAssessment.overallRisk.toUpperCase()} (Score: ${threatAssessment.riskScore}/100)\n\n`;
      
      if (threatAssessment.matchedIndicators.length > 0) {
        threatIntelSection += '### Known Exploit Patterns Detected\n\n';
        threatAssessment.matchedIndicators.forEach((indicator: any) => {
          threatIntelSection += `- **${indicator.description}** (${indicator.severity} severity, ${(indicator.confidence * 100).toFixed(0)}% confidence)\n`;
          if (indicator.relatedExploits.length > 0) {
            threatIntelSection += `  - Related exploits: ${indicator.relatedExploits.slice(0, 2).join(', ')}\n`;
          }
        });
        threatIntelSection += '\n';
      }

      if (threatAssessment.historicalIncidents.length > 0) {
        threatIntelSection += '### Historical Incidents\n\n';
        threatAssessment.historicalIncidents.forEach((incident: any) => {
          threatIntelSection += `- **${incident.exploitType}** (${incident.date.toISOString().split('T')[0]})\n`;
          threatIntelSection += `  - Loss: ${incident.lossAmount || 'N/A'}\n`;
          threatIntelSection += `  - Description: ${incident.description}\n`;
          if (incident.remediation) {
            threatIntelSection += `  - Remediation: ${incident.remediation}\n`;
          }
        });
        threatIntelSection += '\n';
      }

      if (threatAssessment.recommendations.length > 0) {
        threatIntelSection += '### Security Recommendations\n\n';
        threatAssessment.recommendations.forEach((rec: string) => {
          threatIntelSection += `- ${rec}\n`;
        });
        threatIntelSection += '\n';
      }

      if (threatAssessment.monitoringAlerts.length > 0) {
        threatIntelSection += '### Security Alerts\n\n';
        threatAssessment.monitoringAlerts.forEach((alert: any) => {
          threatIntelSection += `⚠️ **${alert.severity.toUpperCase()}:** ${alert.message}\n`;
        });
        threatIntelSection += '\n';
      }

      // Append economic findings, cross-contract analysis, and threat intelligence to AI analysis
      formattedResponse += '\n\n## Specialized Economic Exploit Analysis\n\n' + formattedEconomicFindings;
      formattedResponse += crossContractSection;
      formattedResponse += threatIntelSection;

      // Calculate total analysis time
      const analysisTime = Date.now() - analysisStartTime;
      
      // Record metrics in security monitoring
      const monitor = getSecurityMonitor();
      const allFindings = [...economicFindings];
      monitor.recordAnalysis(
        allFindings,
        analysisTime,
        mergedCode.length,
        params.contractName || 'unknown'
      );

      logger.info('Contract Analysis', `Analysis completed in ${analysisTime}ms with ${allFindings.length} findings`);
      const report = await generateReport({
        code: mergedCode,
        files: filesToAnalyze,
        aiAnalysis: formattedResponse,
        vulnerabilities: [],
        gasOptimizations: [],
        contractName: params.contractName,
        chain: params.chain,
      });

      return {
        filteredFiles: filesToAnalyze,
        vulnerabilities: [],
        optimizations: [],
        report: {
          analysis: formattedResponse,
        },
        threatAssessment,
        monitoringMetrics: {
          analysisTime,
          findingsCount: allFindings.length,
          riskScore: threatAssessment.riskScore
        },
        // Cross-contract analysis results (only available in protocol mode)
        ...(isProtocolMode && {
          dependencyGraph,
          stateFlowAnalysis: stateFlowResults,
          mitigationVerification: mitigationVerificationResults,
          economicAttackAnalysis: economicAttackAnalysisResults
        })
      };
    } catch (error: unknown) {
      if (
        (error instanceof Error && error.name === "AbortError") ||
        params.signal?.aborted
      ) {
        throw new Error("Analysis cancelled");
      }
      lastError = error;
      retryCount++;

      // if we have retry chances, wait and retry
      if (retryCount < maxRetries) {
        console.log(
          `Analysis attempt ${retryCount} failed, retrying in ${
            retryCount * 2
          } seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryCount * 2000));
        continue;
      }

      // if we have reached the maximum retry count, throw the last error
      console.error(`Analysis failed after ${maxRetries} attempts:`, error);
      throw new Error(
        `Analysis failed after ${maxRetries} attempts: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  throw new Error(
    `Unexpected error: Analysis failed after ${maxRetries} attempts`
  );
}
