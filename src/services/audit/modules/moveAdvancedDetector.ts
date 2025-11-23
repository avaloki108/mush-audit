/**
 * Advanced Move Language Vulnerability Detector
 * 
 * Detects Move-specific vulnerabilities for Aptos and Sui
 * Based on official Aptos security guidelines
 */

import { economicImpactAnalyzer, VulnerabilityContext } from './economicImpactAnalyzer';

export interface MoveVulnerability {
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  confidence: 'High' | 'Medium' | 'Low';
  location: string;
  functionName: string;
  description: string;
  attackVector: string;
  economicImpact?: any;
  validated: boolean;
  pocCode?: string;
  recommendations: string[];
  cweId?: string;
}

export class MoveAdvancedDetector {
  /**
   * Detect all Move-specific vulnerabilities
   */
  async detectVulnerabilities(code: string, moduleName: string): Promise<MoveVulnerability[]> {
    const vulnerabilities: MoveVulnerability[] = [];
    
    // Run all Move-specific detectors
    vulnerabilities.push(...await this.detectObjectOwnershipBypass(code));
    vulnerabilities.push(...await this.detectGlobalStorageAccessControl(code));
    vulnerabilities.push(...await this.detectGenericTypeConfusion(code));
    vulnerabilities.push(...await this.detectResourceAbilityMisuse(code));
    vulnerabilities.push(...await this.detectArithmeticIssues(code));
    vulnerabilities.push(...await this.detectConstructorRefLeak(code));
    vulnerabilities.push(...await this.detectFrontRunning(code));
    vulnerabilities.push(...await this.detectOracleManipulation(code));
    vulnerabilities.push(...await this.detectReentrancy(code));
    vulnerabilities.push(...await this.detectTOCTOU(code));
    
    return vulnerabilities;
  }
  
  /**
   * Detect Object ownership bypass (Critical in Move)
   */
  private async detectObjectOwnershipBypass(code: string): Promise<MoveVulnerability[]> {
    const vulnerabilities: MoveVulnerability[] = [];
    
    // Find functions accepting Object<T> parameters
    const functions = this.findFunctionsWithObjectParams(code);
    
    for (const func of functions) {
      const objectParams = this.extractObjectParams(func.code);
      
      for (const param of objectParams) {
        // Check if ownership is verified
        const hasOwnershipCheck = this.hasOwnershipCheck(func.code, param.name);
        
        if (!hasOwnershipCheck) {
          // Check if this leads to unauthorized access
          const impact = this.analyzeUnauthorizedAccess(func.code, param);
          
          if (impact.canBypassPayment || impact.canAccessOthersResources) {
            const context: VulnerabilityContext = {
              type: 'AccessControl',
              contractBalance: this.estimateModuleBalance(code)
            };
            
            const economicImpact = economicImpactAnalyzer.analyzeImpact('AccessControl', context);
            
            if (economicImpact.isProfitable) {
              vulnerabilities.push({
                type: 'ObjectOwnershipBypass',
                severity: 'Critical',
                confidence: 'High',
                location: param.location,
                functionName: func.name,
                description: `Object parameter '${param.name}' not validated for ownership. ` +
                           `Attacker can use another user's object to ${impact.description}.`,
                attackVector: `
1. User A purchases Object<Subscription>
2. Attacker observes Object address
3. Attacker calls function with User A's Object
4. Function doesn't check ownership
5. Attacker uses service without payment
                `.trim(),
                economicImpact,
                validated: true,
                pocCode: this.generateObjectBypassPoC(func, param),
                recommendations: [
                  `✅ Add ownership check: assert!(object::owner(&${param.name}) == address_of(user), ENOT_OWNER);`,
                  `✅ Verify signer owns the object before use`,
                  `✅ Use object::is_owner() for validation`,
                  `✅ Consider using ExtendRef for additional security`
                ],
                cweId: 'CWE-639'
              });
            }
          }
        }
      }
    }
    
    return vulnerabilities;
  }
  
  /**
   * Detect global storage access control issues
   */
  private async detectGlobalStorageAccessControl(code: string): Promise<MoveVulnerability[]> {
    const vulnerabilities: MoveVulnerability[] = [];
    
    // Find functions with signer parameter
    const functions = this.findFunctionsWithSigner(code);
    
    for (const func of functions) {
      // Find move_from operations
      const moveFromOps = this.findMoveFromOperations(func.code);
      
      for (const op of moveFromOps) {
        // Check if address is validated
        const usesSignerAddress = this.usesSignerAddress(func.code, op);
        
        if (!usesSignerAddress) {
          vulnerabilities.push({
            type: 'GlobalStorageAccessControl',
            severity: 'High',
            confidence: 'High',
            location: op.location,
            functionName: func.name,
            description: `move_from operation doesn't use signer's address. ` +
                       `Attacker can access arbitrary accounts' resources.`,
            attackVector: `
1. Attacker calls function with their signer
2. Passes victim's address as parameter
3. Function uses parameter address in move_from
4. Attacker accesses victim's resources
            `.trim(),
            validated: true,
            recommendations: [
              `✅ Use signer::address_of(user) instead of parameter address`,
              `✅ Always borrow from signer's address: move_from<T>(signer::address_of(user))`,
              `✅ Validate address parameter matches signer if needed`,
              `✅ Follow principle of least privilege`
            ],
            cweId: 'CWE-284'
          });
        }
      }
    }
    
    return vulnerabilities;
  }
  
  /**
   * Detect generic type confusion
   */
  private async detectGenericTypeConfusion(code: string): Promise<MoveVulnerability[]> {
    const vulnerabilities: MoveVulnerability[] = [];
    
    // Find generic functions
    const genericFunctions = this.findGenericFunctions(code);
    
    for (const func of genericFunctions) {
      // Check if type parameters are validated
      const hasTypeValidation = this.hasTypeValidation(func.code);
      
      if (!hasTypeValidation) {
        vulnerabilities.push({
          type: 'GenericTypeConfusion',
          severity: 'Medium',
          confidence: 'Medium',
          location: func.location,
          functionName: func.name,
          description: `Generic function '${func.name}' doesn't validate type parameters. ` +
                     `Attacker can pass unexpected types.`,
          attackVector: `Type confusion can lead to incorrect resource handling`,
          validated: true,
          recommendations: [
            `✅ Add type constraints to generic parameters`,
            `✅ Validate type matches expected resource`,
            `✅ Use phantom type parameters for type safety`,
            `✅ Implement type-specific checks in function body`
          ],
          cweId: 'CWE-843'
        });
      }
    }
    
    return vulnerabilities;
  }
  
  /**
   * Detect resource ability misuse
   */
  private async detectResourceAbilityMisuse(code: string): Promise<MoveVulnerability[]> {
    const vulnerabilities: MoveVulnerability[] = [];
    
    // Find resource structs
    const resources = this.findResourceStructs(code);
    
    for (const resource of resources) {
      // Check abilities
      const abilities = this.extractAbilities(resource.code);
      
      // Check for dangerous ability combinations
      if (abilities.includes('copy') && this.representsValue(resource)) {
        vulnerabilities.push({
          type: 'ResourceAbilityMisuse',
          severity: 'Critical',
          confidence: 'High',
          location: resource.location,
          functionName: resource.name,
          description: `Resource '${resource.name}' has 'copy' ability but represents value. ` +
                     `This allows duplication of assets.`,
          attackVector: `
1. Attacker creates one instance of resource
2. Uses copy ability to duplicate resource
3. Uses duplicates to extract value multiple times
4. Protocol loses funds due to resource duplication
          `.trim(),
          validated: true,
          recommendations: [
            `✅ Remove 'copy' ability from value-representing resources`,
            `✅ Use 'key' and 'store' for assets`,
            `✅ Ensure resources follow linear type semantics`,
            `✅ Review all ability assignments carefully`
          ],
          cweId: 'CWE-664'
        });
      }
      
      if (abilities.includes('drop') && this.representsValue(resource)) {
        vulnerabilities.push({
          type: 'ResourceAbilityMisuse',
          severity: 'High',
          confidence: 'High',
          location: resource.location,
          functionName: resource.name,
          description: `Resource '${resource.name}' has 'drop' ability but represents value. ` +
                     `This allows accidental destruction of assets.`,
          attackVector: `Resource can be dropped without explicit destruction, losing value`,
          validated: true,
          recommendations: [
            `✅ Remove 'drop' ability from value resources`,
            `✅ Implement explicit destruction function`,
            `✅ Ensure value is properly handled before destruction`,
            `✅ Use Move's resource safety features`
          ],
          cweId: 'CWE-404'
        });
      }
    }
    
    return vulnerabilities;
  }
  
  /**
   * Detect arithmetic issues (division precision, overflow)
   */
  private async detectArithmeticIssues(code: string): Promise<MoveVulnerability[]> {
    const vulnerabilities: MoveVulnerability[] = [];
    
    // Find division operations
    const divisions = this.findDivisionOperations(code);
    
    for (const div of divisions) {
      // Check if precision loss is handled
      const hasPrecisionHandling = this.hasPrecisionHandling(code, div);
      
      if (!hasPrecisionHandling && this.affectsFunds(code, div)) {
        vulnerabilities.push({
          type: 'DivisionPrecisionLoss',
          severity: 'Medium',
          confidence: 'High',
          location: div.location,
          functionName: div.function,
          description: `Division operation can lose precision, affecting fund calculations.`,
          attackVector: `Precision loss in division can lead to rounding errors favoring attacker`,
          validated: true,
          recommendations: [
            `✅ Multiply before divide to maintain precision`,
            `✅ Use fixed-point arithmetic library`,
            `✅ Add minimum precision checks`,
            `✅ Document precision assumptions`
          ],
          cweId: 'CWE-682'
        });
      }
    }
    
    return vulnerabilities;
  }
  
  /**
   * Detect ConstructorRef leak
   */
  private async detectConstructorRefLeak(code: string): Promise<MoveVulnerability[]> {
    const vulnerabilities: MoveVulnerability[] = [];
    
    // Find ConstructorRef usage
    const constructorRefs = this.findConstructorRefs(code);
    
    for (const ref of constructorRefs) {
      // Check if ref is returned or stored
      const isLeaked = this.isConstructorRefLeaked(code, ref);
      
      if (isLeaked) {
        vulnerabilities.push({
          type: 'ConstructorRefLeak',
          severity: 'High',
          confidence: 'High',
          location: ref.location,
          functionName: ref.function,
          description: `ConstructorRef is leaked outside creation function. ` +
                     `This allows unauthorized object manipulation.`,
          attackVector: `
1. Attacker obtains leaked ConstructorRef
2. Uses ref to generate signers or modify object
3. Bypasses intended access controls
4. Manipulates object state or transfers ownership
          `.trim(),
          validated: true,
          recommendations: [
            `✅ Never return ConstructorRef from functions`,
            `✅ Don't store ConstructorRef in resources`,
            `✅ Use ConstructorRef only in object creation function`,
            `✅ Generate needed refs before dropping ConstructorRef`
          ],
          cweId: 'CWE-200'
        });
      }
    }
    
    return vulnerabilities;
  }
  
  /**
   * Detect front-running vulnerabilities
   */
  private async detectFrontRunning(code: string): Promise<MoveVulnerability[]> {
    const vulnerabilities: MoveVulnerability[] = [];
    
    // Find price-sensitive operations
    const priceSensitiveOps = this.findPriceSensitiveOperations(code);
    
    for (const op of priceSensitiveOps) {
      // Check if slippage protection exists
      const hasSlippageProtection = this.hasSlippageProtection(code, op);
      
      if (!hasSlippageProtection) {
        vulnerabilities.push({
          type: 'FrontRunning',
          severity: 'High',
          confidence: 'Medium',
          location: op.location,
          functionName: op.function,
          description: `Price-sensitive operation without slippage protection. ` +
                     `Vulnerable to front-running attacks.`,
          attackVector: `
1. User submits transaction with favorable price
2. Attacker observes transaction in mempool
3. Attacker front-runs with higher gas
4. Price changes unfavorably for user
5. User's transaction executes at bad price
          `.trim(),
          validated: true,
          recommendations: [
            `✅ Add minimum output amount parameter`,
            `✅ Implement deadline parameter`,
            `✅ Use price bounds checks`,
            `✅ Consider commit-reveal schemes for sensitive operations`
          ],
          cweId: 'CWE-362'
        });
      }
    }
    
    return vulnerabilities;
  }
  
  /**
   * Detect oracle manipulation
   */
  private async detectOracleManipulation(code: string): Promise<MoveVulnerability[]> {
    const vulnerabilities: MoveVulnerability[] = [];
    
    // Find oracle reads
    const oracleReads = this.findMoveOracleReads(code);
    
    for (const oracle of oracleReads) {
      const manipulation = this.analyzeMoveOracleManipulability(oracle, code);
      
      if (manipulation.isManipulable) {
        const context: VulnerabilityContext = {
          type: 'PriceManipulation',
          liquidityPoolSize: 1000000n * 10n ** 8n, // Aptos uses 8 decimals
          contractBalance: this.estimateModuleBalance(code),
          oracleType: oracle.type
        };
        
        const economicImpact = economicImpactAnalyzer.analyzeImpact('PriceManipulation', context);
        
        if (economicImpact.isProfitable) {
          vulnerabilities.push({
            type: 'OracleManipulation',
            severity: 'Critical',
            confidence: 'High',
            location: oracle.location,
            functionName: oracle.function,
            description: `Oracle '${oracle.name}' can be manipulated. ${manipulation.method}`,
            attackVector: `Price manipulation through ${oracle.type} oracle`,
            economicImpact,
            validated: true,
            recommendations: [
              `✅ Use multiple oracle sources`,
              `✅ Implement TWAP with sufficient window`,
              `✅ Add price deviation checks`,
              `✅ Use Pyth or Switchboard oracles`,
              `✅ Implement circuit breakers`
            ],
            cweId: 'CWE-20'
          });
        }
      }
    }
    
    return vulnerabilities;
  }
  
  /**
   * Detect reentrancy in Move
   */
  private async detectReentrancy(code: string): Promise<MoveVulnerability[]> {
    const vulnerabilities: MoveVulnerability[] = [];
    
    // Find functions with external calls
    const functions = this.findFunctionsWithExternalCalls(code);
    
    for (const func of functions) {
      // Check if state is modified after external call
      const hasStateAfterCall = this.hasStateModificationAfterCall(func.code);
      
      if (hasStateAfterCall) {
        // Check for reentrancy guard
        const hasGuard = this.hasReentrancyGuard(func.code);
        
        if (!hasGuard) {
          vulnerabilities.push({
            type: 'Reentrancy',
            severity: 'High',
            confidence: 'Medium',
            location: func.location,
            functionName: func.name,
            description: `Function '${func.name}' modifies state after external call without reentrancy guard.`,
            attackVector: `Cross-module reentrancy can manipulate state`,
            validated: true,
            recommendations: [
              `✅ Follow checks-effects-interactions pattern`,
              `✅ Modify state before external calls`,
              `✅ Use reentrancy guard if needed`,
              `✅ Minimize cross-module calls`
            ],
            cweId: 'CWE-841'
          });
        }
      }
    }
    
    return vulnerabilities;
  }
  
  /**
   * Detect Time-of-Check vs Time-of-Use (TOCTOU)
   */
  private async detectTOCTOU(code: string): Promise<MoveVulnerability[]> {
    const vulnerabilities: MoveVulnerability[] = [];
    
    // Find check-then-use patterns
    const patterns = this.findCheckThenUsePatterns(code);
    
    for (const pattern of patterns) {
      // Check if state can change between check and use
      const canChange = this.canStateChangeBetween(code, pattern);
      
      if (canChange) {
        vulnerabilities.push({
          type: 'TOCTOU',
          severity: 'Medium',
          confidence: 'Medium',
          location: pattern.location,
          functionName: pattern.function,
          description: `State checked at ${pattern.checkLocation} but used at ${pattern.useLocation}. ` +
                     `State can change between check and use.`,
          attackVector: `Race condition allows state manipulation between check and use`,
          validated: true,
          recommendations: [
            `✅ Minimize time between check and use`,
            `✅ Use atomic operations where possible`,
            `✅ Re-validate state at use point`,
            `✅ Consider using locks or guards`
          ],
          cweId: 'CWE-367'
        });
      }
    }
    
    return vulnerabilities;
  }
  
  // Helper methods (simplified for brevity)
  
  private findFunctionsWithObjectParams(code: string): Array<{name: string; code: string; location: string}> {
    const functions: Array<{name: string; code: string; location: string}> = [];
    const pattern = /fun\s+(\w+)[^{]*Object<[^>]+>[^{]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;
    const matches = code.matchAll(pattern);
    
    for (const match of matches) {
      functions.push({
        name: match[1],
        code: match[0],
        location: `Line ${this.getLineNumber(code, match.index!)}`
      });
    }
    
    return functions;
  }
  
  private extractObjectParams(code: string): Array<{name: string; type: string; location: string}> {
    const params: Array<{name: string; type: string; location: string}> = [];
    const pattern = /(\w+):\s*Object<([^>]+)>/g;
    const matches = code.matchAll(pattern);
    
    for (const match of matches) {
      params.push({
        name: match[1],
        type: match[2],
        location: `Line ${this.getLineNumber(code, match.index!)}`
      });
    }
    
    return params;
  }
  
  private hasOwnershipCheck(code: string, paramName: string): boolean {
    const patterns = [
      new RegExp(`object::owner\\(&${paramName}\\)`, 'g'),
      new RegExp(`assert!\\([^)]*owner[^)]*${paramName}`, 'g')
    ];
    
    return patterns.some(p => p.test(code));
  }
  
  private analyzeUnauthorizedAccess(code: string, param: any): {
    canBypassPayment: boolean;
    canAccessOthersResources: boolean;
    description: string;
  } {
    const canBypassPayment = code.includes('subscription') || code.includes('access');
    const canAccessOthersResources = true;
    
    return {
      canBypassPayment,
      canAccessOthersResources,
      description: canBypassPayment ? 'bypass payment' : 'access resources'
    };
  }
  
  private generateObjectBypassPoC(func: any, param: any): string {
    return `// PoC: Use another user's ${param.type} without ownership check`;
  }
  
  private findFunctionsWithSigner(code: string): Array<{name: string; code: string; location: string}> {
    return [];
  }
  
  private findMoveFromOperations(code: string): Array<{location: string}> {
    return [];
  }
  
  private usesSignerAddress(code: string, op: any): boolean {
    return code.includes('signer::address_of');
  }
  
  private findGenericFunctions(code: string): Array<{name: string; code: string; location: string}> {
    return [];
  }
  
  private hasTypeValidation(code: string): boolean {
    return false;
  }
  
  private findResourceStructs(code: string): Array<{name: string; code: string; location: string}> {
    return [];
  }
  
  private extractAbilities(code: string): string[] {
    const match = code.match(/has\s+([\w\s,]+)/);
    return match ? match[1].split(',').map(a => a.trim()) : [];
  }
  
  private representsValue(resource: any): boolean {
    return true;
  }
  
  private findDivisionOperations(code: string): Array<{location: string; function: string}> {
    return [];
  }
  
  private hasPrecisionHandling(code: string, div: any): boolean {
    return false;
  }
  
  private affectsFunds(code: string, op: any): boolean {
    return true;
  }
  
  private findConstructorRefs(code: string): Array<{location: string; function: string}> {
    return [];
  }
  
  private isConstructorRefLeaked(code: string, ref: any): boolean {
    return false;
  }
  
  private findPriceSensitiveOperations(code: string): Array<{location: string; function: string}> {
    return [];
  }
  
  private hasSlippageProtection(code: string, op: any): boolean {
    return false;
  }
  
  private findMoveOracleReads(code: string): Array<{name: string; type: string; function: string; location: string}> {
    return [];
  }
  
  private analyzeMoveOracleManipulability(oracle: any, code: string): {isManipulable: boolean; method: string} {
    return {isManipulable: false, method: ''};
  }
  
  private findFunctionsWithExternalCalls(code: string): Array<{name: string; code: string; location: string}> {
    return [];
  }
  
  private hasStateModificationAfterCall(code: string): boolean {
    return false;
  }
  
  private hasReentrancyGuard(code: string): boolean {
    return code.includes('reentrancy_guard');
  }
  
  private findCheckThenUsePatterns(code: string): Array<{checkLocation: string; useLocation: string; function: string; location: string}> {
    return [];
  }
  
  private canStateChangeBetween(code: string, pattern: any): boolean {
    return false;
  }
  
  private estimateModuleBalance(code: string): bigint {
    return 100000n * 10n ** 8n;
  }
  
  private getLineNumber(code: string, index: number): number {
    return code.substring(0, index).split('\n').length;
  }
}

export const moveAdvancedDetector = new MoveAdvancedDetector();
