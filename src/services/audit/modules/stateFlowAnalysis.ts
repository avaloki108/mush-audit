import type { ContractFile } from "@/types/blockchain";

export interface ContractState {
  contractAddress: string;
  contractName: string;
  stateVariables: StateVariable[];
  transitions: StateTransition[];
  functions: FunctionInfo[];
}

export interface StateVariable {
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'internal';
  isConstant: boolean;
  isImmutable: boolean;
  slot?: number;
}

export interface StateTransition {
  functionName: string;
  visibility: 'public' | 'external' | 'internal' | 'private';
  modifiers: string[];
  stateChanges: StateChange[];
  externalCalls: ExternalCall[];
  emittedEvents: string[];
  requireChecks: string[];
}

export interface StateChange {
  variable: string;
  operation: 'set' | 'increment' | 'decrement' | 'delete' | 'push' | 'pop';
  context: string;
}

export interface ExternalCall {
  target: string;
  targetType?: string; // Variable type (e.g., IERC20, IUniswapV2Router)
  function: string;
  position: 'before' | 'after' | 'during';
  type: 'call' | 'delegatecall' | 'staticcall' | 'transfer' | 'send';
}

export interface FunctionInfo {
  name: string;
  visibility: 'public' | 'external' | 'internal' | 'private';
  stateMutability?: 'view' | 'pure' | 'payable' | 'nonpayable';
  modifiers: string[];
  hasExternalCalls: boolean;
  modifiesState: boolean;
}

export interface StateFlowResult {
  criticalPaths: CriticalPath[];
  potentialIssues: StateFlowIssue[];
  stateInvariants: StateInvariant[];
  crossContractFlows: CrossContractFlow[]; // New field for cross-contract analysis
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
  dataFlow?: string;
  affectedContracts?: string[]; // For cross-contract issues
}

export interface CrossContractFlow {
  sourceContract: string;
  sourceFunction: string;
  targetContract: string;
  targetFunction: string;
  stateChanges: {
    beforeCall: StateChange[];
    inTarget: StateChange[];
    afterCall: StateChange[];
  };
  reentrancyRisk: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface TaintReport {
  source: string; // User Input
  sink: string;   // Sensitive Operation
  risk: string;
}

export interface StateInvariant {
  description: string;
  condition: string;
  violated: boolean;
  affectedContracts: string[];
}

export class StateFlowAnalyzer {
  private contracts: ContractFile[];
  private contractStates: ContractState[];
  private variableTypes: Map<string, string>; // Maps variable names to their types

  constructor(contracts: ContractFile[]) {
    this.contracts = contracts;
    this.variableTypes = new Map();
    this.contractStates = contracts.map(contract => this.parseContractState(contract));
  }

  analyzeStateFlow(): StateFlowResult {
    const result: StateFlowResult = {
      criticalPaths: [],
      potentialIssues: [],
      stateInvariants: [],
      crossContractFlows: [], // Initialize new field
      recommendations: [],
      taintAnalysis: []
    };

    // Analyze each contract state for vulnerabilities
    this.contractStates.forEach(contractState => {
      const analysis = this.analyzeTransitions(contractState);
      result.criticalPaths.push(...analysis.criticalPaths);
      result.potentialIssues.push(...analysis.potentialIssues);
    });

    // NEW: Analyze cross-contract flows
    result.crossContractFlows = this.analyzeCrossContractFlows(this.contractStates);
    
    // Detect cross-contract reentrancy from flows
    const crossContractIssues = this.detectCrossContractReentrancy(result.crossContractFlows);
    result.potentialIssues.push(...crossContractIssues);

    // Check protocol-wide state invariants
    result.stateInvariants = this.checkStateInvariants(this.contractStates);

    return result;
  }

  /**
   * Parse contract into ContractState structure
   */
  private parseContractState(contract: ContractFile): ContractState {
    const content = contract.content;

    // Trace variable types for better call resolution
    const typeMap = this.traceVariableTypes(content);
    typeMap.forEach((type, varName) => {
      this.variableTypes.set(varName, type);
    });

    // Extract contract name
    const contractMatch = content.match(/contract\s+(\w+)/);
    const contractName = contractMatch ? contractMatch[1] : contract.name;

    // Parse state variables
    const stateVariables = this.parseStateVariables(content);

    // Parse functions and their state transitions
    const functions = this.parseFunctions(content);
    const transitions = this.parseStateTransitions(content, stateVariables);

    return {
      contractAddress: contract.path,
      contractName,
      stateVariables,
      transitions,
      functions
    };
  }

  private parseStateVariables(contractCode: string): StateVariable[] {
    const variables: StateVariable[] = [];

    // Match state variable declarations
    const varPattern = /(public|private|internal)\s+([\w\[\]<>,\s]+)\s+(constant\s+|immutable\s+)?(\w+)\s*(?:=|;)/g;
    const matches = contractCode.matchAll(varPattern);

    let slot = 0;
    for (const match of matches) {
      const visibility = match[1] as 'public' | 'private' | 'internal';
      const type = match[2].trim();
      const modifiers = match[3] || '';
      const name = match[4];

      variables.push({
        name,
        type,
        visibility,
        isConstant: modifiers.includes('constant'),
        isImmutable: modifiers.includes('immutable'),
        slot: slot++
      });
    }

    // Also catch variables without explicit visibility
    const implicitPattern = /^\s*(uint256|uint|address|bool|bytes32|mapping\([^)]+\)|[\w\[\]]+)\s+(\w+)\s*[;=]/gm;
    const implicitMatches = contractCode.matchAll(implicitPattern);

    for (const match of implicitMatches) {
      const name = match[2];
      // Check if not already added
      if (!variables.some(v => v.name === name)) {
        variables.push({
          name,
          type: match[1],
          visibility: 'internal',
          isConstant: false,
          isImmutable: false,
          slot: slot++
        });
      }
    }

    return variables;
  }

  private parseFunctions(contractCode: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    // Match function declarations
    const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s+(public|external|internal|private)?\s*(view|pure|payable|nonpayable)?\s*([^{]*)\{/g;
    const matches = contractCode.matchAll(functionPattern);

    for (const match of matches) {
      const name = match[1];
      const visibility = (match[2] || 'public') as any;
      const stateMutability = match[3] as any;
      const modifiersStr = match[4] || '';

      // Extract modifiers
      const modifiers: string[] = [];
      const modifierMatches = modifiersStr.matchAll(/(\w+)(?:\([^)]*\))?/g);
      for (const modMatch of modifierMatches) {
        if (!['public', 'external', 'internal', 'private', 'view', 'pure', 'payable', 'returns'].includes(modMatch[1])) {
          modifiers.push(modMatch[1]);
        }
      }

      // Get function body to check for external calls and state modifications
      const functionBody = this.extractFunctionBody(contractCode, name);
      const hasExternalCalls = /\.call|\.delegatecall|\.transfer|\.send/.test(functionBody);
      const modifiesState = this.checkIfModifiesState(functionBody);

      functions.push({
        name,
        visibility,
        stateMutability,
        modifiers,
        hasExternalCalls,
        modifiesState
      });
    }

    return functions;
  }

  private extractFunctionBody(contractCode: string, functionName: string): string {
    // Simple extraction - find function and get content between braces
    const functionPattern = new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)[^{]*\\{`, 'g');
    const match = functionPattern.exec(contractCode);
    
    if (!match || match.index === undefined) return '';
    
    const startIndex = match.index + match[0].length;
    let braceCount = 1;
    let endIndex = startIndex;
    
    // Find matching closing brace
    for (let i = startIndex; i < contractCode.length && braceCount > 0; i++) {
      if (contractCode[i] === '{') braceCount++;
      if (contractCode[i] === '}') braceCount--;
      endIndex = i;
    }
    
    return contractCode.slice(startIndex, endIndex);
  }

  private checkIfModifiesState(functionBody: string): boolean {
    // Check for state modifications
    return /\w+\s*=\s*(?!=)/.test(functionBody) ||   // assignments (not ==, !=)
           /\+\+|\-\-/.test(functionBody) ||          // increment/decrement
           /\.push\(|\.pop\(/.test(functionBody) ||   // array operations
           /delete\s+/.test(functionBody);            // delete operations
  }

  private parseStateTransitions(contractCode: string, stateVariables: StateVariable[]): StateTransition[] {
    const transitions: StateTransition[] = [];

    // Parse each function
    const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s+(public|external|internal|private)?\s*([^{]*)\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;
    const matches = contractCode.matchAll(functionPattern);

    for (const match of matches) {
      const functionName = match[1];
      const visibility = (match[2] || 'public') as any;
      const modifiersStr = match[3] || '';
      const functionBody = match[4];

      // Extract modifiers
      const modifiers: string[] = [];
      const modifierMatches = modifiersStr.matchAll(/(\w+)(?:\([^)]*\))?/g);
      for (const modMatch of modifierMatches) {
        if (!['public', 'external', 'internal', 'private', 'view', 'pure', 'payable', 'returns'].includes(modMatch[1])) {
          modifiers.push(modMatch[1]);
        }
      }

      // Parse state changes
      const stateChanges = this.parseStateChanges(functionBody, stateVariables);

      // Parse external calls
      const externalCalls = this.parseExternalCalls(functionBody, stateChanges);

      // Parse events
      const events = this.parseEvents(functionBody);

      // Parse require/assert checks
      const requireChecks = this.parseRequireChecks(functionBody);

      transitions.push({
        functionName,
        visibility,
        modifiers,
        stateChanges,
        externalCalls,
        emittedEvents: events,
        requireChecks
      });
    }

    return transitions;
  }

  private parseStateChanges(functionBody: string, stateVariables: StateVariable[]): StateChange[] {
    const changes: StateChange[] = [];

    stateVariables.forEach(variable => {
      // Assignment
      const assignPattern = new RegExp(`${variable.name}\\s*=\\s*`, 'g');
      if (assignPattern.test(functionBody)) {
        changes.push({
          variable: variable.name,
          operation: 'set',
          context: 'assignment'
        });
      }

      // Increment
      const incPattern = new RegExp(`${variable.name}\\s*\\+\\+|${variable.name}\\s*\\+=`, 'g');
      if (incPattern.test(functionBody)) {
        changes.push({
          variable: variable.name,
          operation: 'increment',
          context: 'increment operation'
        });
      }

      // Decrement
      const decPattern = new RegExp(`${variable.name}\\s*--|${variable.name}\\s*-=`, 'g');
      if (decPattern.test(functionBody)) {
        changes.push({
          variable: variable.name,
          operation: 'decrement',
          context: 'decrement operation'
        });
      }

      // Delete
      const deletePattern = new RegExp(`delete\\s+${variable.name}`, 'g');
      if (deletePattern.test(functionBody)) {
        changes.push({
          variable: variable.name,
          operation: 'delete',
          context: 'delete operation'
        });
      }

      // Array push
      const pushPattern = new RegExp(`${variable.name}\\.push`, 'g');
      if (pushPattern.test(functionBody)) {
        changes.push({
          variable: variable.name,
          operation: 'push',
          context: 'array push'
        });
      }

      // Array pop
      const popPattern = new RegExp(`${variable.name}\\.pop`, 'g');
      if (popPattern.test(functionBody)) {
        changes.push({
          variable: variable.name,
          operation: 'pop',
          context: 'array pop'
        });
      }
    });

    return changes;
  }

  private parseExternalCalls(functionBody: string, stateChanges: StateChange[]): ExternalCall[] {
    const calls: ExternalCall[] = [];

    // Find all external calls
    const callPattern = /(\w+)\.(call|delegatecall|staticcall|transfer|send)\s*\(/g;
    const matches = functionBody.matchAll(callPattern);

    for (const match of matches) {
      const target = match[1];
      const callType = match[2] as any;
      const callIndex = match.index || 0;

      // Determine position relative to state changes
      let position: 'before' | 'after' | 'during' = 'during';

      if (stateChanges.length > 0) {
        const firstStateChangeIndex = functionBody.indexOf(stateChanges[0].variable);
        const lastStateChangeIndex = functionBody.lastIndexOf(stateChanges[stateChanges.length - 1].variable);

        if (callIndex < firstStateChangeIndex) {
          position = 'before';
        } else if (callIndex > lastStateChangeIndex) {
          position = 'after';
        }
      }

      // Resolve variable type for better target identification
      const targetType = this.variableTypes.get(target);

      calls.push({
        target,
        targetType, // NEW: Include resolved type
        function: '',
        position,
        type: callType
      });
    }

    return calls;
  }

  private parseEvents(functionBody: string): string[] {
    const events: string[] = [];
    const eventPattern = /emit\s+(\w+)\s*\(/g;
    const matches = functionBody.matchAll(eventPattern);

    for (const match of matches) {
      events.push(match[1]);
    }

    return events;
  }

  private parseRequireChecks(functionBody: string): string[] {
    const checks: string[] = [];

    // Match require statements
    const requirePattern = /require\s*\(([^)]+)\)/g;
    const matches = functionBody.matchAll(requirePattern);

    for (const match of matches) {
      checks.push(match[1].trim());
    }

    // Match assert statements
    const assertPattern = /assert\s*\(([^)]+)\)/g;
    const assertMatches = functionBody.matchAll(assertPattern);

    for (const match of assertMatches) {
      checks.push(match[1].trim());
    }

    return checks;
  }

  private analyzeTransitions(contractState: ContractState): { criticalPaths: CriticalPath[], potentialIssues: StateFlowIssue[] } {
    const criticalPaths: CriticalPath[] = [];
    const potentialIssues: StateFlowIssue[] = [];

    // Analyze each state transition
    contractState.transitions.forEach(transition => {
      // Check for reentrancy risk (state changes after external calls)
      const reentrancyIssue = this.checkReentrancyRisk(transition, contractState.contractName);
      if (reentrancyIssue) {
        potentialIssues.push(reentrancyIssue);
      }

      // Check for missing access control
      const accessControlIssue = this.checkAccessControl(transition, contractState.contractName);
      if (accessControlIssue) {
        potentialIssues.push(accessControlIssue);
      }

      // Check for unchecked arithmetic
      const arithmeticIssue = this.checkUncheckedArithmetic(transition, contractState.contractName);
      if (arithmeticIssue) {
        potentialIssues.push(arithmeticIssue);
      }

      // Identify critical state transition paths
      if (transition.externalCalls.length > 0 && transition.stateChanges.length > 0) {
        criticalPaths.push({
          functionName: transition.functionName,
          risk: 'High',
          description: `Function ${transition.functionName} modifies state and makes external calls`,
          steps: [
            `Function: ${transition.functionName}`,
            `External calls: ${transition.externalCalls.length}`,
            `State changes: ${transition.stateChanges.length}`,
            'Risk: Potential reentrancy vulnerability'
          ]
        });
      }
    });

    return { criticalPaths, potentialIssues };
  }

  private checkReentrancyRisk(transition: StateTransition, contractName: string): StateFlowIssue | null {
    // Check if state changes happen after external calls
    const hasExternalCalls = transition.externalCalls.length > 0;
    const hasStateChangesAfter = transition.externalCalls.some(call => call.position === 'before');

    if (hasExternalCalls && hasStateChangesAfter) {
      return {
        type: 'Reentrancy Vulnerability',
        severity: 'High',
        contract: contractName,
        function: transition.functionName,
        description: `Function ${transition.functionName} modifies state after making external calls, violating the Checks-Effects-Interactions pattern`,
        recommendation: 'Move state changes before external calls or use ReentrancyGuard modifier'
      };
    }

    return null;
  }

  private checkAccessControl(transition: StateTransition, contractName: string): StateFlowIssue | null {
    // Check if state-changing function has access control
    if (transition.stateChanges.length > 0 && (transition.visibility === 'external' || transition.visibility === 'public')) {
      const hasAccessControl = transition.modifiers.some(mod => 
        /only|auth|guard|owner|admin/i.test(mod)
      );

      if (!hasAccessControl) {
        return {
          type: 'Missing Access Control',
          severity: 'Medium',
          contract: contractName,
          function: transition.functionName,
          description: `Public function ${transition.functionName} modifies state without access control`,
          recommendation: 'Add access control modifiers (e.g., onlyOwner, onlyRole) to restrict function access'
        };
      }
    }

    return null;
  }

  private checkUncheckedArithmetic(transition: StateTransition, contractName: string): StateFlowIssue | null {
    // Check for arithmetic operations that might overflow/underflow
    const hasArithmetic = transition.stateChanges.some(change => 
      change.operation === 'increment' || change.operation === 'decrement'
    );

    if (hasArithmetic) {
      // Check if there are no require checks
      if (transition.requireChecks.length === 0) {
        return {
          type: 'Unchecked Arithmetic',
          severity: 'Low',
          contract: contractName,
          function: transition.functionName,
          description: `Function ${transition.functionName} performs arithmetic operations without checks`,
          recommendation: 'Add bounds checking or use SafeMath/checked arithmetic'
        };
      }
    }

    return null;
  }

  /**
   * Check protocol-wide state invariants
   */
  private checkStateInvariants(contractStates: ContractState[]): StateInvariant[] {
    const invariants: StateInvariant[] = [];

    // Check for total supply invariants across token contracts
    const tokenContracts = contractStates.filter(c => 
      c.stateVariables.some(v => v.name === 'totalSupply')
    );

    if (tokenContracts.length > 1) {
      invariants.push({
        description: 'Multiple token contracts with totalSupply detected',
        condition: 'Sum of all balances should equal total supply across all contracts',
        violated: false, // Would need runtime data to verify
        affectedContracts: tokenContracts.map(c => c.contractName)
      });
    }

    // Check for balance invariants
    contractStates.forEach(state => {
      const hasBalanceMapping = state.stateVariables.some(v => 
        v.name.includes('balance') || v.name.includes('Balance')
      );

      if (hasBalanceMapping) {
        // Check if there are functions that could violate balance invariants
        const hasUncheckedTransfers = state.transitions.some(t => 
          t.stateChanges.some(sc => sc.variable.includes('balance')) &&
          t.requireChecks.length === 0
        );

        if (hasUncheckedTransfers) {
          invariants.push({
            description: `Balance updates in ${state.contractName} lack validation`,
            condition: 'Balance changes should be validated to prevent overflow/underflow',
            violated: true,
            affectedContracts: [state.contractName]
          });
        }
      }
    });

    return invariants;
  }

  /**
   * OLD METHODS - keeping for backwards compatibility but not used in new flow
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

  /**
   * NEW: Analyze cross-contract flows to detect sophisticated reentrancy and state manipulation
   */
  analyzeCrossContractFlows(contractStates: ContractState[]): CrossContractFlow[] {
    const flows: CrossContractFlow[] = [];

    // For each contract
    contractStates.forEach(sourceContract => {
      // For each function that makes external calls
      sourceContract.transitions.forEach(transition => {
        if (transition.externalCalls.length === 0) return;

        transition.externalCalls.forEach(externalCall => {
          // Try to resolve the target contract and function
          const targetInfo = this.resolveExternalCallTarget(
            externalCall,
            sourceContract,
            contractStates
          );

          if (!targetInfo) return;

          // Analyze state changes before, during, and after the call
          const stateChanges = this.analyzeStateChangesAroundCall(
            transition,
            externalCall,
            targetInfo.targetContract,
            targetInfo.targetFunction
          );

          // Determine reentrancy risk
          const reentrancyRisk = this.assessCrossContractReentrancyRisk(
            stateChanges,
            externalCall
          );

          flows.push({
            sourceContract: sourceContract.contractName,
            sourceFunction: transition.functionName,
            targetContract: targetInfo.targetContract.contractName,
            targetFunction: targetInfo.targetFunction || 'unknown',
            stateChanges,
            reentrancyRisk,
            description: `${sourceContract.contractName}.${transition.functionName} calls ${targetInfo.targetContract.contractName}.${targetInfo.targetFunction}`
          });
        });
      });
    });

    return flows;
  }

  /**
   * Resolve external call target by tracing variable types
   */
  private resolveExternalCallTarget(
    externalCall: ExternalCall,
    sourceContract: ContractState,
    allContracts: ContractState[]
  ): { targetContract: ContractState; targetFunction: string } | null {
    // First, try to get the type from the targetType field (if already resolved)
    if (externalCall.targetType) {
      const targetContract = allContracts.find(c => 
        c.contractName === externalCall.targetType ||
        (externalCall.targetType && c.contractName.includes(externalCall.targetType))
      );
      
      if (targetContract) {
        return { targetContract, targetFunction: externalCall.function || 'unknown' };
      }
    }

    // Try to resolve from state variables
    const targetVariable = sourceContract.stateVariables.find(v => 
      v.name === externalCall.target
    );

    if (targetVariable) {
      // Extract contract type from variable type (e.g., "IERC20" from "IERC20 token")
      const typeMatch = targetVariable.type.match(/^([A-Z]\w+)/);
      if (typeMatch) {
        const contractType = typeMatch[1];
        const targetContract = allContracts.find(c => 
          c.contractName === contractType ||
          c.contractName.includes(contractType) ||
          contractType.includes(c.contractName)
        );

        if (targetContract) {
          return { targetContract, targetFunction: externalCall.function || 'unknown' };
        }
      }
    }

    return null;
  }

  /**
   * Analyze state changes before, during, and after external call
   */
  private analyzeStateChangesAroundCall(
    transition: StateTransition,
    externalCall: ExternalCall,
    targetContract: ContractState,
    targetFunction: string
  ): {
    beforeCall: StateChange[];
    inTarget: StateChange[];
    afterCall: StateChange[];
  } {
    const beforeCall: StateChange[] = [];
    const afterCall: StateChange[] = [];
    const inTarget: StateChange[] = [];

    // Categorize state changes by position relative to call
    transition.stateChanges.forEach(change => {
      if (externalCall.position === 'before') {
        afterCall.push(change);
      } else if (externalCall.position === 'after') {
        beforeCall.push(change);
      }
    });

    // Get state changes in target function
    const targetTransition = targetContract.transitions.find(t => 
      t.functionName === targetFunction
    );
    
    if (targetTransition) {
      inTarget.push(...targetTransition.stateChanges);
    }

    return { beforeCall, inTarget, afterCall };
  }

  /**
   * Assess cross-contract reentrancy risk
   */
  private assessCrossContractReentrancyRisk(
    stateChanges: {
      beforeCall: StateChange[];
      inTarget: StateChange[];
      afterCall: StateChange[];
    },
    externalCall: ExternalCall
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical: State changes after external call + target modifies state
    if (stateChanges.afterCall.length > 0 && stateChanges.inTarget.length > 0) {
      return 'critical';
    }

    // High: State changes after external call (even if target state unknown)
    if (stateChanges.afterCall.length > 0) {
      return 'high';
    }

    // Medium: delegatecall always risky
    if (externalCall.type === 'delegatecall') {
      return 'high';
    }

    // Low: State changes before call only
    if (stateChanges.beforeCall.length > 0 && stateChanges.afterCall.length === 0) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Detect cross-contract reentrancy from analyzed flows
   */
  private detectCrossContractReentrancy(flows: CrossContractFlow[]): StateFlowIssue[] {
    const issues: StateFlowIssue[] = [];

    flows.forEach(flow => {
      if (flow.reentrancyRisk === 'critical' || flow.reentrancyRisk === 'high') {
        issues.push({
          type: 'Cross-Contract Reentrancy',
          severity: flow.reentrancyRisk === 'critical' ? 'Critical' : 'High',
          contract: flow.sourceContract,
          function: flow.sourceFunction,
          description: `Function ${flow.sourceFunction} calls ${flow.targetContract}.${flow.targetFunction} and modifies state afterwards, creating cross-contract reentrancy risk`,
          recommendation: 'Follow checks-effects-interactions pattern: update all state before making external calls. Use ReentrancyGuard modifier.',
          dataFlow: `${flow.sourceContract}.${flow.sourceFunction} -> ${flow.targetContract}.${flow.targetFunction} -> potential reentry -> state corruption`,
          affectedContracts: [flow.sourceContract, flow.targetContract]
        });
      }
    });

    return issues;
  }

  /**
   * Trace variable types from contract code to improve call resolution
   */
  /**
   * Trace variable types from contract code to improve call resolution
   */
  private traceVariableTypes(contractCode: string): Map<string, string> {
    const typeMap = new Map<string, string>();

    // Primitive types to exclude
    const primitiveTypes = ['uint256', 'uint', 'address', 'bool', 'bytes32', 'bytes'];

    // Pattern 1: State variable declarations with explicit types
    // e.g., "IERC20 public token;" or "IUniswapV2Router private router;"
    const stateVarPattern = /(?:public|private|internal)\s+([A-Z]\w+)\s+(\w+)\s*[;=]/g;
    let match;
    
    while ((match = stateVarPattern.exec(contractCode)) !== null) {
      const type = match[1];
      const varName = match[2];
      if (type && varName && !primitiveTypes.includes(type)) {
        typeMap.set(varName, type);
      }
    }

    // Pattern 2: Local variable declarations
    // e.g., "IUniswapV2Router router = IUniswapV2Router(address);"
    const localVarPattern = /([A-Z]\w+)\s+(\w+)\s*=/g;
    
    while ((match = localVarPattern.exec(contractCode)) !== null) {
      const type = match[1];
      const varName = match[2];
      if (type && varName && !primitiveTypes.includes(type)) {
        typeMap.set(varName, type);
      }
    }

    return typeMap;
  }
}
