/**
 * Security Monitoring Module
 * 
 * Monitors detection accuracy, tracks false positives/negatives,
 * and provides continuous learning from new exploit patterns.
 */

import { logger } from '@/utils/performance';

// ==================== Types ====================

export interface DetectionMetrics {
  totalAnalyses: number;
  vulnerabilitiesDetected: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  averageAnalysisTime: number;
  averageConfidenceScore: number;
  timestamp: Date;
}

export interface AccuracyMetrics {
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number; // TP / (TP + FP)
  recall: number; // TP / (TP + FN)
  f1Score: number; // 2 * (precision * recall) / (precision + recall)
  accuracy: number; // (TP + TN) / (TP + TN + FP + FN)
}

export interface PerformanceMetrics {
  averageAnalysisTime: number;
  p50AnalysisTime: number;
  p95AnalysisTime: number;
  p99AnalysisTime: number;
  slowestAnalyses: PerformanceEntry[];
  memoryUsage: MemoryStats;
}

export interface PerformanceEntry {
  contractId: string;
  analysisTime: number;
  contractSize: number;
  timestamp: Date;
}

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

export interface PatternEffectiveness {
  patternId: string;
  patternName: string;
  detectionCount: number;
  truePositiveRate: number;
  falsePositiveRate: number;
  avgConfidence: number;
  lastDetection: Date;
}

export interface MonitoringAlert {
  id: string;
  type: 'accuracy_degradation' | 'performance_issue' | 'high_false_positive' | 'pattern_ineffective';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: Date;
  metrics: any;
  suggestedActions: string[];
}

export interface LearningEvent {
  id: string;
  type: 'new_pattern' | 'pattern_update' | 'false_positive_correction' | 'false_negative_discovery';
  pattern: string;
  description: string;
  confidence: number;
  source: 'manual' | 'automated' | 'community';
  timestamp: Date;
  applied: boolean;
}

export interface MonitoringConfig {
  enableContinuousMonitoring: boolean;
  accuracyThreshold: number; // Minimum acceptable accuracy (0-1)
  performanceThreshold: number; // Maximum acceptable analysis time (ms)
  falsePositiveRateThreshold: number; // Maximum acceptable FP rate (0-1)
  alertsEnabled: boolean;
  learningEnabled: boolean;
  metricsRetentionDays: number;
}

// ==================== Security Monitoring Engine ====================

export class SecurityMonitoringEngine {
  private config: MonitoringConfig;
  private detectionHistory: DetectionMetrics[] = [];
  private accuracyHistory: AccuracyMetrics[] = [];
  private performanceHistory: PerformanceEntry[] = [];
  private patternEffectiveness: Map<string, PatternEffectiveness> = new Map();
  private alerts: MonitoringAlert[] = [];
  private learningEvents: LearningEvent[] = [];

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableContinuousMonitoring: config.enableContinuousMonitoring ?? true,
      accuracyThreshold: config.accuracyThreshold ?? 0.85,
      performanceThreshold: config.performanceThreshold ?? 5000,
      falsePositiveRateThreshold: config.falsePositiveRateThreshold ?? 0.15,
      alertsEnabled: config.alertsEnabled ?? true,
      learningEnabled: config.learningEnabled ?? true,
      metricsRetentionDays: config.metricsRetentionDays ?? 30
    };

    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (this.config.enableContinuousMonitoring) {
      logger.info('Security Monitoring', 'Continuous monitoring enabled');
      
      // Cleanup old metrics periodically
      setInterval(() => {
        this.cleanupOldMetrics();
      }, 24 * 60 * 60 * 1000); // Daily
    }
  }

  /**
   * Record analysis metrics
   */
  recordAnalysis(
    vulnerabilitiesFound: any[],
    analysisTime: number,
    contractSize: number,
    contractId: string
  ): void {
    // Record performance
    this.performanceHistory.push({
      contractId,
      analysisTime,
      contractSize,
      timestamp: new Date()
    });

    // Count by severity
    const criticalCount = vulnerabilitiesFound.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilitiesFound.filter(v => v.severity === 'high').length;
    const mediumCount = vulnerabilitiesFound.filter(v => v.severity === 'medium').length;
    const lowCount = vulnerabilitiesFound.filter(v => v.severity === 'low').length;

    // Calculate average confidence
    const avgConfidence = vulnerabilitiesFound.length > 0
      ? vulnerabilitiesFound.reduce((sum, v) => sum + (v.confidence || 0.5), 0) / vulnerabilitiesFound.length
      : 0;

    // Record detection metrics
    const metrics: DetectionMetrics = {
      totalAnalyses: 1,
      vulnerabilitiesDetected: vulnerabilitiesFound.length,
      criticalFindings: criticalCount,
      highFindings: highCount,
      mediumFindings: mediumCount,
      lowFindings: lowCount,
      averageAnalysisTime: analysisTime,
      averageConfidenceScore: avgConfidence,
      timestamp: new Date()
    };

    this.detectionHistory.push(metrics);

    // Update pattern effectiveness
    this.updatePatternEffectiveness(vulnerabilitiesFound);

    // Check for performance issues
    if (analysisTime > this.config.performanceThreshold && this.config.alertsEnabled) {
      this.generateAlert({
        type: 'performance_issue',
        severity: 'medium',
        message: `Analysis time (${analysisTime}ms) exceeded threshold (${this.config.performanceThreshold}ms)`,
        metrics: { analysisTime, contractSize, contractId },
        suggestedActions: [
          'Review contract complexity',
          'Consider optimization of analysis patterns',
          'Check system resources'
        ]
      });
    }

    logger.debug('Security Monitoring', `Recorded analysis: ${vulnerabilitiesFound.length} vulnerabilities, ${analysisTime}ms`);
  }

  /**
   * Record accuracy feedback
   */
  recordAccuracyFeedback(
    truePositives: number,
    falsePositives: number,
    trueNegatives: number,
    falseNegatives: number
  ): void {
    const total = truePositives + falsePositives + trueNegatives + falseNegatives;
    
    if (total === 0) {
      logger.warn('Security Monitoring', 'Cannot calculate accuracy metrics with zero samples');
      return;
    }

    const precision = truePositives + falsePositives > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;
    
    const recall = truePositives + falseNegatives > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;
    
    const f1Score = precision + recall > 0
      ? 2 * (precision * recall) / (precision + recall)
      : 0;
    
    const accuracy = (truePositives + trueNegatives) / total;

    const metrics: AccuracyMetrics = {
      truePositives,
      falsePositives,
      trueNegatives,
      falseNegatives,
      precision,
      recall,
      f1Score,
      accuracy
    };

    this.accuracyHistory.push(metrics);

    // Check for accuracy degradation
    if (accuracy < this.config.accuracyThreshold && this.config.alertsEnabled) {
      this.generateAlert({
        type: 'accuracy_degradation',
        severity: 'high',
        message: `Detection accuracy (${(accuracy * 100).toFixed(1)}%) below threshold (${(this.config.accuracyThreshold * 100).toFixed(1)}%)`,
        metrics,
        suggestedActions: [
          'Review recent pattern changes',
          'Analyze false positive/negative patterns',
          'Consider retraining or updating detection rules',
          'Review test suite coverage'
        ]
      });
    }

    // Check false positive rate
    const fpRate = truePositives + falsePositives > 0
      ? falsePositives / (truePositives + falsePositives)
      : 0;
    
    if (fpRate > this.config.falsePositiveRateThreshold && this.config.alertsEnabled) {
      this.generateAlert({
        type: 'high_false_positive',
        severity: 'medium',
        message: `False positive rate (${(fpRate * 100).toFixed(1)}%) exceeds threshold (${(this.config.falsePositiveRateThreshold * 100).toFixed(1)}%)`,
        metrics: { falsePositives, truePositives, fpRate },
        suggestedActions: [
          'Refine detection patterns to reduce false positives',
          'Increase confidence thresholds',
          'Review specific false positive cases',
          'Update pattern exclusions'
        ]
      });
    }

    logger.info('Security Monitoring', `Accuracy metrics updated: ${(accuracy * 100).toFixed(1)}% accuracy, ${(precision * 100).toFixed(1)}% precision, ${(recall * 100).toFixed(1)}% recall`);
  }

  private updatePatternEffectiveness(vulnerabilities: any[]): void {
    for (const vuln of vulnerabilities) {
      const patternId = vuln.pattern || vuln.type || 'unknown';
      const patternName = vuln.name || vuln.description || patternId;

      let effectiveness = this.patternEffectiveness.get(patternId);
      
      if (!effectiveness) {
        effectiveness = {
          patternId,
          patternName,
          detectionCount: 0,
          truePositiveRate: 0,
          falsePositiveRate: 0,
          avgConfidence: 0,
          lastDetection: new Date()
        };
      }

      effectiveness.detectionCount++;
      effectiveness.lastDetection = new Date();
      effectiveness.avgConfidence = vuln.confidence || 0.5;

      this.patternEffectiveness.set(patternId, effectiveness);
    }
  }

  /**
   * Record learning event
   */
  recordLearningEvent(event: Omit<LearningEvent, 'id' | 'timestamp'>): void {
    if (!this.config.learningEnabled) return;

    const learningEvent: LearningEvent = {
      ...event,
      id: `learn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.learningEvents.push(learningEvent);

    logger.info('Security Monitoring', `Learning event recorded: ${learningEvent.type} - ${learningEvent.pattern}`);

    // Auto-apply high-confidence automated learning
    if (event.source === 'automated' && event.confidence > 0.9) {
      learningEvent.applied = true;
      logger.info('Security Monitoring', `Auto-applied high-confidence learning: ${learningEvent.pattern}`);
    }
  }

  private generateAlert(alert: Omit<MonitoringAlert, 'id' | 'timestamp'>): void {
    const fullAlert: MonitoringAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.alerts.push(fullAlert);
    logger.warn('Security Monitoring', `Alert generated: ${fullAlert.type} - ${fullAlert.message}`);
  }

  /**
   * Get current detection metrics
   */
  getCurrentMetrics(): DetectionMetrics | null {
    if (this.detectionHistory.length === 0) return null;

    const recentMetrics = this.detectionHistory.slice(-100); // Last 100 analyses
    
    return {
      totalAnalyses: recentMetrics.reduce((sum, m) => sum + m.totalAnalyses, 0),
      vulnerabilitiesDetected: recentMetrics.reduce((sum, m) => sum + m.vulnerabilitiesDetected, 0),
      criticalFindings: recentMetrics.reduce((sum, m) => sum + m.criticalFindings, 0),
      highFindings: recentMetrics.reduce((sum, m) => sum + m.highFindings, 0),
      mediumFindings: recentMetrics.reduce((sum, m) => sum + m.mediumFindings, 0),
      lowFindings: recentMetrics.reduce((sum, m) => sum + m.lowFindings, 0),
      averageAnalysisTime: recentMetrics.reduce((sum, m) => sum + m.averageAnalysisTime, 0) / recentMetrics.length,
      averageConfidenceScore: recentMetrics.reduce((sum, m) => sum + m.averageConfidenceScore, 0) / recentMetrics.length,
      timestamp: new Date()
    };
  }

  /**
   * Get current accuracy metrics
   */
  getCurrentAccuracy(): AccuracyMetrics | null {
    if (this.accuracyHistory.length === 0) return null;
    
    // Return most recent accuracy metrics
    return this.accuracyHistory[this.accuracyHistory.length - 1];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    if (this.performanceHistory.length === 0) {
      return {
        averageAnalysisTime: 0,
        p50AnalysisTime: 0,
        p95AnalysisTime: 0,
        p99AnalysisTime: 0,
        slowestAnalyses: [],
        memoryUsage: this.getMemoryStats()
      };
    }

    const times = this.performanceHistory.map(p => p.analysisTime).sort((a, b) => a - b);
    const avg = times.reduce((sum, t) => sum + t, 0) / times.length;

    return {
      averageAnalysisTime: avg,
      p50AnalysisTime: this.percentile(times, 50),
      p95AnalysisTime: this.percentile(times, 95),
      p99AnalysisTime: this.percentile(times, 99),
      slowestAnalyses: this.performanceHistory
        .sort((a, b) => b.analysisTime - a.analysisTime)
        .slice(0, 10),
      memoryUsage: this.getMemoryStats()
    };
  }

  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  private getMemoryStats(): MemoryStats {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers
    };
  }

  /**
   * Get pattern effectiveness rankings
   */
  getPatternEffectiveness(): PatternEffectiveness[] {
    return Array.from(this.patternEffectiveness.values())
      .sort((a, b) => b.detectionCount - a.detectionCount);
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(count: number = 10): MonitoringAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
  }

  /**
   * Get learning events
   */
  getLearningEvents(includeApplied: boolean = true): LearningEvent[] {
    let events = this.learningEvents;
    
    if (!includeApplied) {
      events = events.filter(e => !e.applied);
    }
    
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Apply learning event
   */
  applyLearningEvent(eventId: string): boolean {
    const event = this.learningEvents.find(e => e.id === eventId);
    
    if (!event) {
      logger.error('Security Monitoring', `Learning event ${eventId} not found`);
      return false;
    }

    if (event.applied) {
      logger.warn('Security Monitoring', `Learning event ${eventId} already applied`);
      return false;
    }

    event.applied = true;
    logger.info('Security Monitoring', `Applied learning event: ${event.pattern}`);
    return true;
  }

  /**
   * Generate comprehensive monitoring report
   */
  generateMonitoringReport(): {
    detection: DetectionMetrics | null;
    accuracy: AccuracyMetrics | null;
    performance: PerformanceMetrics;
    patterns: PatternEffectiveness[];
    alerts: MonitoringAlert[];
    learning: LearningEvent[];
    summary: string;
  } {
    const detection = this.getCurrentMetrics();
    const accuracy = this.getCurrentAccuracy();
    const performance = this.getPerformanceMetrics();
    const patterns = this.getPatternEffectiveness();
    const alerts = this.getRecentAlerts(20);
    const learning = this.getLearningEvents();

    // Generate summary
    let summary = '# Security Monitoring Report\n\n';
    
    if (detection) {
      summary += `## Detection Overview\n`;
      summary += `- Total Analyses: ${detection.totalAnalyses}\n`;
      summary += `- Vulnerabilities Detected: ${detection.vulnerabilitiesDetected}\n`;
      summary += `- Critical: ${detection.criticalFindings}, High: ${detection.highFindings}, Medium: ${detection.mediumFindings}, Low: ${detection.lowFindings}\n`;
      summary += `- Average Confidence: ${(detection.averageConfidenceScore * 100).toFixed(1)}%\n\n`;
    }

    if (accuracy) {
      summary += `## Accuracy Metrics\n`;
      summary += `- Accuracy: ${(accuracy.accuracy * 100).toFixed(1)}%\n`;
      summary += `- Precision: ${(accuracy.precision * 100).toFixed(1)}%\n`;
      summary += `- Recall: ${(accuracy.recall * 100).toFixed(1)}%\n`;
      summary += `- F1 Score: ${(accuracy.f1Score * 100).toFixed(1)}%\n\n`;
    }

    summary += `## Performance\n`;
    summary += `- Average Analysis Time: ${performance.averageAnalysisTime.toFixed(0)}ms\n`;
    summary += `- P95 Analysis Time: ${performance.p95AnalysisTime.toFixed(0)}ms\n`;
    summary += `- Memory Usage: ${(performance.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB\n\n`;

    if (alerts.length > 0) {
      summary += `## Active Alerts\n`;
      summary += `- Total: ${alerts.length}\n`;
      summary += `- Critical: ${alerts.filter(a => a.severity === 'critical').length}\n`;
      summary += `- High: ${alerts.filter(a => a.severity === 'high').length}\n\n`;
    }

    return {
      detection,
      accuracy,
      performance,
      patterns,
      alerts,
      learning,
      summary
    };
  }

  private cleanupOldMetrics(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.metricsRetentionDays);

    // Clean detection history
    this.detectionHistory = this.detectionHistory.filter(
      m => m.timestamp > cutoffDate
    );

    // Clean performance history
    this.performanceHistory = this.performanceHistory.filter(
      p => p.timestamp > cutoffDate
    );

    // Clean alerts
    this.alerts = this.alerts.filter(
      a => a.timestamp > cutoffDate
    );

    logger.info('Security Monitoring', `Cleaned up metrics older than ${this.config.metricsRetentionDays} days`);
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): {
    detectionHistory: DetectionMetrics[];
    accuracyHistory: AccuracyMetrics[];
    performanceHistory: PerformanceEntry[];
    patternEffectiveness: PatternEffectiveness[];
    alerts: MonitoringAlert[];
    learningEvents: LearningEvent[];
  } {
    return {
      detectionHistory: [...this.detectionHistory],
      accuracyHistory: [...this.accuracyHistory],
      performanceHistory: [...this.performanceHistory],
      patternEffectiveness: Array.from(this.patternEffectiveness.values()),
      alerts: [...this.alerts],
      learningEvents: [...this.learningEvents]
    };
  }
}

// ==================== Export ====================

export default SecurityMonitoringEngine;