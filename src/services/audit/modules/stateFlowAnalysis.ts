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
  contractStates: ContractState[];
  criticalPaths: CriticalPath[];
  potentialIssues: StateFlowIssue[];
  stateInvariants: StateInvariant[];
  recommendations: string[];
}

export interface CriticalPath {
  path: string[];
  description: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
}

export interface StateFlowIssue {
  type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  contract: string;
  function: string;
  description: string;
  recommendation: string;
  dataFlow?: string;
}

export interface StateInvariant {
  description: string;
  violated: boolean;
  contracts: string[];
  impact: string;
}

export class StateFlowAnalyzer {
  private contractStates: ContractState[];

  constructor(contracts: ContractFile[]) {
    this.contractStates = contracts.map(contract => this.parseContractState(contract));
  }

  analyzeStateFlow(): StateFlowResult {
    const result: StateFlowResult = {
      contractStates: this.contractStates,
      criticalPaths: [],
      potentialIssues: [],
      stateInvariants: [],
      recommendations: []
    };

    // Analyze each contract's state transitions
    this.contractStates.forEach(contractState => {
      const analysis = this.analyzeTransitions(contractState);
      result.criticalPaths.push(...analysis.criticalPaths);
      result.potentialIssues.push(...analysis.potentialIssues);
    });

    // Check protocol-wide state invariants
    result.stateInvariants = this.checkStateInvariants(this.contractStates);

    // Generate recommendations
    result.recommendations = this.generateRecommendations(result);

    return result;
  }

  private parseContractState(contract: ContractFile): ContractState {
    const content = contract.content;

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

      calls.push({
        target,
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
          path: [contractState.contractName, transition.functionName, ...transition.externalCalls.map(c => c.target)],
          description: `Function ${transition.functionName} modifies state and makes external calls`,
          risk: 'high',
          impact: 'State can be manipulated through reentrancy or unexpected external behavior'
        });
      }
    });

    return { criticalPaths, potentialIssues };
  }

  private checkReentrancyRisk(transition: StateTransition, contractName: string): StateFlowIssue | null {
    // Check if state is modified after external calls
    const hasExternalCalls = transition.externalCalls.length > 0;
    const hasStateChangesAfterCalls = transition.externalCalls.some(call => call.position === 'before');

    if (hasExternalCalls && hasStateChangesAfterCalls) {
      return {
        type: 'Reentrancy Risk',
        severity: 'High',
        contract: contractName,
        function: transition.functionName,
        description: `Function makes external calls before state updates, vulnerable to reentrancy`,
        recommendation: 'Follow checks-effects-interactions pattern: update state before external calls',
        dataFlow: `State update -> External call -> Potential reentry`
      };
    }

    return null;
  }

  private checkAccessControl(transition: StateTransition, contractName: string): StateFlowIssue | null {
    // Check if public/external functions modifying state have access control
    const isPublicOrExternal = transition.visibility === 'public' || transition.visibility === 'external';
    const modifiesState = transition.stateChanges.length > 0;
    const hasAccessControl = transition.modifiers.some(m =>
      m.toLowerCase().includes('only') || m.toLowerCase().includes('auth') || m.toLowerCase().includes('owner')
    ) || transition.requireChecks.some(r => r.includes('msg.sender'));

    if (isPublicOrExternal && modifiesState && !hasAccessControl) {
      return {
        type: 'Missing Access Control',
        severity: 'High',
        contract: contractName,
        function: transition.functionName,
        description: `Public function ${transition.functionName} modifies state without access control`,
        recommendation: 'Add access control modifiers or require checks to restrict who can call this function',
        dataFlow: `Anyone can call ${transition.functionName} and modify contract state`
      };
    }

    return null;
  }

  private checkUncheckedArithmetic(transition: StateTransition, contractName: string): StateFlowIssue | null {
    // Check for increment/decrement operations without SafeMath (pre-0.8.0)
    const hasArithmeticOps = transition.stateChanges.some(change =>
      change.operation === 'increment' || change.operation === 'decrement'
    );

    if (hasArithmeticOps && !transition.functionName.toLowerCase().includes('safe')) {
      return {
        type: 'Potential Integer Overflow/Underflow',
        severity: 'Medium',
        contract: contractName,
        function: transition.functionName,
        description: `Function performs arithmetic operations that may overflow/underflow`,
        recommendation: 'Use Solidity 0.8+ with built-in overflow checks or SafeMath library',
        dataFlow: `Arithmetic operation without overflow protection`
      };
    }

    return null;
  }

  private checkStateInvariants(contractStates: ContractState[]): StateInvariant[] {
    const invariants: StateInvariant[] = [];

    // Check for common DeFi invariants
    contractStates.forEach(state => {
      // Check for balance tracking invariants
      const hasBalanceVariable = state.stateVariables.some(v =>
        v.name.toLowerCase().includes('balance') || v.name.toLowerCase().includes('total')
      );

      if (hasBalanceVariable) {
        const balanceModifyingFunctions = state.transitions.filter(t =>
          t.stateChanges.some(c => c.variable.toLowerCase().includes('balance'))
        );

        const allHaveChecks = balanceModifyingFunctions.every(f =>
          f.requireChecks.length > 0 || f.modifiers.length > 0
        );

        invariants.push({
          description: 'Balance modifications should have checks',
          violated: !allHaveChecks,
          contracts: [state.contractName],
          impact: 'Incorrect balance tracking can lead to fund loss or protocol insolvency'
        });
      }

      // Check for supply invariants (total supply = sum of all balances)
      const hasTotalSupply = state.stateVariables.some(v =>
        v.name.toLowerCase().includes('totalsupply')
      );
      const hasBalances = state.stateVariables.some(v =>
        v.name.toLowerCase().includes('balances') || v.name.toLowerCase().includes('balance')
      );

      if (hasTotalSupply && hasBalances) {
        // Check if mint/burn functions properly update both
        const mintBurnFunctions = state.transitions.filter(t =>
          t.functionName.toLowerCase().includes('mint') || 
          t.functionName.toLowerCase().includes('burn')
        );

        mintBurnFunctions.forEach(fn => {
          const updatesTotalSupply = fn.stateChanges.some(c => 
            c.variable.toLowerCase().includes('totalsupply')
          );
          const updatesBalances = fn.stateChanges.some(c =>
            c.variable.toLowerCase().includes('balance')
          );

          if (!updatesTotalSupply || !updatesBalances) {
            invariants.push({
              description: `Function ${fn.functionName} may break supply invariant (totalSupply = sum(balances))`,
              violated: true,
              contracts: [state.contractName],
              impact: 'Supply mismatch can lead to accounting errors and potential fund loss'
            });
          }
        });
      }

      // Check for share price invariants (vault tokens)
      const isVault = state.contractName.toLowerCase().includes('vault') ||
                     state.stateVariables.some(v => v.name.toLowerCase().includes('shares'));
      
      if (isVault) {
        const hasDepositWithdraw = state.transitions.some(t =>
          t.functionName.toLowerCase().includes('deposit') ||
          t.functionName.toLowerCase().includes('withdraw')
        );

        if (hasDepositWithdraw) {
          // Check for share price manipulation protection
          const hasMinShares = state.transitions.some(t =>
            t.requireChecks.some(c => c.includes('shares') && (c.includes('>') || c.includes('min')))
          );

          invariants.push({
            description: 'Vault should protect against share price manipulation',
            violated: !hasMinShares,
            contracts: [state.contractName],
            impact: 'Share price manipulation can enable inflation attacks or donation attacks'
          });
        }
      }

      // Check for liquidity invariants (AMM pools)
      const isAMM = state.contractName.toLowerCase().includes('pool') ||
                    state.contractName.toLowerCase().includes('pair') ||
                    state.stateVariables.some(v => v.name.toLowerCase().includes('reserve'));

      if (isAMM) {
        const swapFunctions = state.transitions.filter(t =>
          t.functionName.toLowerCase().includes('swap')
        );

        swapFunctions.forEach(fn => {
          // Check for slippage protection
          const hasSlippageProtection = fn.requireChecks.some(c =>
            c.includes('min') && (c.includes('amount') || c.includes('out'))
          );

          if (!hasSlippageProtection) {
            invariants.push({
              description: `Swap function ${fn.functionName} lacks slippage protection`,
              violated: true,
              contracts: [state.contractName],
              impact: 'Users vulnerable to sandwich attacks and MEV exploitation'
            });
          }
        });

        // Check for constant product invariant (k = x * y)
        const hasReserveUpdates = state.transitions.some(t =>
          t.stateChanges.filter(c => c.variable.toLowerCase().includes('reserve')).length >= 2
        );

        if (hasReserveUpdates) {
          invariants.push({
            description: 'AMM should maintain constant product invariant (k = reserve0 * reserve1)',
            violated: false, // Can't easily detect violation statically
            contracts: [state.contractName],
            impact: 'Breaking invariant can lead to value extraction and pool imbalance'
          });
        }
      }
    });

    // Cross-contract invariants
    if (contractStates.length > 1) {
      // Check for circular dependencies in value transfers
      const transferringContracts = contractStates.filter(state =>
        state.transitions.some(t =>
          t.externalCalls.length > 0 && 
          (t.functionName.toLowerCase().includes('transfer') ||
           t.functionName.toLowerCase().includes('send'))
        )
      );

      if (transferringContracts.length >= 2) {
        invariants.push({
          description: 'Multiple contracts perform external transfers - verify no circular dependencies',
          violated: false, // Would need deeper analysis
          contracts: transferringContracts.map(c => c.contractName),
          impact: 'Circular dependencies in transfers can lead to reentrancy or fund locking'
        });
      }

      // Check for consistent access control across protocol
      const accessControlPatterns = new Set<string>();
      contractStates.forEach(state => {
        state.transitions.forEach(t => {
          if (t.modifiers.length > 0) {
            t.modifiers.forEach(m => accessControlPatterns.add(m));
          }
        });
      });

      if (accessControlPatterns.size > 3) {
        invariants.push({
          description: 'Inconsistent access control patterns across contracts',
          violated: true,
          contracts: contractStates.map(c => c.contractName),
          impact: 'Inconsistent access controls may create privilege escalation vectors'
        });
      }
    }

    return invariants;
  }

  private generateRecommendations(result: StateFlowResult): string[] {
    const recommendations: string[] = [];

    // Count issues by type
    const reentrancyCount = result.potentialIssues.filter(i => i.type.includes('Reentrancy')).length;
    const accessControlCount = result.potentialIssues.filter(i => i.type.includes('Access Control')).length;

    if (reentrancyCount > 0) {
      recommendations.push(`Found ${reentrancyCount} potential reentrancy issues. Consider using ReentrancyGuard and following checks-effects-interactions pattern.`);
    }

    if (accessControlCount > 0) {
      recommendations.push(`Found ${accessControlCount} functions without access control. Add appropriate modifiers to restrict access.`);
    }

    if (result.criticalPaths.length > 0) {
      recommendations.push(`Identified ${result.criticalPaths.length} critical execution paths. Review these carefully for security implications.`);
    }

    const violatedInvariants = result.stateInvariants.filter(i => i.violated);
    if (violatedInvariants.length > 0) {
      recommendations.push(`${violatedInvariants.length} protocol invariants may be violated. Ensure state consistency across all operations.`);
    }

    return recommendations;
  }

  private extractFunctionBody(contractCode: string, functionName: string): string {
    const functionRegex = new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)[^{]*\\{([^}]*(?:\\{[^}]*\\}[^}]*)*?)\\}`, 's');
    const match = contractCode.match(functionRegex);
    return match ? match[1] : '';
  }

  private checkIfModifiesState(functionBody: string): boolean {
    // Check for state variable assignments
    const hasAssignment = /\w+\s*=\s*[^=]/.test(functionBody);
    const hasIncDec = /\w+\s*(\+\+|--|[\+\-\*\/]=)/.test(functionBody);
    const hasDelete = /delete\s+\w+/.test(functionBody);
    const hasPush = /\w+\.push/.test(functionBody);

    return hasAssignment || hasIncDec || hasDelete || hasPush;
  }
}
