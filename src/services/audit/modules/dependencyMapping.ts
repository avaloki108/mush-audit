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
  accessControl: AccessControlMap; // New: Maps who can call what
}

export interface AccessControlMap {
  [contractName: string]: {
    [functionName: string]: string[]; // List of roles/modifiers (e.g. ['onlyOwner', 'onlyVault'])
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
  isUntrusted?: boolean; // New: Flags calls to user-provided addresses
}

export interface CrossContractVulnerability {
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
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
    },
    accessControl: {}
  };

  // 1. Parse Contracts & Build Nodes
  contracts.forEach(contract => {
    graph.nodes.push(parseContractNode(contract));
    graph.accessControl[contract.name] = parseAccessControl(contract);
  });

  // 2. Analyze Edges (Dependencies)
  contracts.forEach(contract => {
    const edges = analyzeContractDependencies(contract, contracts);
    graph.edges.push(...edges);
  });

  // 3. Deep Vulnerability Analysis
  graph.vulnerabilities = detectDeepVulnerabilities(contracts, graph);

  // 4. Calculate Metrics
  graph.metrics.totalDependencies = graph.edges.length;
  graph.metrics.cyclicDependencies = detectCyclicDependencies(graph);
  graph.metrics.criticalContracts = identifyCriticalContracts(graph);

  return graph;
}

// --- Parser Helpers ---

function parseContractNode(contract: ContractFile): ContractNode {
  const content = contract.content;
  const nameMatch = content.match(/(?:contract|library|interface)\s+(\w+)/);
  const name = nameMatch ? nameMatch[1] : contract.name;
  
  return {
    id: contract.path,
    name,
    type: content.includes('library ') ? 'library' : content.includes('interface ') ? 'interface' : 'contract',
    functions: (content.match(/function\s+(\w+)/g) || []).map(f => f.replace('function ', '')),
    stateVariables: [], // Simplified for brevity
    modifiers: (content.match(/modifier\s+(\w+)/g) || []).map(m => m.replace('modifier ', '')),
    isProxy: /delegatecall|fallback|receive/.test(content) && /implementation|target/.test(content),
    isUpgradeable: /Initializable|UUPS|Upgradeable/.test(content),
    inherits: []
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

  // 3. Detect Calls to Specific Contracts by name
  allContracts.forEach(target => {
    if (contract.name === target.name) return;
    
    // Regex to find "TargetName(address).func()" or "ITargetName(address).func()"
    const explicitCallRegex = new RegExp(`\\b${target.name}\\b`, 'i');
    if (explicitCallRegex.test(content)) {
        // Check type of interaction
        if (/delegatecall/.test(content)) {
             edges.push({ from: contract.path, to: target.path, type: 'delegatecall', functions: [], riskLevel: 'critical', description: 'Delegatecall Storage Risk' });
        } else if (/\.call/.test(content)) {
             edges.push({ from: contract.path, to: target.path, type: 'call', functions: [], riskLevel: 'medium' });
        }
    }
  });

  // 4. Detect Untrusted External Calls (The "Phishing" Vector)
  // Looking for: userParams.call() or msg.sender.call()
  if (/(msg\.sender|tx\.origin|_[\w]+)\.(call|transfer|send)/.test(content)) {
    edges.push({
      from: contract.path,
      to: 'Untrusted External',
      type: 'call',
      functions: ['fallback'],
      riskLevel: 'high',
      description: 'Calls address controlled by user input or msg.sender',
      isUntrusted: true
    });
  }

  return edges;
}

function parseAccessControl(contract: ContractFile): AccessControlMap['string'] {
  const accessMap: AccessControlMap['string'] = {};
  const functionRegex = /function\s+(\w+)[^{]+(only\w+|auth|guard|nonReentrant)/g;
  let match;
  while ((match = functionRegex.exec(contract.content)) !== null) {
    const func = match[1];
    const mod = match[2];
    if (!accessMap[func]) accessMap[func] = [];
    accessMap[func].push(mod);
  }
  return accessMap;
}

// --- Vulnerability Detectors ---

function detectDeepVulnerabilities(contracts: ContractFile[], graph: DependencyGraph): CrossContractVulnerability[] {
  const vulns: CrossContractVulnerability[] = [];

  // 1. Privilege Escalation via DelegateCall
  // If a contract delegatecalls to an address that is NOT constant/immutable, it's critical.
  contracts.forEach(c => {
    if (/\.delegatecall/.test(c.content)) {
      const isConstTarget = /private\s+constant|internal\s+constant|immutable/.test(c.content);
      if (!isConstTarget) {
        vulns.push({
          type: 'Arbitrary Delegatecall (Privilege Escalation)',
          severity: 'Critical',
          contracts: [c.name],
          description: 'Contract uses delegatecall to a non-constant address. If this address can be manipulated, an attacker can destroy the contract or steal funds.',
          location: c.path,
          recommendation: 'Hardcode the implementation address or use a trusted Proxy pattern (OpenZeppelin).'
        });
      }
    }
  });

  // 2. Cross-Contract Reentrancy (Untrusted Call -> State Change)
  graph.edges.filter(e => e.isUntrusted).forEach(edge => {
    const contract = contracts.find(c => c.path === edge.from);
    if (!contract) return;

    // Check if state changes happen AFTER the untrusted call
    // Simplified heuristic: index of ".call" < index of "=" (assignment)
    const callIdx = contract.content.indexOf('.call');
    const assignIdx = contract.content.lastIndexOf('=');
    
    if (callIdx !== -1 && assignIdx > callIdx) {
       vulns.push({
          type: 'Cross-Contract Reentrancy (CEI Violation)',
          severity: 'High',
          contracts: [contract.name],
          description: 'Contract makes an untrusted external call before finishing state updates. This violates Checks-Effects-Interactions.',
          location: contract.path,
          recommendation: 'Move all state updates before the external call, or add a nonReentrant modifier.',
          dataFlow: 'State Update -> Untrusted Call -> Reentry'
       });
    }
  });

  return vulns;
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

/**
 * Find contract by variable name
 */
function findContractByName(varName: string, contracts: ContractFile[]): ContractFile | undefined {
  return contracts.find(c =>
    // Exact match
    c.name === varName ||
    // Case-insensitive match
    c.name.toLowerCase() === varName.toLowerCase() ||
    // Content contains the variable
    c.content.includes(varName)
  );
}

// --- Metrics Helpers ---
function detectCyclicDependencies(graph: DependencyGraph): string[][] {
  return [];
} // Placeholder

function identifyCriticalContracts(graph: DependencyGraph): string[] {
  return [];
} // Placeholder

