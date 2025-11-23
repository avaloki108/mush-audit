export interface StorageSlot {
  name: string;
  type: string;
  slot: number;
  offset: number;
  size: number;
}

export interface StorageLayout {
  slots: StorageSlot[];
  totalSlots: number;
}

export interface ProxyCollisionFinding {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  location: string;
  recommendation: string;
  collisionDetails: {
    slot: number;
    implementationA: StorageSlot;
    implementationB: StorageSlot;
    risk: string;
  };
}

export interface ProxyAnalyzer {
  analyzeStorageLayout(code: string): StorageLayout;
  detectStorageCollisions(implementationA: string, implementationB: string): ProxyCollisionFinding[];
  analyzeUpgradeSafety(currentImpl: string, newImpl: string): {
    safe: boolean;
    issues: ProxyCollisionFinding[];
    recommendations: string[];
  };
  detectProxyPatterns(code: string): {
    proxyType: string;
    implementation: string;
    admin: string;
    upgradeable: boolean;
  };
}

export class ProxyAnalyzerImpl implements ProxyAnalyzer {

  analyzeStorageLayout(code: string): StorageLayout {
    const slots: StorageSlot[] = [];
    let currentSlot = 0;

    // Extract state variables from Solidity code
    const stateVarRegex = /(?:^\s*|;\s*)(private|internal|public)?\s*(constant|immutable)?\s*(\w+)\s+(\w+)(?:\s*=\s*[^;]+)?;/gm;
    let match;

    while ((match = stateVarRegex.exec(code)) !== null) {
      const visibility = match[1] || 'private';
      const mutability = match[2];
      const type = match[3];
      const name = match[4];

      // Skip constants and immutables (they don't use storage slots)
      if (mutability === 'constant' || mutability === 'immutable') continue;

      // Calculate slot size based on type
      const size = this.getTypeSize(type);
      const offset = 0; // Simplified - actual offset calculation is complex

      slots.push({
        name,
        type,
        slot: currentSlot,
        offset,
        size
      });

      // Move to next slot (simplified - actual slot allocation is more complex)
      currentSlot += Math.ceil(size / 32);
    }

    return {
      slots,
      totalSlots: currentSlot
    };
  }

  private getTypeSize(type: string): number {
    // Simplified type size calculation
    if (type.includes('uint') || type.includes('int')) {
      const bits = type.match(/(\d+)/)?.[1];
      return bits ? parseInt(bits) / 8 : 32;
    }
    if (type.includes('address')) return 20;
    if (type.includes('bool')) return 1;
    if (type.includes('bytes')) {
      const size = type.match(/bytes(\d+)/)?.[1];
      return size ? parseInt(size) : 32; // Dynamic bytes use 32 bytes for length
    }
    if (type.includes('string')) return 32; // Dynamic string uses 32 bytes for length
    if (type.includes('mapping') || type.includes('[]')) return 32; // Mappings and arrays use 32 bytes for hash/length

    // Structs and other complex types - simplified
    return 32;
  }

  detectStorageCollisions(implementationA: string, implementationB: string): ProxyCollisionFinding[] {
    const layoutA = this.analyzeStorageLayout(implementationA);
    const layoutB = this.analyzeStorageLayout(implementationB);

    const findings: ProxyCollisionFinding[] = [];

    // Compare storage layouts
    const maxSlots = Math.max(layoutA.totalSlots, layoutB.totalSlots);

    for (let slot = 0; slot < maxSlots; slot++) {
      const slotA = layoutA.slots.find(s => s.slot === slot);
      const slotB = layoutB.slots.find(s => s.slot === slot);

      if (slotA && slotB) {
        // Both implementations use this slot
        if (slotA.type !== slotB.type || slotA.size !== slotB.size) {
          // Type or size mismatch - potential collision
          const risk = this.assessCollisionRisk(slotA, slotB);

          findings.push({
            title: 'Storage Slot Collision Detected',
            severity: risk === 'Critical' ? 'Critical' : 'High',
            description: `Storage slot ${slot} collision between implementations. ${slotA.name} (${slotA.type}) vs ${slotB.name} (${slotB.type})`,
            location: `Storage slot ${slot} in upgradeable contract`,
            recommendation: 'Use structured storage patterns or ensure identical storage layouts',
            collisionDetails: {
              slot,
              implementationA: slotA,
              implementationB: slotB,
              risk
            }
          });
        }
      }
    }

    return findings;
  }

  private assessCollisionRisk(slotA: StorageSlot, slotB: StorageSlot): string {
    // Assess risk based on type compatibility
    if (slotA.type.includes('uint') && slotB.type.includes('uint')) {
      const bitsA = parseInt(slotA.type.match(/(\d+)/)?.[1] || '256');
      const bitsB = parseInt(slotB.type.match(/(\d+)/)?.[1] || '256');
      if (bitsA === bitsB) return 'Low'; // Same size uints are compatible
    }

    if (slotA.type === 'address' && slotB.type === 'address') return 'Low';
    if (slotA.type === 'bool' && slotB.type === 'bool') return 'Low';

    // Different types or incompatible sizes
    return 'Critical';
  }

  analyzeUpgradeSafety(currentImpl: string, newImpl: string): {
    safe: boolean;
    issues: ProxyCollisionFinding[];
    recommendations: string[];
  } {
    const issues = this.detectStorageCollisions(currentImpl, newImpl);
    const safe = issues.length === 0;

    const recommendations: string[] = [];

    if (!safe) {
      recommendations.push('Implement storage gap pattern (__gap variables)');
      recommendations.push('Use structured storage inheritance');
      recommendations.push('Test upgrades thoroughly before deployment');
      recommendations.push('Consider using OpenZeppelin upgradeable contracts');
    }

    return {
      safe,
      issues,
      recommendations
    };
  }

  detectProxyPatterns(code: string): {
    proxyType: string;
    implementation: string;
    admin: string;
    upgradeable: boolean;
  } {
    let proxyType = 'Unknown';
    let implementation = '';
    let admin = '';
    let upgradeable = false;

    // Detect Transparent Proxy pattern
    if (code.includes('TransparentUpgradeableProxy') || 
        (code.includes('fallback()') && code.includes('upgradeTo'))) {
      proxyType = 'Transparent Proxy';
      upgradeable = true;
    }

    // Detect UUPS Proxy pattern
    if (code.includes('UUPSUpgradeable') || 
        code.includes('upgradeToAndCall')) {
      proxyType = 'UUPS Proxy';
      upgradeable = true;
    }

    // Detect Beacon Proxy pattern
    if (code.includes('BeaconProxy') || code.includes('UpgradeableBeacon')) {
      proxyType = 'Beacon Proxy';
      upgradeable = true;
    }

    // Extract implementation address
    const implRegex = /implementation\s*=\s*([^;\s]+)/;
    const implMatch = code.match(implRegex);
    if (implMatch) {
      implementation = implMatch[1];
    }

    // Extract admin address
    const adminRegex = /admin\s*=\s*([^;\s]+)/;
    const adminMatch = code.match(adminRegex);
    if (adminMatch) {
      admin = adminMatch[1];
    }

    return {
      proxyType,
      implementation,
      admin,
      upgradeable
    };
  }
}

// Advanced storage collision detection
export class AdvancedStorageAnalyzer {

  static detectGapUsage(code: string): {
    hasGaps: boolean;
    gapSlots: number;
    recommendations: string[];
  } {
    const gapRegex = /uint256\[\d+\]\s+(?:private\s+)?__gap/;
    const gaps = code.match(gapRegex);

    let totalGapSlots = 0;
    if (gaps) {
      // Extract total gap size
      const sizeMatch = gaps[0].match(/uint256\[(\d+)\]/);
      if (sizeMatch) {
        totalGapSlots = parseInt(sizeMatch[1]);
      }
    }

    const recommendations: string[] = [];
    if (!gaps) {
      recommendations.push('Add __gap variables for future storage expansion');
      recommendations.push('Reserve at least 50 slots for upgrade safety');
    } else if (totalGapSlots < 50) {
      recommendations.push('Increase __gap size to at least 50 slots');
    }

    return {
      hasGaps: !!gaps,
      gapSlots: totalGapSlots,
      recommendations
    };
  }

  static analyzeInheritanceSafety(code: string): {
    safe: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for multiple inheritance with storage variables
    const contractRegex = /contract\s+(\w+)\s+is\s+([^}]+){/g;
    let match;

    while ((match = contractRegex.exec(code)) !== null) {
      const parents = match[2].split(',').map(p => p.trim());
      if (parents.length > 1) {
        // Check if parents have storage variables
        for (const parent of parents) {
          if (code.includes(`contract ${parent}`)) {
            const parentCode = this.extractContractCode(code, parent);
            if (this.hasStorageVariables(parentCode)) {
              issues.push(`Multiple inheritance with storage variables in ${parent}`);
            }
          }
        }
      }
    }

    const safe = issues.length === 0;

    if (!safe) {
      recommendations.push('Use linear inheritance for upgradeable contracts');
      recommendations.push('Move storage variables to most derived contract');
      recommendations.push('Use composition over multiple inheritance');
    }

    return {
      safe,
      issues,
      recommendations
    };
  }

  private static extractContractCode(fullCode: string, contractName: string): string {
    const contractRegex = new RegExp(`contract\\s+${contractName}\\s+[^}]+{([^{}]|{[^{}]*})*}`, 's');
    const match = fullCode.match(contractRegex);
    return match ? match[0] : '';
  }

  private static hasStorageVariables(contractCode: string): boolean {
    const storageVarRegex = /(?:^\s*|;\s*)(private|internal|public)?\s*(?!constant|immutable)(\w+)\s+(\w+)(?:\s*=\s*[^;]+)?;/gm;
    return storageVarRegex.test(contractCode);
  }

  static detectInitializerPatterns(code: string): {
    hasInitializers: boolean;
    properInitialization: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for initializer modifier usage
    const initializerRegex = /initializer\s+modifier/;
    const hasInitializerModifier = initializerRegex.test(code);

    // Check for proper initialization calls
    const initCallRegex = /\w+\.initialize\(/g;
    const hasInitCalls = initCallRegex.test(code);

    // Check for constructor usage in upgradeable contracts
    const constructorRegex = /constructor\s*\(/;
    const hasConstructor = constructorRegex.test(code);

    if (hasConstructor && (hasInitializerModifier || hasInitCalls)) {
      issues.push('Constructor used in upgradeable contract - may cause initialization issues');
    }

    if (!hasInitializerModifier && hasInitCalls) {
      issues.push('Initialize functions called without initializer modifier protection');
    }

    return {
      hasInitializers: hasInitializerModifier || hasInitCalls,
      properInitialization: issues.length === 0,
      issues
    };
  }
}

export const proxyAnalyzer = new ProxyAnalyzerImpl();
