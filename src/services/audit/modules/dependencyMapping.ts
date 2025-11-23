import type { ContractFile } from "@/types/blockchain";

export interface DependencyGraph {
  nodes: ContractNode[];
  edges: DependencyEdge[];
  vulnerabilities: CrossContractVulnerability[];
  metrics: {
    totalContracts: number;
    totalDependencies: number;
    cyclicDependencies: string[][];
    criticalContracts: string[];
  };
}

export interface ContractNode {
  id: string;
  name: string;
  type: 'contract' | 'library' | 'interface';
  functions: string[];
  stateVariables: string[];
  modifiers: string[];
  isProxy: boolean;
  isUpgradeable: boolean;
  inherits: string[];
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'import' | 'call' | 'delegatecall' | 'staticcall' | 'create' | 'inherit' | 'library';
  functions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
}

export interface CrossContractVulnerability {
  type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  contracts: string[];
  description: string;
  location: string;
  recommendation: string;
  dataFlow?: string;
}

export function mapContractDependencies(contracts: ContractFile[]): DependencyGraph {
  const graph: DependencyGraph = {
    nodes: [],
    edges: [],
    vulnerabilities: [],
    metrics: {
      totalContracts: contracts.length,
      totalDependencies: 0,
      cyclicDependencies: [],
      criticalContracts: []
    }
  };

  // Parse all contracts and create nodes
  contracts.forEach(contract => {
    const node = parseContractNode(contract);
    graph.nodes.push(node);
  });

  // Analyze dependencies and create edges
  contracts.forEach(contract => {
    const edges = analyzeContractDependencies(contract, contracts);
    graph.edges.push(...edges);
  });

  // Detect cross-contract vulnerabilities
  graph.vulnerabilities = detectCrossContractVulnerabilities(contracts, graph);

  // Calculate metrics
  graph.metrics.totalDependencies = graph.edges.length;
  graph.metrics.cyclicDependencies = detectCyclicDependencies(graph);
  graph.metrics.criticalContracts = identifyCriticalContracts(graph);

  return graph;
}

function parseContractNode(contract: ContractFile): ContractNode {
  const content = contract.content;

  // Extract contract name and type
  const contractMatch = content.match(/(?:contract|library|interface)\s+(\w+)/);
  const name = contractMatch ? contractMatch[1] : contract.name;

  const isLibrary = /library\s+\w+/.test(content);
  const isInterface = /interface\s+\w+/.test(content);
  const type = isLibrary ? 'library' : isInterface ? 'interface' : 'contract';

  // Extract functions
  const functions: string[] = [];
  const functionMatches = content.matchAll(/function\s+(\w+)\s*\(/g);
  for (const match of functionMatches) {
    functions.push(match[1]);
  }

  // Extract state variables
  const stateVariables: string[] = [];
  const varMatches = content.matchAll(/(?:public|private|internal)\s+(?:[\w\[\]]+)\s+(\w+)\s*[;=]/g);
  for (const match of varMatches) {
    stateVariables.push(match[1]);
  }

  // Extract modifiers
  const modifiers: string[] = [];
  const modifierMatches = content.matchAll(/modifier\s+(\w+)\s*\(/g);
  for (const match of modifierMatches) {
    modifiers.push(match[1]);
  }

  // Check if it's a proxy
  const isProxy = /delegatecall|Proxy|UUPS|Transparent/.test(content);

  // Check if upgradeable
  const isUpgradeable = /Upgradeable|initializ|UUPS|UUPSUpgradeable/.test(content);

  // Extract inheritance
  const inherits: string[] = [];
  const inheritMatch = content.match(/(?:contract|library|interface)\s+\w+\s+is\s+([\w\s,]+)/);
  if (inheritMatch) {
    inherits.push(...inheritMatch[1].split(',').map(s => s.trim()));
  }

  return {
    id: contract.path,
    name,
    type,
    functions,
    stateVariables,
    modifiers,
    isProxy,
    isUpgradeable,
    inherits
  };
}

function analyzeContractDependencies(contract: ContractFile, allContracts: ContractFile[]): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  const content = contract.content;

  // NEW: Build variable type map for better resolution
  const variableTypes = extractVariableTypes(content);

  // 1. Import dependencies
  const imports = content.matchAll(/import\s+.*?\s+from\s+['"](.*?)['"]/g);
  for (const importMatch of imports) {
    const importPath = importMatch[1];
    const targetContract = allContracts.find(c =>
      c.path.includes(importPath) || importPath.includes(c.name)
    );

    if (targetContract) {
      edges.push({
        from: contract.path,
        to: targetContract.path,
        type: 'import',
        functions: [],
        riskLevel: 'low',
        description: 'Import dependency'
      });
    }
  }

  // 2. External calls (.call, .transfer, .send) with TYPE RESOLUTION
  const externalCalls = content.matchAll(/(\w+)\.(?:call|transfer|send)\s*\(/g);
  for (const callMatch of externalCalls) {
    const targetName = callMatch[1];
    
    // NEW: Try to resolve type first
    const targetType = variableTypes.get(targetName);
    let targetContract = null;
    
    if (targetType) {
      // Look for contract by type
      targetContract = findContractByType(targetType, allContracts);
    }
    
    // Fallback to name-based resolution
    if (!targetContract) {
      targetContract = findContractByName(targetName, allContracts);
    }

    if (targetContract) {
      edges.push({
        from: contract.path,
        to: targetContract.path,
        type: 'call',
        functions: [],
        riskLevel: 'medium',
        description: targetType 
          ? `External call to ${targetType} - potential reentrancy risk`
          : 'External call - potential reentrancy risk'
      });
    }
  }

  // 3. Delegatecall dependencies (HIGH RISK)
  const delegateCalls = content.matchAll(/(\w+)\.delegatecall\s*\(/g);
  for (const delegateMatch of delegateCalls) {
    const targetName = delegateMatch[1];
    const targetContract = findContractByName(targetName, allContracts);

    if (targetContract) {
      edges.push({
        from: contract.path,
        to: targetContract.path,
        type: 'delegatecall',
        functions: [],
        riskLevel: 'critical',
        description: 'Delegatecall - storage collision risk'
      });
    }
  }

  // 4. Contract instantiation
  const contractCreations = content.matchAll(/new\s+(\w+)\s*\(/g);
  for (const createMatch of contractCreations) {
    const targetName = createMatch[1];
    const targetContract = findContractByName(targetName, allContracts);

    if (targetContract) {
      edges.push({
        from: contract.path,
        to: targetContract.path,
        type: 'create',
        functions: [],
        riskLevel: 'low',
        description: 'Creates instance of contract'
      });
    }
  }

  // 5. Interface/Contract type usage
  const typeUsages = content.matchAll(/(\w+)\s+\w+\s*=\s*(\w+)\s*\(/g);
  for (const typeMatch of typeUsages) {
    const typeName = typeMatch[1];
    const targetContract = findContractByName(typeName, allContracts);

    if (targetContract) {
      edges.push({
        from: contract.path,
        to: targetContract.path,
        type: 'call',
        functions: [],
        riskLevel: 'low',
        description: 'Uses contract interface'
      });
    }
  }

  // 6. Inheritance dependencies
  const inheritMatch = content.match(/(?:contract|library|interface)\s+\w+\s+is\s+([\w\s,]+)/);
  if (inheritMatch) {
    const parents = inheritMatch[1].split(',').map(s => s.trim());
    parents.forEach(parentName => {
      const parentContract = findContractByName(parentName, allContracts);
      if (parentContract) {
        edges.push({
          from: contract.path,
          to: parentContract.path,
          type: 'inherit',
          functions: [],
          riskLevel: 'low',
          description: 'Inherits from contract'
        });
      }
    });
  }

  // 7. Library usage
  const usingStatements = content.matchAll(/using\s+(\w+)\s+for/g);
  for (const usingMatch of usingStatements) {
    const libraryName = usingMatch[1];
    const libraryContract = findContractByName(libraryName, allContracts);

    if (libraryContract) {
      edges.push({
        from: contract.path,
        to: libraryContract.path,
        type: 'library',
        functions: [],
        riskLevel: 'low',
        description: 'Uses library'
      });
    }
  }

  return edges;
}

function findContractByName(name: string, contracts: ContractFile[]): ContractFile | undefined {
  return contracts.find(c =>
    c.name === name ||
    c.path.includes(name) ||
    c.content.includes(`contract ${name}`) ||
    c.content.includes(`interface ${name}`) ||
    c.content.includes(`library ${name}`)
  );
}

function detectCrossContractVulnerabilities(
  contracts: ContractFile[],
  graph: DependencyGraph
): CrossContractVulnerability[] {
  const vulnerabilities: CrossContractVulnerability[] = [];

  // 1. Detect cross-contract reentrancy
  const reentrancyVulns = detectCrossContractReentrancy(contracts, graph);
  vulnerabilities.push(...reentrancyVulns);

  // 2. Detect delegatecall storage collisions
  const storageVulns = detectDelegatecallStorageCollisions(contracts, graph);
  vulnerabilities.push(...storageVulns);

  // 3. Detect access control issues across contracts
  const accessControlVulns = detectCrossContractAccessControl(contracts, graph);
  vulnerabilities.push(...accessControlVulns);

  // 4. Detect unchecked external calls
  const uncheckedCallVulns = detectUncheckedExternalCalls(contracts);
  vulnerabilities.push(...uncheckedCallVulns);

  // 5. Detect read-only reentrancy across contracts
  const readOnlyReentrancyVulns = detectReadOnlyReentrancy(contracts, graph);
  vulnerabilities.push(...readOnlyReentrancyVulns);

  // 6. Detect flash loan attack vectors across contracts
  const flashLoanVulns = detectFlashLoanVectors(contracts, graph);
  vulnerabilities.push(...flashLoanVulns);

  // 7. Detect cross-protocol composability exploits
  const composabilityVulns = detectComposabilityExploits(contracts, graph);
  vulnerabilities.push(...composabilityVulns);

  // 8. Detect oracle manipulation across contracts
  const oracleVulns = detectOracleManipulation(contracts, graph);
  vulnerabilities.push(...oracleVulns);

  // 9. Detect governance attacks across contracts
  const governanceVulns = detectGovernanceAttacks(contracts, graph);
  vulnerabilities.push(...governanceVulns);

  return vulnerabilities;
}

function detectCrossContractReentrancy(
  contracts: ContractFile[],
  graph: DependencyGraph
): CrossContractVulnerability[] {
  const vulnerabilities: CrossContractVulnerability[] = [];

  graph.edges.forEach(edge => {
    if (edge.type === 'call' || edge.type === 'delegatecall') {
      const sourceContract = contracts.find(c => c.path === edge.from);
      const targetContract = contracts.find(c => c.path === edge.to);

      if (sourceContract && targetContract) {
        // Check if source has state changes after external call
        const hasStateChangeAfterCall = checkStateChangeAfterExternalCall(sourceContract.content);

        if (hasStateChangeAfterCall) {
          vulnerabilities.push({
            type: 'Cross-Contract Reentrancy',
            severity: 'High',
            contracts: [sourceContract.name, targetContract.name],
            description: `${sourceContract.name} makes external call to ${targetContract.name} and modifies state after the call`,
            location: `${sourceContract.name} -> ${targetContract.name}`,
            recommendation: 'Use checks-effects-interactions pattern. Move state changes before external calls or use ReentrancyGuard.',
            dataFlow: `${sourceContract.name} -> external call -> ${targetContract.name} -> potential reentry`
          });
        }
      }
    }
  });

  return vulnerabilities;
}

function detectDelegatecallStorageCollisions(
  contracts: ContractFile[],
  graph: DependencyGraph
): CrossContractVulnerability[] {
  const vulnerabilities: CrossContractVulnerability[] = [];

  graph.edges.forEach(edge => {
    if (edge.type === 'delegatecall') {
      const proxyContract = contracts.find(c => c.path === edge.from);
      const implementationContract = contracts.find(c => c.path === edge.to);

      if (proxyContract && implementationContract) {
        // Parse storage layout from both contracts
        const proxyStorage = extractStorageVariables(proxyContract.content);
        const implStorage = extractStorageVariables(implementationContract.content);

        // Check for storage layout mismatches
        if (proxyStorage.length > 0 && implStorage.length > 0) {
          const mismatch = checkStorageLayoutMismatch(proxyStorage, implStorage);

          if (mismatch) {
            vulnerabilities.push({
              type: 'Delegatecall Storage Collision',
              severity: 'Critical',
              contracts: [proxyContract.name, implementationContract.name],
              description: `Storage layout mismatch between proxy (${proxyContract.name}) and implementation (${implementationContract.name})`,
              location: `${proxyContract.name} delegatecall to ${implementationContract.name}`,
              recommendation: 'Ensure storage layouts match exactly. Use storage gaps in upgradeable contracts. Consider using OpenZeppelin upgradeable patterns.',
              dataFlow: `Proxy storage slots may be overwritten by implementation contract`
            });
          }
        }
      }
    }
  });

  return vulnerabilities;
}

function detectCrossContractAccessControl(
  contracts: ContractFile[],
  graph: DependencyGraph
): CrossContractVulnerability[] {
  const vulnerabilities: CrossContractVulnerability[] = [];

  contracts.forEach(contract => {
    const content = contract.content;

    // Find external/public functions that make privileged calls to other contracts
    const externalFunctions = content.matchAll(/function\s+(\w+)\s*\([^)]*\)\s+(?:external|public)/g);

    for (const funcMatch of externalFunctions) {
      const functionName = funcMatch[1];
      const functionContent = extractFunctionBody(content, functionName);

      // Check if function makes external calls without access control
      const hasAccessControl = /onlyOwner|require.*msg\.sender|modifier\s+\w+/.test(functionContent);
      const hasExternalCall = /\.call|\.delegatecall|\.transfer/.test(functionContent);

      if (hasExternalCall && !hasAccessControl) {
        vulnerabilities.push({
          type: 'Missing Access Control on Cross-Contract Call',
          severity: 'High',
          contracts: [contract.name],
          description: `Function ${functionName} in ${contract.name} makes external calls without proper access control`,
          location: `${contract.name}::${functionName}`,
          recommendation: 'Add access control modifiers (e.g., onlyOwner, require checks) to functions making external calls.',
          dataFlow: `Anyone can call ${functionName} -> external contract call`
        });
      }
    }
  });

  return vulnerabilities;
}

function detectUncheckedExternalCalls(contracts: ContractFile[]): CrossContractVulnerability[] {
  const vulnerabilities: CrossContractVulnerability[] = [];

  contracts.forEach(contract => {
    const content = contract.content;

    // Find .call, .delegatecall without return value check
    const uncheckedCalls = content.matchAll(/(?<!(?:bool|,)\s*(?:success|\w+)\s*=\s*)(\w+)\.(?:call|delegatecall)\s*\(/g);

    for (const callMatch of uncheckedCalls) {
      vulnerabilities.push({
        type: 'Unchecked External Call Return Value',
        severity: 'Medium',
        contracts: [contract.name],
        description: `External call in ${contract.name} does not check return value`,
        location: contract.name,
        recommendation: 'Always check return values of external calls using require(success, "Call failed").',
        dataFlow: `External call may silently fail without reverting`
      });
    }
  });

  return vulnerabilities;
}

// Helper functions
function checkStateChangeAfterExternalCall(contractCode: string): boolean {
  // Simple heuristic: check if there are state variable assignments after .call
  const callPattern = /\.call\s*\([^)]*\)[^;]*;/g;
  const assignmentPattern = /\w+\s*=\s*[^;]+;/g;

  const calls = contractCode.match(callPattern);
  const assignments = contractCode.match(assignmentPattern);

  if (!calls || !assignments) return false;

  // Check if any assignment comes after any call (simple position-based check)
  const lastCallIndex = contractCode.lastIndexOf(calls[calls.length - 1]);
  const hasAssignmentAfter = assignments.some(assignment =>
    contractCode.indexOf(assignment) > lastCallIndex
  );

  return hasAssignmentAfter;
}

function extractStorageVariables(contractCode: string): string[] {
  const variables: string[] = [];
  const varMatches = contractCode.matchAll(/(?:public|private|internal|)\s+([\w\[\]]+)\s+(\w+)\s*;/g);

  for (const match of varMatches) {
    variables.push(`${match[1]} ${match[2]}`);
  }

  return variables;
}

function checkStorageLayoutMismatch(proxyStorage: string[], implStorage: string[]): boolean {
  // Simple check: if lengths differ or first few variables don't match
  if (proxyStorage.length !== implStorage.length) return true;

  for (let i = 0; i < Math.min(3, proxyStorage.length); i++) {
    if (proxyStorage[i] !== implStorage[i]) return true;
  }

  return false;
}

function extractFunctionBody(contractCode: string, functionName: string): string {
  const functionRegex = new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)[^{]*\\{([^}]*)\\}`, 's');
  const match = contractCode.match(functionRegex);
  return match ? match[1] : '';
}

function detectCyclicDependencies(graph: DependencyGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const outgoingEdges = graph.edges.filter(e => e.from === nodeId);

    for (const edge of outgoingEdges) {
      if (!visited.has(edge.to)) {
        dfs(edge.to, [...path]);
      } else if (recursionStack.has(edge.to)) {
        // Found a cycle
        const cycleStart = path.indexOf(edge.to);
        cycles.push([...path.slice(cycleStart), edge.to]);
      }
    }

    recursionStack.delete(nodeId);
  }

  graph.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  });

  return cycles;
}

function identifyCriticalContracts(graph: DependencyGraph): string[] {
  const criticalContracts: string[] = [];

  graph.nodes.forEach(node => {
    // Count incoming and outgoing edges
    const incomingCount = graph.edges.filter(e => e.to === node.id).length;
    const outgoingCount = graph.edges.filter(e => e.from === node.id).length;

    // Contracts with many dependencies are critical
    if (incomingCount + outgoingCount > 3) {
      criticalContracts.push(node.name);
    }

    // Proxy contracts are critical
    if (node.isProxy) {
      criticalContracts.push(node.name);
    }

    // Contracts with delegatecall edges are critical
    const hasDelegatecall = graph.edges.some(e =>
      (e.from === node.id || e.to === node.id) && e.type === 'delegatecall'
    );
    if (hasDelegatecall) {
      criticalContracts.push(node.name);
    }
  });

  return [...new Set(criticalContracts)];
}

// Detect read-only reentrancy across contracts
function detectReadOnlyReentrancy(
  contracts: ContractFile[],
  graph: DependencyGraph
): CrossContractVulnerability[] {
  const vulnerabilities: CrossContractVulnerability[] = [];

  contracts.forEach(contract => {
    const content = contract.content;
    
    // Look for view/pure functions that make external calls
    // Use better regex to handle nested braces
    const viewFunctionPattern = /function\s+(\w+)\s*\([^)]*\)\s+(?:public|external)\s+view[^{]*\{/g;
    const matches = content.matchAll(viewFunctionPattern);

    for (const match of matches) {
      const functionName = match[1];
      const startIdx = match.index! + match[0].length;
      
      // Extract function body properly by counting braces
      let braceCount = 1;
      let endIdx = startIdx;
      while (braceCount > 0 && endIdx < content.length) {
        if (content[endIdx] === '{') braceCount++;
        if (content[endIdx] === '}') braceCount--;
        endIdx++;
      }
      const functionBody = content.substring(startIdx, endIdx - 1);

      // Check if view function calls other contracts (more specific pattern)
      // Look for actual external contract calls, not just any function call
      if (/[A-Z]\w+\([^)]*\)\.\w+\s*\(|\w+\.\w+\s*\{/.test(functionBody)) {
        vulnerabilities.push({
          type: 'Read-Only Reentrancy',
          severity: 'High',
          contracts: [contract.name],
          description: `View function ${functionName} makes external calls that could be exploited for read-only reentrancy`,
          location: `${contract.name}::${functionName}`,
          recommendation: 'Use reentrancy guards even for view functions that call external contracts. Consider caching values or using mutex locks.',
          dataFlow: `${functionName} (view) -> external contract -> potential inconsistent state reads`
        });
      }
    }
  });

  return vulnerabilities;
}

// Detect flash loan attack vectors across contracts
function detectFlashLoanVectors(
  contracts: ContractFile[],
  graph: DependencyGraph
): CrossContractVulnerability[] {
  const vulnerabilities: CrossContractVulnerability[] = [];

  // Find contracts that interact with flash loan providers
  const flashLoanKeywords = ['flashLoan', 'FlashLoan', 'flash', 'borrow'];
  const oracleKeywords = ['oracle', 'price', 'getPrice', 'latestAnswer', 'TWAP'];

  contracts.forEach(contract => {
    const content = contract.content;
    const hasFlashLoan = flashLoanKeywords.some(keyword => content.includes(keyword));
    const hasOracle = oracleKeywords.some(keyword => content.includes(keyword));

    if (hasFlashLoan && hasOracle) {
      // Check for state-changing operations that depend on oracle prices
      const hasStateChange = /balances?\s*\[|totalSupply|reserve|liquidity/.test(content);
      
      if (hasStateChange) {
        vulnerabilities.push({
          type: 'Flash Loan Oracle Manipulation Vector',
          severity: 'Critical',
          contracts: [contract.name],
          description: `Contract ${contract.name} uses flash loans and oracles together, enabling potential price manipulation attacks`,
          location: contract.name,
          recommendation: 'Use TWAP oracles with sufficient time windows. Implement transaction value limits. Add reentrancy guards. Consider using Chainlink price feeds.',
          dataFlow: 'Flash loan -> Price manipulation -> Oracle read -> State change -> Profit extraction'
        });
      }
    }

    // Check for flash loan callbacks without proper validation
    if (/function\s+onFlashLoan|executeOperation|receiveFlashLoan/.test(content)) {
      const hasValidation = /require.*msg\.sender|onlyOwner|authorized/.test(content);
      
      if (!hasValidation) {
        vulnerabilities.push({
          type: 'Unprotected Flash Loan Callback',
          severity: 'Critical',
          contracts: [contract.name],
          description: `Flash loan callback in ${contract.name} lacks proper validation`,
          location: contract.name,
          recommendation: 'Validate the flash loan initiator. Ensure callback can only be called by trusted flash loan providers. Add proper access controls.',
          dataFlow: 'Attacker -> Flash loan provider -> Callback without validation -> Exploit'
        });
      }
    }
  });

  return vulnerabilities;
}

// Detect cross-protocol composability exploits
function detectComposabilityExploits(
  contracts: ContractFile[],
  graph: DependencyGraph
): CrossContractVulnerability[] {
  const vulnerabilities: CrossContractVulnerability[] = [];

  // Find contracts that interact with multiple external protocols
  contracts.forEach(contract => {
    const content = contract.content;
    
    // Check for interactions with DEXes, lending protocols, etc.
    const protocolPatterns = [
      { name: 'Uniswap', pattern: /Uniswap|IUniswapV[23]|swap/ },
      { name: 'Aave', pattern: /Aave|ILendingPool|aToken/ },
      { name: 'Compound', pattern: /Compound|cToken|comptroller/ },
      { name: 'Curve', pattern: /Curve|StableSwap/ },
      { name: 'Balancer', pattern: /Balancer|IVault|BPool/ }
    ];

    const usedProtocols = protocolPatterns.filter(p => p.pattern.test(content));

    if (usedProtocols.length >= 2) {
      // Check for atomic operations across protocols
      const hasAtomicOps = /\.call|\.delegatecall/.test(content);
      
      if (hasAtomicOps) {
        vulnerabilities.push({
          type: 'Cross-Protocol Composability Risk',
          severity: 'High',
          contracts: [contract.name],
          description: `Contract ${contract.name} atomically composes ${usedProtocols.map(p => p.name).join(', ')} which may enable complex exploit vectors`,
          location: contract.name,
          recommendation: 'Validate assumptions at each protocol boundary. Add slippage protection. Implement circuit breakers. Test for sandwich attacks and MEV exploitation.',
          dataFlow: `${usedProtocols.map(p => p.name).join(' -> ')} -> Potential arbitrage/manipulation`
        });
      }
    }
  });

  return vulnerabilities;
}

// Detect oracle manipulation opportunities across contracts
function detectOracleManipulation(
  contracts: ContractFile[],
  graph: DependencyGraph
): CrossContractVulnerability[] {
  const vulnerabilities: CrossContractVulnerability[] = [];

  contracts.forEach(contract => {
    const content = contract.content;

    // Check for single-source oracle usage
    const oracleCallPattern = /\.getPrice|\.latestAnswer|\.latestRoundData|price\s*\(/g;
    const oracleCalls = content.match(oracleCallPattern);

    if (oracleCalls && oracleCalls.length > 0) {
      // Check if TWAP or multi-oracle is used
      const hasTWAP = /TWAP|timeWeighted|observe|consult/.test(content);
      const hasMultiOracle = /oracle.*oracle|chainlink.*uniswap/i.test(content);

      if (!hasTWAP && !hasMultiOracle) {
        vulnerabilities.push({
          type: 'Single Oracle Dependency',
          severity: 'High',
          contracts: [contract.name],
          description: `Contract ${contract.name} relies on a single oracle source without TWAP protection`,
          location: contract.name,
          recommendation: 'Use TWAP oracles with sufficient time windows (15-30 minutes). Implement multi-oracle validation. Add circuit breakers for extreme price movements.',
          dataFlow: 'Single oracle -> Flash loan manipulation -> Incorrect pricing -> Fund loss'
        });
      }

      // Check for spot price usage in critical operations
      if (/swap|mint|burn|liquidate/.test(content) && /\.balanceOf|\.reserves/.test(content)) {
        vulnerabilities.push({
          type: 'Spot Price Manipulation Risk',
          severity: 'Critical',
          contracts: [contract.name],
          description: `Contract ${contract.name} may use spot prices from AMM pools for critical operations`,
          location: contract.name,
          recommendation: 'Never use spot prices from AMM pools directly. Use TWAP with minimum time window. Implement price deviation checks.',
          dataFlow: 'AMM pool balance -> Spot price calculation -> Critical operation -> Manipulation profit'
        });
      }
    }
  });

  return vulnerabilities;
}

// Detect governance attack vectors across contracts
function detectGovernanceAttacks(
  contracts: ContractFile[],
  graph: DependencyGraph
): CrossContractVulnerability[] {
  const vulnerabilities: CrossContractVulnerability[] = [];

  contracts.forEach(contract => {
    const content = contract.content;

    // Check for voting mechanisms
    const hasVoting = /vote|proposal|governance|delegate/i.test(content);
    
    if (hasVoting) {
      // Check for flash loan usage with voting
      const hasFlashLoan = /flashLoan|borrow|flash/.test(content);
      
      if (hasFlashLoan) {
        vulnerabilities.push({
          type: 'Flash Loan Governance Attack',
          severity: 'Critical',
          contracts: [contract.name],
          description: `Contract ${contract.name} governance mechanism may be vulnerable to flash loan attacks`,
          location: contract.name,
          recommendation: 'Implement voting delays and time locks. Use snapshot-based voting. Require minimum holding period before voting. Add proposal execution delays.',
          dataFlow: 'Flash loan -> Acquire voting power -> Pass malicious proposal -> Execute -> Repay loan'
        });
      }

      // Check for timelock on governance actions
      const hasTimelock = /timelock|delay|waitPeriod/i.test(content);
      
      if (!hasTimelock) {
        vulnerabilities.push({
          type: 'Missing Governance Timelock',
          severity: 'High',
          contracts: [contract.name],
          description: `Governance in ${contract.name} lacks timelock protection`,
          location: contract.name,
          recommendation: 'Add timelock delays to all governance actions. Implement multi-sig requirements for critical operations. Use proposal queuing system.',
          dataFlow: 'Malicious proposal -> Immediate execution -> No time for community response'
        });
      }

      // Check for delegation without safeguards
      if (/delegate\s*\(/.test(content)) {
        const hasDelegationSafeguards = /delegateBySig|nonce|deadline/.test(content);
        
        if (!hasDelegationSafeguards) {
          vulnerabilities.push({
            type: 'Unsafe Delegation Mechanism',
            severity: 'Medium',
            contracts: [contract.name],
            description: `Delegation in ${contract.name} may lack replay protection`,
            location: contract.name,
            recommendation: 'Use EIP-712 signatures with nonces and deadlines. Implement delegation limits. Add delegation cooldown periods.',
            dataFlow: 'Delegation -> Potential replay or manipulation -> Governance takeover'
          });
        }
      }
    }
  });

  return vulnerabilities;
}


// Primitive types to exclude from type resolution
const PRIMITIVE_TYPES = ['uint256', 'uint', 'address', 'bool', 'bytes32', 'bytes'];

/**
 * NEW: Extract variable types from contract code for improved call resolution
 */
function extractVariableTypes(contractCode: string): Map<string, string> {
  const typeMap = new Map<string, string>();

  // Pattern 1: State variable declarations with contract types
  // e.g., "IERC20 public token;" or "IUniswapV2Router private router;"
  const stateVarPattern = /(?:public|private|internal)\s+([A-Z]\w+)\s+(\w+)\s*[;=]/g;
  let match;
  
  while ((match = stateVarPattern.exec(contractCode)) !== null) {
    const type = match[1];
    const varName = match[2];
    // Filter out primitive types
    if (type && varName && !PRIMITIVE_TYPES.includes(type)) {
      typeMap.set(varName, type);
    }
  }

  // Pattern 2: Local variable declarations with explicit casting
  // e.g., "IERC20 token = IERC20(address);"
  const localVarPattern = /([A-Z]\w+)\s+(\w+)\s*=\s*[A-Z]\w+\(/g;
  
  while ((match = localVarPattern.exec(contractCode)) !== null) {
    const type = match[1];
    const varName = match[2];
    if (type && varName && !PRIMITIVE_TYPES.includes(type)) {
      typeMap.set(varName, type);
    }
  }

  // Pattern 3: Function parameters with contract types
  // e.g., "function swap(IERC20 tokenIn, uint256 amount)"
  const paramPattern = /function\s+\w+\s*\([^)]*?([A-Z]\w+)\s+(\w+)[^)]*\)/g;
  
  while ((match = paramPattern.exec(contractCode)) !== null) {
    const type = match[1];
    const varName = match[2];
    if (type && varName && !PRIMITIVE_TYPES.includes(type)) {
      typeMap.set(varName, type);
    }
  }

  return typeMap;
}

/**
 * NEW: Find contract by type name (interface/contract name)
 */
function findContractByType(typeName: string, contracts: ContractFile[]): ContractFile | undefined {
  return contracts.find(c =>
    // Exact match
    c.name === typeName ||
    // Content contains interface or contract with this name
    c.content.includes(`interface ${typeName}`) ||
    c.content.includes(`contract ${typeName}`) ||
    // Contract name includes the type (e.g., ERC20 matches IERC20)
    c.name.includes(typeName) ||
    typeName.includes(c.name)
  );
}

