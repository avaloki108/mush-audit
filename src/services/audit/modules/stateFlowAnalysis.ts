import type { ContractFile } from "@/types/blockchain";

export interface StateFlowResult {
  criticalPaths: CriticalPath[];
  potentialIssues: StateFlowIssue[];
  recommendations: string[];
  taintAnalysis: TaintReport[];
}

export interface CriticalPath {
  functionName: string;
  risk: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  steps: string[];
}

export interface StateFlowIssue {
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  contract: string;
  function: string;
  description: string;
  recommendation: string;
}

export interface TaintReport {
  source: string; // User Input
  sink: string;   // Sensitive Operation
  risk: string;
}

export class StateFlowAnalyzer {
  private contracts: ContractFile[];

  constructor(contracts: ContractFile[]) {
    this.contracts = contracts;
  }

  analyzeStateFlow(): StateFlowResult {
    const result: StateFlowResult = {
      criticalPaths: [],
      potentialIssues: [],
      recommendations: [],
      taintAnalysis: []
    };

    this.contracts.forEach(contract => {
      // 1. Analyze "Money Flow" (Functions dealing with Value)
      const moneyPaths = this.analyzeMoneyFlow(contract);
      result.criticalPaths.push(...moneyPaths);

      // 2. Taint Analysis (Input -> State/Call)
      const taints = this.performTaintAnalysis(contract);
      result.taintAnalysis.push(...taints);

      // 3. Check specific state hazards
      const hazards = this.detectStateHazards(contract);
      result.potentialIssues.push(...hazards);
    });

    return result;
  }

  /**
   * Identifies critical paths where money is moved.
   * It checks if these paths are guarded by Access Control.
   */
  private analyzeMoneyFlow(contract: ContractFile): CriticalPath[] {
    const paths: CriticalPath[] = [];
    const content = contract.content;

    // Find functions with 'payable' or transfer logic
    const transferRegex = /function\s+(\w+)[^{]+{([\s\S]+?)}/g;
    let match;

    while ((match = transferRegex.exec(content)) !== null) {
      const funcName = match[1];
      const body = match[2];

      const movesFunds = /\.transfer|\.send|safeTransfer|mint|burn/.test(body);
      const isProtected = /onlyOwner|auth|require\(msg\.sender/.test(body) || /onlyOwner|auth/.test(match[0]); // Check modifiers in sig

      if (movesFunds) {
        const risk = isProtected ? 'Medium' : 'Critical';
        paths.push({
          functionName: `${contract.name}.${funcName}`,
          risk: risk,
          description: isProtected 
            ? 'Protected fund movement function.' 
            : 'UNPROTECTED fund movement detected! Anyone can potentially trigger this.',
          steps: [`Function: ${funcName}`, `Contains fund transfer logic`, `Access Control: ${isProtected ? 'Yes' : 'NO'}`]
        });
      }
    }
    return paths;
  }

  /**
   * Traces user inputs (arguments) to sensitive sinks (SSTORE, CALL, DELEGATECALL).
   */
  private performTaintAnalysis(contract: ContractFile): TaintReport[] {
    const reports: TaintReport[] = [];
    
    // Simplistic Taint Tracking via Regex
    // 1. Find function arguments
    const funcArgRegex = /function\s+(\w+)\s*\(([^)]+)\)/g;
    let match;

    while ((match = funcArgRegex.exec(contract.content)) !== null) {
      const funcName = match[1];
      const args = match[2].split(',').map(a => a.trim().split(' ').pop()); // Get arg names

      // 2. Check if any arg is used in a "Sink"
      const bodyStart = match.index + match[0].length;
      const bodyEnd = contract.content.indexOf('}', bodyStart); // Rough body finder
      const body = contract.content.slice(bodyStart, bodyEnd);

      args.forEach(arg => {
        if (!arg) return;
        
        // Sink: State Update (SSTORE)
        if (new RegExp(`${arg}\\s*=[^=]`).test(body) || new RegExp(`\\w+\\[${arg}\\]\\s*=`).test(body)) {
           // Only a risk if NOT checked
           if (!body.includes(`require`)) {
             reports.push({
               source: `Arg '${arg}' in ${funcName}`,
               sink: 'State Update',
               risk: 'User input controls state without obvious validation.'
             });
           }
        }

        // Sink: External Call
        if (new RegExp(`\\.call\\(.*${arg}`).test(body)) {
            reports.push({
               source: `Arg '${arg}' in ${funcName}`,
               sink: 'External Call',
               risk: 'High - Arbitrary External Call Injection'
             });
        }
      });
    }

    return reports;
  }

  private detectStateHazards(contract: ContractFile): StateFlowIssue[] {
    const issues: StateFlowIssue[] = [];
    
    // 1. Unchecked Return Values
    if (/\.call\s*\(/.test(contract.content) && !/require\(.*success/.test(contract.content)) {
       issues.push({
         type: 'Unchecked Low-Level Call',
         severity: 'Medium',
         contract: contract.name,
         function: 'Unknown',
         description: 'Low-level .call() used without checking return value boolean.',
         recommendation: 'Always wrap low-level calls in require(success, "Call failed");'
       });
    }

    // 2. Loop over unbounded array (DoS Risk)
    if (/for\s*\(.*\.length/.test(contract.content) && !/break|return/.test(contract.content)) {
       issues.push({
         type: 'Unbounded Loop (DoS)',
         severity: 'Low',
         contract: contract.name,
         function: 'Unknown',
         description: 'Loop iterates over array length. If array grows too large, transaction runs out of gas.',
         recommendation: 'Avoid looping over unbounded arrays. Use pull-payment patterns.'
       });
    }

    return issues;
  }
}
