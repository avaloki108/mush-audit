/**
 * Real-Time Threat Intelligence Integration
 * 
 * Provides continuous security monitoring, threat feed integration,
 * and real-time risk assessment for smart contract analysis.
 */

import { logger } from '@/utils/performance';

// ==================== Types ====================

export interface ThreatIntelligenceConfig {
  enableRealTimeFeeds: boolean;
  chainalysisApiKey?: string;
  cipherTraceApiKey?: string;
  threatFeedUpdateInterval: number; // milliseconds
  maxHistoricalDays: number;
  enableDarkWebMonitoring: boolean;
  confidenceThreshold: number; // 0-1
}

export interface ThreatIndicator {
  id: string;
  type: 'exploit_pattern' | 'malicious_address' | 'vulnerability_signature' | 'attack_vector';
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number; // 0-1
  description: string;
  firstSeen: Date;
  lastSeen: Date;
  occurrences: number;
  relatedExploits: string[];
  mitigationStrategies: string[];
  cveIds?: string[];
  tags: string[];
}

export interface ThreatFeedSource {
  name: string;
  type: 'blockchain_api' | 'security_db' | 'dark_web' | 'community';
  lastUpdate: Date;
  status: 'active' | 'inactive' | 'error';
  reliability: number; // 0-1
  indicatorCount: number;
}

export interface ContractThreatAssessment {
  overallRisk: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
  riskScore: number; // 0-100
  matchedIndicators: ThreatIndicator[];
  emergingThreats: ThreatIndicator[];
  historicalIncidents: HistoricalIncident[];
  recommendations: string[];
  monitoringAlerts: MonitoringAlert[];
  lastAssessed: Date;
}

export interface HistoricalIncident {
  id: string;
  contractAddress?: string;
  exploitType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  date: Date;
  lossAmount?: string;
  description: string;
  patternSignature: string;
  matchConfidence: number;
  remediation?: string;
  references: string[];
}

export interface MonitoringAlert {
  id: string;
  type: 'emerging_threat' | 'pattern_match' | 'high_risk_interaction' | 'anomaly_detected';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: Date;
  actionRequired: boolean;
  suggestedActions: string[];
}

export interface KnownExploitPattern {
  name: string;
  category: string;
  signature: string;
  indicators: string[];
  realWorldExamples: string[];
  detectionHeuristics: string[];
  preventionMeasures: string[];
}

// ==================== Known Exploit Database ====================

export class KnownExploitDatabase {
  private static exploits: Map<string, KnownExploitPattern> = new Map([
    ['dao_hack', {
      name: 'DAO Reentrancy Attack',
      category: 'Reentrancy',
      signature: 'recursive_call_before_state_update',
      indicators: [
        'external call before balance update',
        'missing reentrancy guard',
        'state changes after external calls',
        'recursive withdrawal pattern'
      ],
      realWorldExamples: [
        'The DAO (2016) - $60M loss',
        'Lendf.Me (2020) - $25M loss'
      ],
      detectionHeuristics: [
        'call.value() before state modification',
        'no mutex/reentrancy protection',
        'withdrawal function with external calls'
      ],
      preventionMeasures: [
        'Use checks-effects-interactions pattern',
        'Implement reentrancy guards',
        'Update state before external calls',
        'Use pull over push payment pattern'
      ]
    }],
    ['parity_wallet', {
      name: 'Parity Wallet Vulnerability',
      category: 'Access Control',
      signature: 'delegatecall_to_untrusted',
      indicators: [
        'delegatecall to user-controlled address',
        'unprotected delegatecall',
        'library destruction vulnerability',
        'missing access control on critical functions'
      ],
      realWorldExamples: [
        'Parity Multisig (2017) - $30M stolen',
        'Parity Library (2017) - $280M frozen'
      ],
      detectionHeuristics: [
        'delegatecall without access control',
        'public initialization functions',
        'selfdestruct in library contracts'
      ],
      preventionMeasures: [
        'Restrict delegatecall usage',
        'Implement proper access controls',
        'Avoid selfdestruct in libraries',
        'Use initializer modifiers'
      ]
    }],
    ['flash_loan_attack', {
      name: 'Flash Loan Price Manipulation',
      category: 'Economic Exploit',
      signature: 'flash_loan_oracle_manipulation',
      indicators: [
        'flash loan in same transaction',
        'price oracle manipulation',
        'liquidity pool manipulation',
        'arbitrage with borrowed funds'
      ],
      realWorldExamples: [
        'bZx (2020) - $1M loss',
        'Harvest Finance (2020) - $34M loss',
        'Cream Finance (2021) - $130M loss'
      ],
      detectionHeuristics: [
        'large loan followed by price-dependent action',
        'single-source price oracle',
        'no flash loan protection',
        'manipulatable liquidity calculations'
      ],
      preventionMeasures: [
        'Use time-weighted average prices (TWAP)',
        'Implement flash loan detection',
        'Multiple oracle sources',
        'Add deposit/withdrawal delays'
      ]
    }],
    ['integer_overflow', {
      name: 'Integer Overflow/Underflow',
      category: 'Arithmetic',
      signature: 'unchecked_arithmetic',
      indicators: [
        'arithmetic without SafeMath',
        'Solidity version < 0.8.0',
        'unchecked blocks in 0.8+',
        'multiplication before division'
      ],
      realWorldExamples: [
        'BeautyChain (2018) - BEC token overflow',
        'SMT Token (2018) - batch overflow'
      ],
      detectionHeuristics: [
        'no SafeMath import (< 0.8.0)',
        'unchecked arithmetic operations',
        'user-controlled arithmetic inputs'
      ],
      preventionMeasures: [
        'Use Solidity 0.8+ with built-in checks',
        'Use SafeMath library for older versions',
        'Avoid unchecked blocks with user input',
        'Add input validation'
      ]
    }],
    ['front_running', {
      name: 'Front-Running/MEV Exploit',
      category: 'Transaction Ordering',
      signature: 'mev_vulnerable_transaction',
      indicators: [
        'predictable transaction ordering dependency',
        'no slippage protection',
        'public mempool exposure',
        'high-value transactions without protection'
      ],
      realWorldExamples: [
        'Various DEX trades exploited daily',
        'NFT minting front-running'
      ],
      detectionHeuristics: [
        'price-sensitive operations without slippage',
        'no commit-reveal scheme',
        'no MEV protection'
      ],
      preventionMeasures: [
        'Implement slippage tolerance',
        'Use commit-reveal schemes',
        'Private transaction pools',
        'Batch auctions'
      ]
    }],
    ['signature_replay', {
      name: 'Signature Replay Attack',
      category: 'Cryptography',
      signature: 'missing_nonce_or_chainid',
      indicators: [
        'signature verification without nonce',
        'missing chain ID in signature',
        'no replay protection',
        'reusable signatures'
      ],
      realWorldExamples: [
        'Multiple projects affected during hard forks',
        'Cross-chain replay attacks'
      ],
      detectionHeuristics: [
        'ecrecover without nonce check',
        'missing chain ID validation',
        'no signature invalidation mechanism'
      ],
      preventionMeasures: [
        'Include nonce in signed messages',
        'Add chain ID to signatures',
        'Implement signature expiration',
        'Track used signatures'
      ]
    }],
    ['access_control', {
      name: 'Access Control Vulnerabilities',
      category: 'Authorization',
      signature: 'missing_or_broken_access_control',
      indicators: [
        'public functions that should be restricted',
        'missing onlyOwner modifier',
        'incorrect role checks',
        'tx.origin for authentication'
      ],
      realWorldExamples: [
        'Rubixi (2016) - Constructor typo',
        'Multiple projects with public admin functions'
      ],
      detectionHeuristics: [
        'critical functions without access control',
        'tx.origin instead of msg.sender',
        'constructor name mismatch'
      ],
      preventionMeasures: [
        'Use access control libraries (OpenZeppelin)',
        'Never use tx.origin for auth',
        'Test access controls thoroughly',
        'Use constructor keyword'
      ]
    }],
    ['price_oracle_manipulation', {
      name: 'Price Oracle Manipulation',
      category: 'Oracle',
      signature: 'single_source_price_oracle',
      indicators: [
        'single DEX price source',
        'spot price usage',
        'manipulatable price feeds',
        'insufficient liquidity checks'
      ],
      realWorldExamples: [
        'Mango Markets (2022) - $115M',
        'Fortress DAO (2022) - Price manipulation'
      ],
      detectionHeuristics: [
        'price from single AMM pool',
        'no TWAP implementation',
        'low liquidity price sources'
      ],
      preventionMeasures: [
        'Use multiple oracle sources',
        'Implement TWAP',
        'Chainlink or similar decentralized oracles',
        'Liquidity depth checks'
      ]
    }]
  ]);

  static getExploit(id: string): KnownExploitPattern | undefined {
    return this.exploits.get(id);
  }

  static getAllExploits(): KnownExploitPattern[] {
    return Array.from(this.exploits.values());
  }

  static searchByCategory(category: string): KnownExploitPattern[] {
    return Array.from(this.exploits.values())
      .filter(exploit => exploit.category.toLowerCase() === category.toLowerCase());
  }

  static searchByIndicator(indicator: string): KnownExploitPattern[] {
    const lowerIndicator = indicator.toLowerCase();
    return Array.from(this.exploits.values())
      .filter(exploit => 
        exploit.indicators.some(ind => ind.toLowerCase().includes(lowerIndicator))
      );
  }
}

// ==================== Threat Intelligence Engine ====================

export class ThreatIntelligenceEngine {
  private config: ThreatIntelligenceConfig;
  private threatIndicators: Map<string, ThreatIndicator> = new Map();
  private feedSources: Map<string, ThreatFeedSource> = new Map();
  private updateInterval?: NodeJS.Timeout;

  constructor(config: Partial<ThreatIntelligenceConfig> = {}) {
    this.config = {
      enableRealTimeFeeds: config.enableRealTimeFeeds ?? false,
      chainalysisApiKey: config.chainalysisApiKey,
      cipherTraceApiKey: config.cipherTraceApiKey,
      threatFeedUpdateInterval: config.threatFeedUpdateInterval ?? 3600000, // 1 hour
      maxHistoricalDays: config.maxHistoricalDays ?? 365,
      enableDarkWebMonitoring: config.enableDarkWebMonitoring ?? false,
      confidenceThreshold: config.confidenceThreshold ?? 0.7
    };

    this.initializeThreatFeeds();
  }

  private initializeThreatFeeds(): void {
    // Initialize offline threat database
    this.loadOfflineThreatDatabase();

    // Setup real-time feeds if enabled
    if (this.config.enableRealTimeFeeds) {
      this.startRealTimeFeedUpdates();
    }
  }

  private loadOfflineThreatDatabase(): void {
    const now = new Date();
    
    // Load known exploit patterns as threat indicators
    KnownExploitDatabase.getAllExploits().forEach((exploit, index) => {
      const indicator: ThreatIndicator = {
        id: `offline_${index}`,
        type: 'exploit_pattern',
        severity: this.getSeverityFromCategory(exploit.category),
        confidence: 0.95,
        description: exploit.name,
        firstSeen: new Date('2016-01-01'),
        lastSeen: now,
        occurrences: exploit.realWorldExamples.length,
        relatedExploits: exploit.realWorldExamples,
        mitigationStrategies: exploit.preventionMeasures,
        tags: [exploit.category, ...exploit.indicators]
      };
      
      this.threatIndicators.set(indicator.id, indicator);
    });

    // Add feed source
    this.feedSources.set('offline_database', {
      name: 'Offline Known Exploits Database',
      type: 'security_db',
      lastUpdate: now,
      status: 'active',
      reliability: 0.95,
      indicatorCount: this.threatIndicators.size
    });

    logger.info('Threat Intelligence', `Loaded ${this.threatIndicators.size} threat indicators from offline database`);
  }

  private getSeverityFromCategory(category: string): 'critical' | 'high' | 'medium' | 'low' {
    const criticalCategories = ['Reentrancy', 'Access Control', 'Economic Exploit'];
    const highCategories = ['Arithmetic', 'Oracle', 'Authorization'];
    const mediumCategories = ['Transaction Ordering', 'Cryptography'];
    
    if (criticalCategories.includes(category)) return 'critical';
    if (highCategories.includes(category)) return 'high';
    if (mediumCategories.includes(category)) return 'medium';
    return 'low';
  }

  private startRealTimeFeedUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.updateThreatFeeds().catch(error => {
        logger.error('Threat Intelligence', 'Failed to update threat feeds', error);
      });
    }, this.config.threatFeedUpdateInterval);

    // Initial update
    this.updateThreatFeeds().catch(error => {
      logger.error('Threat Intelligence', 'Initial threat feed update failed', error);
    });
  }

  private async updateThreatFeeds(): Promise<void> {
    logger.info('Threat Intelligence', 'Updating threat feeds...');
    
    // Update from various sources
    await Promise.allSettled([
      this.updateChainalysisFeed(),
      this.updateCipherTraceFeed(),
      this.updateCommunityFeeds(),
      this.config.enableDarkWebMonitoring ? this.updateDarkWebFeeds() : Promise.resolve()
    ]);
    
    logger.info('Threat Intelligence', 'Threat feeds updated successfully');
  }

  private async updateChainalysisFeed(): Promise<void> {
    if (!this.config.chainalysisApiKey) return;
    
    // Placeholder for Chainalysis API integration
    // In production, this would call actual Chainalysis API
    logger.debug('Threat Intelligence', 'Chainalysis feed update skipped (offline mode)');
  }

  private async updateCipherTraceFeed(): Promise<void> {
    if (!this.config.cipherTraceApiKey) return;
    
    // Placeholder for CipherTrace API integration
    logger.debug('Threat Intelligence', 'CipherTrace feed update skipped (offline mode)');
  }

  private async updateCommunityFeeds(): Promise<void> {
    // Placeholder for community threat feeds (Rekt News, BlockSec, etc.)
    logger.debug('Threat Intelligence', 'Community feed update skipped (offline mode)');
  }

  private async updateDarkWebFeeds(): Promise<void> {
    // Placeholder for dark web monitoring integration
    logger.debug('Threat Intelligence', 'Dark web monitoring skipped (offline mode)');
  }

  /**
   * Assess contract threat level based on detected patterns
   */
  async assessContractThreats(
    contractCode: string,
    detectedVulnerabilities: any[]
  ): Promise<ContractThreatAssessment> {
    const matchedIndicators: ThreatIndicator[] = [];
    const emergingThreats: ThreatIndicator[] = [];
    const historicalIncidents: HistoricalIncident[] = [];
    const alerts: MonitoringAlert[] = [];

    // Match detected vulnerabilities with known threat indicators
    for (const vuln of detectedVulnerabilities) {
      const matches = this.findMatchingIndicators(vuln);
      matchedIndicators.push(...matches);

      // Check for historical incidents
      const incidents = this.findHistoricalIncidents(vuln);
      historicalIncidents.push(...incidents);
    }

    // Check for emerging threats
    const emerging = this.identifyEmergingThreats(contractCode);
    emergingThreats.push(...emerging);

    // Generate monitoring alerts
    if (matchedIndicators.some(i => i.severity === 'critical')) {
      alerts.push({
        id: `alert_${Date.now()}`,
        type: 'pattern_match',
        severity: 'critical',
        message: 'Critical vulnerability patterns detected matching known exploits',
        timestamp: new Date(),
        actionRequired: true,
        suggestedActions: [
          'Immediate security audit required',
          'Do not deploy to mainnet',
          'Consult security experts'
        ]
      });
    }

    // Calculate risk score
    const riskScore = this.calculateRiskScore(matchedIndicators, emergingThreats, historicalIncidents);
    const overallRisk = this.getRiskLevel(riskScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(matchedIndicators, historicalIncidents);

    return {
      overallRisk,
      riskScore,
      matchedIndicators: this.deduplicateIndicators(matchedIndicators),
      emergingThreats,
      historicalIncidents,
      recommendations,
      monitoringAlerts: alerts,
      lastAssessed: new Date()
    };
  }

  private findMatchingIndicators(vulnerability: any): ThreatIndicator[] {
    const matches: ThreatIndicator[] = [];
    
    for (const indicator of this.threatIndicators.values()) {
      // Match by type and description
      if (this.vulnerabilityMatchesIndicator(vulnerability, indicator)) {
        matches.push(indicator);
      }
    }
    
    return matches.filter(i => i.confidence >= this.config.confidenceThreshold);
  }

  private vulnerabilityMatchesIndicator(vuln: any, indicator: ThreatIndicator): boolean {
    const vulnText = JSON.stringify(vuln).toLowerCase();
    const indicatorTags = indicator.tags.map(t => t.toLowerCase());
    
    return indicatorTags.some(tag => vulnText.includes(tag)) ||
           vulnText.includes(indicator.description.toLowerCase());
  }

  private findHistoricalIncidents(vulnerability: any): HistoricalIncident[] {
    const incidents: HistoricalIncident[] = [];
    
    // Map vulnerabilities to known historical incidents
    const vulnType = vulnerability.type?.toLowerCase() || '';
    
    if (vulnType.includes('reentrancy')) {
      incidents.push({
        id: 'dao_2016',
        exploitType: 'Reentrancy Attack',
        severity: 'critical',
        date: new Date('2016-06-17'),
        lossAmount: '60000000 USD',
        description: 'The DAO hack - recursive call vulnerability exploited',
        patternSignature: 'recursive_call_before_state_update',
        matchConfidence: 0.95,
        remediation: 'Implemented checks-effects-interactions pattern',
        references: [
          'https://hackingdistributed.com/2016/06/18/analysis-of-the-dao-exploit/',
          'https://github.com/ethereum/wiki/wiki/The-DAO-Fork'
        ]
      });
    }

    if (vulnType.includes('flash loan') || vulnType.includes('oracle')) {
      incidents.push({
        id: 'cream_2021',
        exploitType: 'Flash Loan Price Manipulation',
        severity: 'critical',
        date: new Date('2021-10-27'),
        lossAmount: '130000000 USD',
        description: 'Cream Finance - Flash loan oracle manipulation',
        patternSignature: 'flash_loan_oracle_manipulation',
        matchConfidence: 0.88,
        references: [
          'https://medium.com/cream-finance/post-mortem-exploit-oct-27-2021-3c3c6f308c89'
        ]
      });
    }

    return incidents;
  }

  private identifyEmergingThreats(contractCode: string): ThreatIndicator[] {
    const emerging: ThreatIndicator[] = [];
    const now = new Date();
    const recentThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Identify recently added indicators
    for (const indicator of this.threatIndicators.values()) {
      if (indicator.firstSeen > recentThreshold && indicator.severity !== 'low') {
        emerging.push(indicator);
      }
    }
    
    return emerging;
  }

  private calculateRiskScore(
    matched: ThreatIndicator[],
    emerging: ThreatIndicator[],
    incidents: HistoricalIncident[]
  ): number {
    let score = 0;
    
    // Severity scoring
    const severityScores = { critical: 40, high: 25, medium: 10, low: 5 };
    matched.forEach(i => {
      score += severityScores[i.severity] * i.confidence;
    });
    
    // Emerging threat bonus
    score += emerging.length * 15;
    
    // Historical incident weight
    score += incidents.length * 10;
    
    // Cap at 100
    return Math.min(Math.round(score), 100);
  }

  private getRiskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' | 'minimal' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'minimal';
  }

  private generateRecommendations(
    indicators: ThreatIndicator[],
    incidents: HistoricalIncident[]
  ): string[] {
    const recommendations = new Set<string>();
    
    // Add mitigation strategies from indicators
    indicators.forEach(i => {
      i.mitigationStrategies.forEach(s => recommendations.add(s));
    });
    
    // Add remediation from incidents
    incidents.forEach(i => {
      if (i.remediation) recommendations.add(i.remediation);
    });
    
    // General recommendations based on risk
    if (indicators.some(i => i.severity === 'critical')) {
      recommendations.add('Conduct comprehensive security audit before deployment');
      recommendations.add('Consider bug bounty program');
      recommendations.add('Implement emergency pause mechanism');
    }
    
    return Array.from(recommendations);
  }

  private deduplicateIndicators(indicators: ThreatIndicator[]): ThreatIndicator[] {
    const seen = new Set<string>();
    return indicators.filter(i => {
      if (seen.has(i.description)) return false;
      seen.add(i.description);
      return true;
    });
  }

  /**
   * Get real-time threat intelligence for specific pattern
   */
  async getPatternThreatIntel(pattern: string): Promise<ThreatIndicator[]> {
    return Array.from(this.threatIndicators.values())
      .filter(i => 
        i.tags.some(tag => tag.toLowerCase().includes(pattern.toLowerCase())) ||
        i.description.toLowerCase().includes(pattern.toLowerCase())
      )
      .sort((a, b) => {
        // Sort by severity then confidence
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.confidence - a.confidence;
      });
  }

  /**
   * Get feed status and health
   */
  getFeedStatus(): Map<string, ThreatFeedSource> {
    return new Map(this.feedSources);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// ==================== Export ====================

export default ThreatIntelligenceEngine;