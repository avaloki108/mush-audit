/**
 * Test script for enhanced audit modules
 * Tests the new cross-contract flow analysis, type resolution, 
 * Wormhole detection, signature replay detection, and garbage filtering
 */

// Test contract samples
const testContracts = {
  // Contract with cross-contract reentrancy
  vulnerableVault: `
    pragma solidity ^0.8.0;
    
    import "./IERC20.sol";
    
    contract VulnerableVault {
        IERC20 public token;
        mapping(address => uint256) public balances;
        
        function withdraw(uint256 amount) external {
            // External call before state update (vulnerable!)
            token.transfer(msg.sender, amount);
            balances[msg.sender] -= amount; // State change after call
        }
    }
  `,
  
  // ERC20 token interface
  ierc20: `
    pragma solidity ^0.8.0;
    
    interface IERC20 {
        function transfer(address to, uint256 amount) external returns (bool);
        function balanceOf(address account) external view returns (uint256);
    }
  `,
  
  // Wormhole bridge vulnerability
  wormholeBridge: `
    pragma solidity ^0.8.0;
    
    contract WormholeBridge {
        IWormhole public wormhole;
        
        function processMessage(bytes memory encodedVM) external {
            (IWormhole.VM memory vm, bool valid, string memory reason) = wormhole.parseAndVerifyVM(encodedVM);
            
            // Missing: Guardian signature verification!
            // Missing: Sequence number tracking!
            
            executeAction(vm.payload);
        }
        
        function executeAction(bytes memory payload) internal {
            // Process without validation
        }
    }
  `,
  
  // Signature replay vulnerability
  signatureReplay: `
    pragma solidity ^0.8.0;
    
    contract MetaTransaction {
        function executeWithSignature(
            address target,
            bytes calldata data,
            bytes calldata signature
        ) external {
            bytes32 messageHash = keccak256(abi.encodePacked(target, data));
            // Missing: nonce
            // Missing: chainId
            // Missing: deadline
            
            address signer = recoverSigner(messageHash, signature);
            require(signer == owner, "Invalid signer");
            
            (bool success,) = target.call(data);
        }
    }
  `,
  
  // Garbage findings (should be filtered out)
  garbageFinding: {
    title: 'Gas Optimization: Use ++i instead of i++ in loops',
    severity: 'Low',
    description: 'Using ++i is more gas efficient than i++ in for loops',
    impact: 'Can save approximately 5 gas per iteration',
    location: 'Contract.sol line 45',
    recommendation: 'Change i++ to ++i in all loops',
    // No economic impact, no PoC, no exploit scenario
  },
  
  // Real finding (should NOT be filtered)
  realFinding: {
    title: 'Cross-Contract Reentrancy',
    severity: 'High',
    description: 'Contract makes external call before updating state',
    impact: 'Attacker can drain all funds through reentrancy',
    location: 'VulnerableVault.sol::withdraw',
    recommendation: 'Follow checks-effects-interactions pattern',
    economicImpact: 'Complete fund drainage possible',
    exploitScenario: 'Attacker calls withdraw, reenters during transfer, drains contract',
    pocCode: `
      contract Attacker {
          function attack() external {
              vault.withdraw(balance);
          }
          
          receive() external payable {
              vault.withdraw(balance); // Reenter!
          }
      }
    `
  }
};

// Import the modules
import { StateFlowAnalyzer } from './src/services/audit/modules/stateFlowAnalysis.ts';
import { mapContractDependencies } from './src/services/audit/modules/dependencyMapping.ts';
import { crossChainAnalyzer } from './src/services/audit/modules/crossChainAnalysis.ts';
import { EnhancedReportGenerator } from './src/services/audit/enhancedReportGenerator.ts';

console.log('=== Testing Enhanced Audit Modules ===\n');

// Test 1: State Flow Analysis with Cross-Contract Flows
console.log('1. Testing Cross-Contract Flow Analysis...');
const contracts = [
  { name: 'VulnerableVault', path: './VulnerableVault.sol', content: testContracts.vulnerableVault },
  { name: 'IERC20', path: './IERC20.sol', content: testContracts.ierc20 }
];

try {
  const analyzer = new StateFlowAnalyzer(contracts);
  const result = analyzer.analyzeStateFlow();
  
  console.log(`✓ Found ${result.crossContractFlows.length} cross-contract flows`);
  console.log(`✓ Detected ${result.potentialIssues.filter(i => i.type === 'Cross-Contract Reentrancy').length} cross-contract reentrancy issues`);
  
  if (result.crossContractFlows.length > 0) {
    console.log(`  Example flow: ${result.crossContractFlows[0].description}`);
    console.log(`  Risk level: ${result.crossContractFlows[0].reentrancyRisk}`);
  }
} catch (error) {
  console.log(`✗ Error: ${error.message}`);
}
console.log();

// Test 2: Dependency Mapping with Type Resolution
console.log('2. Testing Variable Type Resolution...');
try {
  const depGraph = mapContractDependencies(contracts);
  console.log(`✓ Analyzed ${depGraph.nodes.length} contracts`);
  console.log(`✓ Found ${depGraph.edges.length} dependencies`);
  
  const typeResolvedEdges = depGraph.edges.filter(e => 
    e.description && e.description.includes('IERC20')
  );
  console.log(`✓ Resolved ${typeResolvedEdges.length} edges with type information`);
} catch (error) {
  console.log(`✗ Error: ${error.message}`);
}
console.log();

// Test 3: Wormhole Vulnerability Detection
console.log('3. Testing Wormhole Vulnerability Detection...');
try {
  const wormholeFindings = crossChainAnalyzer.detectWormholeVulnerabilities(testContracts.wormholeBridge);
  console.log(`✓ Found ${wormholeFindings.length} Wormhole vulnerabilities`);
  
  wormholeFindings.forEach(finding => {
    console.log(`  - ${finding.title} (${finding.severity})`);
  });
} catch (error) {
  console.log(`✗ Error: ${error.message}`);
}
console.log();

// Test 4: Signature Replay Detection
console.log('4. Testing Signature Replay Detection...');
try {
  const signatureFindings = crossChainAnalyzer.detectSignatureReplay(testContracts.signatureReplay);
  console.log(`✓ Found ${signatureFindings.length} signature replay vulnerabilities`);
  
  signatureFindings.forEach(finding => {
    console.log(`  - ${finding.title} (${finding.severity})`);
  });
} catch (error) {
  console.log(`✗ Error: ${error.message}`);
}
console.log();

// Test 5: Garbage Filtering
console.log('5. Testing Garbage Finding Filter...');
try {
  const generator = new EnhancedReportGenerator();
  const allFindings = [testContracts.garbageFinding, testContracts.realFinding];
  
  const filtered = generator.filterGarbageFindings(allFindings);
  
  console.log(`✓ Input: ${allFindings.length} findings`);
  console.log(`✓ Output: ${filtered.length} findings (filtered ${allFindings.length - filtered.length})`);
  
  if (filtered.length > 0 && filtered[0].title.includes('Reentrancy')) {
    console.log(`✓ Correctly kept real security issue: ${filtered[0].title}`);
  }
  
  if (!filtered.some(f => f.title.includes('Gas Optimization'))) {
    console.log(`✓ Correctly filtered out gas optimization`);
  }
} catch (error) {
  console.log(`✗ Error: ${error.message}`);
}
console.log();

console.log('=== All Tests Complete ===');
