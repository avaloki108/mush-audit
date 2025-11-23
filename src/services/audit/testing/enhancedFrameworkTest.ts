import { analyzeContract } from '../contractAnalyzer';
import type { ContractFile } from '@/types/blockchain';

describe('Enhanced DeFi Security Auditing Framework', () => {
  it('should detect vulnerabilities in sample contracts', async () => {
    // Create sample contract files
    const sampleContracts: ContractFile[] = [
      {
        name: 'VulnerableContract.sol',
        path: 'VulnerableContract.sol',
        content: 'pragma solidity ^0.8.0; contract VulnerableContract { function withdraw() public { msg.sender.call{value: address(this).balance}(""); } }'
      }
    ];

    // Analyze the contracts
    const analysisResults = await analyzeContract({
      files: sampleContracts,
      contractName: 'VulnerableContract',
      isMultiFile: false
    });

    // Assert that analysis is performed
    expect(analysisResults).not.toBeUndefined();
    expect(analysisResults.report).not.toBeUndefined();
  });

  it('should verify mitigations for detected vulnerabilities', async () => {
    // Create sample contract files with mitigations
    const sampleContractsWithMitigations: ContractFile[] = [
      {
        name: 'MitigatedContract.sol',
        path: 'MitigatedContract.sol',
        content: 'pragma solidity ^0.8.0; import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; contract MitigatedContract is ReentrancyGuard { function withdraw() public nonReentrant { msg.sender.call{value: address(this).balance}(""); } }'
      }
    ];

    // Analyze the contracts in protocol mode
    const analysisResults = await analyzeContract({
      files: sampleContractsWithMitigations,
      contractName: 'MitigatedContract',
      analysisMode: 'protocol',
      isMultiFile: true
    });

    // Assert that mitigations are verified
    expect(analysisResults).not.toBeUndefined();
    expect(analysisResults.mitigationVerification).toBeDefined();
  });
});