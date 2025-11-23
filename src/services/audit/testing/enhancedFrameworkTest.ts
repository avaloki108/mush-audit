import { contractAnalyzer } from '../contractAnalyzer';

describe('Enhanced DeFi Security Auditing Framework', () => {
  it('should detect vulnerabilities in sample contracts', async () => {
    // Create sample contract files
    const sampleContracts = [
      {
        name: 'VulnerableContract.sol',
        content: 'pragma solidity ^0.8.0; contract VulnerableContract { ... }'
      }
    ];

    // Analyze the contracts
    const analysisResults = await contractAnalyzer.analyzeContracts(sampleContracts);

    // Assert that vulnerabilities are detected
    expect(analysisResults.vulnerabilities).not.toBeUndefined();
    expect(analysisResults.vulnerabilities.length).toBeGreaterThan(0);
  });

  it('should verify mitigations for detected vulnerabilities', async () => {
    // Create sample contract files with mitigations
    const sampleContractsWithMitigations = [
      {
        name: 'MitigatedContract.sol',
        content: 'pragma solidity ^0.8.0; contract MitigatedContract { ... }'
      }
    ];

    // Analyze the contracts
    const analysisResults = await contractAnalyzer.analyzeContracts(sampleContractsWithMitigations);

    // Assert that mitigations are verified
    expect(analysisResults.mitigationVerificationResults).not.toBeUndefined();
    expect(analysisResults.mitigationVerificationResults.length).toBeGreaterThan(0);
  });
});