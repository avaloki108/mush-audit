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

function analyzeContractDependencies(contract: ContractFile, allContracts: ContractFile[]): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  const content = contract.content;

  // Detect Calls to Specific Contracts
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

  // Detect Untrusted External Calls (The "Phishing" Vector)
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

// --- Metrics Helpers ---
function detectCyclicDependencies(graph: DependencyGraph): string[][] { return []; } // Placeholder
function identifyCriticalContracts(graph: DependencyGraph): string[] { return []; } // Placeholder
