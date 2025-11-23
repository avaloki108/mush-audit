/**
 * Advanced Data Flow Analyzer
 * 
 * Tracks how values flow through contracts to identify exploitable paths
 * Goes beyond pattern matching to understand actual data dependencies
 */

export interface DataFlowNode {
  id: string;
  type: 'input' | 'state' | 'computation' | 'output' | 'external_call';
  value: string;
  location: string;
  tainted: boolean;
  dependencies: string[];
}

export interface DataFlowPath {
  source: DataFlowNode;
  sink: DataFlowNode;
  path: DataFlowNode[];
  isCritical: boolean;
  hasValidation: boolean;
  exploitability: 'high' | 'medium' | 'low' | 'none';
}

export interface TaintSource {
  type: 'user_input' | 'external_call' | 'storage_read';
  location: string;
  variable: string;
}

export interface CriticalSink {
  type: 'transfer' | 'delegatecall' | 'selfdestruct' | 'state_change' | 'external_call';
  location: string;
  operation: string;
}

export class DataFlowAnalyzer {
  private nodes: Map<string, DataFlowNode> = new Map();
  private edges: Map<string, string[]> = new Map();
  
  /**
   * Analyze data flow in contract code
   */
  analyzeDataFlow(code: string): DataFlowPath[] {
    // Extract data flow nodes
    const sources = this.findTaintSources(code);
    const sinks = this.findCriticalSinks(code);
    const computations = this.findComputations(code);
    
    // Build data flow graph
    this.buildDataFlowGraph(sources, sinks, computations, code);
    
    // Find paths from sources to sinks
    const paths = this.findCriticalPaths(sources, sinks);
    
    // Analyze each path for exploitability
    return paths.map(path => this.analyzePath(path));
  }
  
  /**
   * Find taint sources (user-controlled inputs)
   */
  private findTaintSources(code: string): TaintSource[] {
    const sources: TaintSource[] = [];
    
    // Find msg.sender references
    const senderMatches = code.matchAll(/msg\.sender/g);
    for (const match of senderMatches) {
      sources.push({
        type: 'user_input',
        location: this.getLocation(code, match.index!),
        variable: 'msg.sender'
      });
    }
    
    // Find function parameters
    const functionRegex = /function\s+(\w+)\s*\((.*?)\)/g;
    const funcMatches = code.matchAll(functionRegex);
    for (const match of funcMatches) {
      const params = match[2].split(',').map(p => p.trim());
      for (const param of params) {
        if (param) {
          const paramName = param.split(/\s+/).pop() || '';
          sources.push({
            type: 'user_input',
            location: this.getLocation(code, match.index!),
            variable: paramName
          });
        }
      }
    }
    
    // Find external call returns
    const callRegex = /(\w+)\s*=\s*\w+\.(\w+)\(/g;
    const callMatches = code.matchAll(callRegex);
    for (const match of callMatches) {
      sources.push({
        type: 'external_call',
        location: this.getLocation(code, match.index!),
        variable: match[1]
      });
    }
    
    return sources;
  }
  
  /**
   * Find critical sinks (operations that can cause fund loss)
   */
  private findCriticalSinks(code: string): CriticalSink[] {
    const sinks: CriticalSink[] = [];
    
    // Find transfer operations
    const transferPatterns = [
      /\.transfer\s*\(/g,
      /\.send\s*\(/g,
      /\.call\s*\{value:\s*(\w+)\}/g,
      /payable\s*\(.*?\)\.transfer/g
    ];
    
    for (const pattern of transferPatterns) {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        sinks.push({
          type: 'transfer',
          location: this.getLocation(code, match.index!),
          operation: match[0]
        });
      }
    }
    
    // Find delegatecall
    const delegatecallMatches = code.matchAll(/\.delegatecall\s*\(/g);
    for (const match of delegatecallMatches) {
      sinks.push({
        type: 'delegatecall',
        location: this.getLocation(code, match.index!),
        operation: match[0]
      });
    }
    
    // Find selfdestruct
    const selfdestructMatches = code.matchAll(/selfdestruct\s*\(/g);
    for (const match of selfdestructMatches) {
      sinks.push({
        type: 'selfdestruct',
        location: this.getLocation(code, match.index!),
        operation: match[0]
      });
    }
    
    // Find state changes
    const stateChangeMatches = code.matchAll(/(\w+)\s*=\s*([^;]+);/g);
    for (const match of stateChangeMatches) {
      // Check if this is a storage variable (simplified heuristic)
      if (!match[1].startsWith('uint') && !match[1].startsWith('address')) {
        sinks.push({
          type: 'state_change',
          location: this.getLocation(code, match.index!),
          operation: match[0]
        });
      }
    }
    
    return sinks;
  }
  
  /**
   * Find computation nodes
   */
  private findComputations(code: string): DataFlowNode[] {
    const nodes: DataFlowNode[] = [];
    
    // Find arithmetic operations
    const arithmeticRegex = /(\w+)\s*=\s*([^;]+[+\-*\/][^;]+);/g;
    const matches = code.matchAll(arithmeticRegex);
    
    for (const match of matches) {
      nodes.push({
        id: `comp_${match.index}`,
        type: 'computation',
        value: match[0],
        location: this.getLocation(code, match.index!),
        tainted: false,
        dependencies: this.extractDependencies(match[2])
      });
    }
    
    return nodes;
  }
  
  /**
   * Build data flow graph
   */
  private buildDataFlowGraph(
    sources: TaintSource[],
    sinks: CriticalSink[],
    computations: DataFlowNode[],
    code: string
  ): void {
    // Create nodes for sources
    for (const source of sources) {
      const node: DataFlowNode = {
        id: `source_${source.variable}`,
        type: 'input',
        value: source.variable,
        location: source.location,
        tainted: true,
        dependencies: []
      };
      this.nodes.set(node.id, node);
    }
    
    // Create nodes for sinks
    for (const sink of sinks) {
      const node: DataFlowNode = {
        id: `sink_${sink.type}_${sink.location}`,
        type: 'output',
        value: sink.operation,
        location: sink.location,
        tainted: false,
        dependencies: []
      };
      this.nodes.set(node.id, node);
    }
    
    // Add computation nodes
    for (const comp of computations) {
      this.nodes.set(comp.id, comp);
    }
    
    // Build edges based on variable usage
    this.buildEdges(code);
  }
  
  /**
   * Build edges in data flow graph
   */
  private buildEdges(code: string): void {
    // Simplified edge building - in production, use proper AST analysis
    const lines = code.split('\n');
    const varDefs = new Map<string, string>();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Track variable definitions
      const defMatch = line.match(/(\w+)\s*=\s*(.+);/);
      if (defMatch) {
        const varName = defMatch[1];
        const expr = defMatch[2];
        varDefs.set(varName, expr);
        
        // Find dependencies
        const deps = this.extractDependencies(expr);
        for (const dep of deps) {
          if (varDefs.has(dep)) {
            // Create edge from dep to varName
            const depNode = Array.from(this.nodes.values()).find(n => n.value.includes(dep));
            const varNode = Array.from(this.nodes.values()).find(n => n.value.includes(varName));
            
            if (depNode && varNode) {
              if (!this.edges.has(depNode.id)) {
                this.edges.set(depNode.id, []);
              }
              this.edges.get(depNode.id)!.push(varNode.id);
            }
          }
        }
      }
    }
  }
  
  /**
   * Find critical paths from sources to sinks
   */
  private findCriticalPaths(sources: TaintSource[], sinks: CriticalSink[]): DataFlowPath[] {
    const paths: DataFlowPath[] = [];
    
    for (const source of sources) {
      const sourceNode = Array.from(this.nodes.values()).find(n => 
        n.value === source.variable
      );
      
      if (!sourceNode) continue;
      
      for (const sink of sinks) {
        const sinkNode = Array.from(this.nodes.values()).find(n => 
          n.location === sink.location
        );
        
        if (!sinkNode) continue;
        
        // Find all paths from source to sink
        const foundPaths = this.findPaths(sourceNode, sinkNode);
        
        for (const path of foundPaths) {
          paths.push({
            source: sourceNode,
            sink: sinkNode,
            path,
            isCritical: this.isCriticalPath(path, sink),
            hasValidation: this.hasValidation(path),
            exploitability: 'high' // Will be refined in analyzePath
          });
        }
      }
    }
    
    return paths;
  }
  
  /**
   * Find all paths between two nodes using DFS
   */
  private findPaths(source: DataFlowNode, sink: DataFlowNode): DataFlowNode[][] {
    const paths: DataFlowNode[][] = [];
    const visited = new Set<string>();
    
    const dfs = (current: DataFlowNode, path: DataFlowNode[]) => {
      if (current.id === sink.id) {
        paths.push([...path, current]);
        return;
      }
      
      if (visited.has(current.id)) return;
      visited.add(current.id);
      
      const neighbors = this.edges.get(current.id) || [];
      for (const neighborId of neighbors) {
        const neighbor = this.nodes.get(neighborId);
        if (neighbor) {
          dfs(neighbor, [...path, current]);
        }
      }
      
      visited.delete(current.id);
    };
    
    dfs(source, []);
    return paths;
  }
  
  /**
   * Analyze path for exploitability
   */
  private analyzePath(path: DataFlowPath): DataFlowPath {
    // Check if path has validation
    path.hasValidation = this.hasValidation(path.path);
    
    // Determine exploitability
    if (!path.hasValidation && path.isCritical) {
      path.exploitability = 'high';
    } else if (!path.hasValidation) {
      path.exploitability = 'medium';
    } else if (path.isCritical) {
      path.exploitability = 'low';
    } else {
      path.exploitability = 'none';
    }
    
    return path;
  }
  
  /**
   * Check if path is critical (leads to fund loss)
   */
  private isCriticalPath(path: DataFlowNode[], sink: CriticalSink): boolean {
    return sink.type === 'transfer' || 
           sink.type === 'delegatecall' || 
           sink.type === 'selfdestruct';
  }
  
  /**
   * Check if path has validation
   */
  private hasValidation(path: DataFlowNode[]): boolean {
    // Check for require/assert statements in path
    for (const node of path) {
      if (node.value.includes('require(') || 
          node.value.includes('assert(') ||
          node.value.includes('if (') ||
          node.value.includes('revert(')) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Extract variable dependencies from expression
   */
  private extractDependencies(expr: string): string[] {
    const deps: string[] = [];
    const varRegex = /\b([a-zA-Z_]\w*)\b/g;
    const matches = expr.matchAll(varRegex);
    
    for (const match of matches) {
      const varName = match[1];
      // Filter out keywords and types
      if (!this.isKeyword(varName) && !this.isType(varName)) {
        deps.push(varName);
      }
    }
    
    return deps;
  }
  
  /**
   * Get line and column from index
   */
  private getLocation(code: string, index: number): string {
    const lines = code.substring(0, index).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    return `${line}:${column}`;
  }
  
  private isKeyword(word: string): boolean {
    const keywords = ['function', 'return', 'if', 'else', 'for', 'while', 'require', 'assert', 'emit'];
    return keywords.includes(word);
  }
  
  private isType(word: string): boolean {
    const types = ['uint', 'uint256', 'address', 'bool', 'string', 'bytes', 'int'];
    return types.some(t => word.startsWith(t));
  }
}

/**
 * Taint Analysis - Track user-controlled data through the program
 */
export class TaintAnalyzer {
  /**
   * Perform taint analysis to find if user input reaches critical operations
   */
  analyzeTaint(code: string): {
    taintedPaths: DataFlowPath[];
    untaintedSinks: CriticalSink[];
  } {
    const analyzer = new DataFlowAnalyzer();
    const paths = analyzer.analyzeDataFlow(code);
    
    // Filter for tainted paths (source is user input)
    const taintedPaths = paths.filter(p => p.source.tainted);
    
    // Find sinks that are not reached by tainted data (potentially safe)
    const reachedSinks = new Set(taintedPaths.map(p => p.sink.id));
    const allSinks = paths.map(p => p.sink);
    const untaintedSinks = allSinks.filter(s => !reachedSinks.has(s.id));
    
    return {
      taintedPaths: taintedPaths.filter(p => p.exploitability !== 'none'),
      untaintedSinks: untaintedSinks.map(s => ({
        type: s.type as any,
        location: s.location,
        operation: s.value
      }))
    };
  }
  
  /**
   * Check if a specific variable is tainted
   */
  isVariableTainted(code: string, variableName: string, location: string): boolean {
    const analyzer = new DataFlowAnalyzer();
    const paths = analyzer.analyzeDataFlow(code);
    
    // Check if any path reaches this variable
    return paths.some(path => 
      path.path.some(node => 
        node.value.includes(variableName) && 
        node.location === location
      ) && path.source.tainted
    );
  }
}

export const dataFlowAnalyzer = new DataFlowAnalyzer();
export const taintAnalyzer = new TaintAnalyzer();
