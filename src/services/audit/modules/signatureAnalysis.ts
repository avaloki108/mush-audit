export interface VulnerabilityFinding {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  impact: string;
  location: string;
  recommendation: string;
  exploitScenario?: string;
  pocCode?: string;
  economicImpact?: string;
}

export interface SignatureAnalyzer {
  detectEIP712DomainSeparatorIssues(code: string): VulnerabilityFinding[];
  detectPermitReplayAttacks(code: string): VulnerabilityFinding[];
  detectERC1271SignatureMalleability(code: string): VulnerabilityFinding[];
  detectNonceManagementVulnerabilities(code: string): VulnerabilityFinding[];
  detectCrossChainSignatureReplay(code: string): VulnerabilityFinding[];
  detectMetaTransactionReplay(code: string): VulnerabilityFinding[];
  detectPermit2IntegrationFlaws(code: string): VulnerabilityFinding[];
  detectSignatureValidationBypass(code: string): VulnerabilityFinding[];
}

export class SignatureAnalyzerImpl implements SignatureAnalyzer {

  detectEIP712DomainSeparatorIssues(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for hardcoded domain separators
    if (code.includes('DOMAIN_SEPARATOR') && code.includes('0x')) {
      const domainSepRegex = /DOMAIN_SEPARATOR\s*=\s*0x[a-fA-F0-9]{64}/;
      if (domainSepRegex.test(code)) {
        findings.push({
          title: 'Hardcoded EIP-712 Domain Separator',
          severity: 'High',
          description: 'EIP-712 domain separator is hardcoded, preventing proper domain separation across different contract deployments.',
          impact: 'Signatures can be replayed across different contract instances or chains.',
          location: 'EIP-712 domain separator definition',
          recommendation: 'Use dynamic domain separator construction with contract address and chain ID.',
          exploitScenario: 'Deploy contract on testnet, get signature, replay on mainnet with same domain separator',
          economicImpact: 'Can lead to unauthorized token approvals and fund theft',
          pocCode: `
// Vulnerable: Hardcoded domain separator
bytes32 constant DOMAIN_SEPARATOR = 0x1234567890abcdef...;

// Attacker can replay signatures across deployments
function permit(address owner, address spender, uint256 amount, bytes memory signature) external {
    // Signature verification uses hardcoded separator
    // Same signature works on mainnet and testnet!
}
          `
        });
      }
    }

    // Check for missing chain ID in domain separator
    if (code.includes('DOMAIN_SEPARATOR') && !code.includes('block.chainid')) {
      findings.push({
        title: 'Missing Chain ID in Domain Separator',
        severity: 'High',
        description: 'EIP-712 domain separator construction does not include chain ID, enabling cross-chain signature replay.',
        impact: 'Signatures valid on one chain can be replayed on another chain.',
        location: 'Domain separator construction function',
        recommendation: 'Include block.chainid in domain separator to prevent cross-chain replay.',
        exploitScenario: 'Get signature on testnet, replay on mainnet',
        economicImpact: 'Cross-chain fund theft possible',
        pocCode: `
// Vulnerable: No chain ID
function domainSeparator() public view returns (bytes32) {
    return keccak256(abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256(bytes(name)),
        keccak256(bytes(version)),
        // MISSING: block.chainid
        address(this)
    ));
}
          `
      });
    }

    return findings;
  }

  detectPermitReplayAttacks(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for permit functions without proper nonce validation
    if (code.includes('permit(') && !code.includes('nonces[')) {
      findings.push({
        title: 'Permit Function Without Nonce Validation',
        severity: 'Critical',
        description: 'Permit function lacks nonce validation, allowing unlimited signature replay attacks.',
        impact: 'Single signature can be used multiple times to drain approved funds.',
        location: 'Permit function implementation',
        recommendation: 'Implement nonce tracking and validation in permit functions.',
        exploitScenario: 'Capture permit signature once, replay multiple times to drain funds',
        economicImpact: 'Complete fund drainage possible',
        pocCode: `
// Vulnerable: No nonce check
function permit(address owner, address spender, uint256 amount, bytes memory signature) external {
    // Verify signature without nonce
    // Attacker can reuse same signature!
}

// Fixed version
mapping(address => uint256) public nonces;
function permit(address owner, address spender, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
    require(block.timestamp <= deadline, "Permit expired");
    bytes32 digest = keccak256(abi.encodePacked(
        "\\x19\\x01",
        DOMAIN_SEPARATOR,
        keccak256(abi.encode(
            PERMIT_TYPEHASH,
            owner,
            spender,
            amount,
            nonces[owner]++,  // Nonce increments here
            deadline
        ))
    ));
    address recovered = ecrecover(digest, v, r, s);
    require(recovered == owner, "Invalid signature");
    _approve(owner, spender, amount);
}
          `
      });
    }

    // Check for permit functions with deadline bypass
    if (code.includes('permit(') && !code.includes('deadline') && !code.includes('block.timestamp')) {
      findings.push({
        title: 'Permit Function Without Deadline Protection',
        severity: 'High',
        description: 'Permit function has no deadline parameter, making signatures valid forever.',
        impact: 'Signatures never expire, increasing long-term attack surface.',
        location: 'Permit function signature',
        recommendation: 'Add deadline parameter and validate block.timestamp <= deadline.',
        exploitScenario: 'Old permit signatures can be used years later',
        economicImpact: 'Persistent attack vector for fund theft'
      });
    }

    return findings;
  }

  detectERC1271SignatureMalleability(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for ERC-1271 implementations with malleability issues
    if (code.includes('isValidSignature') || code.includes('ERC1271')) {
      // Check for missing magic value validation
      if (!code.includes('0x1626ba7e') && !code.includes('0xffffffff')) {
        findings.push({
          title: 'ERC-1271 Invalid Signature Handling',
          severity: 'High',
          description: 'ERC-1271 isValidSignature function does not properly return invalid signature magic value.',
          impact: 'Signature validation can be bypassed or return incorrect results.',
          location: 'ERC-1271 isValidSignature implementation',
          recommendation: 'Return 0xffffffff for invalid signatures, 0x1626ba7e for valid ones.',
          exploitScenario: 'Bypass signature validation by exploiting return value handling',
          economicImpact: 'Can lead to unauthorized transactions'
        });
      }

      // Check for signature malleability in custom validation
      if (code.includes('ecrecover') && code.includes('isValidSignature')) {
        findings.push({
          title: 'ERC-1271 Signature Malleability Risk',
          severity: 'Medium',
          description: 'ERC-1271 contract uses ecrecover directly, vulnerable to signature malleability attacks.',
          impact: 'Multiple valid signatures for same message can exist.',
          location: 'ERC-1271 signature validation logic',
          recommendation: 'Use EIP-2 protection against signature malleability.',
          exploitScenario: 'Use alternative signature values to bypass validation',
          economicImpact: 'Can enable signature replay or bypass'
        });
      }
    }

    return findings;
  }

  detectNonceManagementVulnerabilities(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for nonce reuse vulnerabilities
    if (code.includes('nonce') && code.includes('++')) {
      // Check for pre-increment vs post-increment issues
      if (code.includes('nonces[owner]++') && code.includes('keccak256')) {
        findings.push({
          title: 'Nonce Pre-increment Timing Issue',
          severity: 'High',
          description: 'Nonce is incremented before use in signature verification, creating timing vulnerabilities.',
          impact: 'Can lead to signature reuse or front-running attacks.',
          location: 'Nonce increment logic in signature verification',
          recommendation: 'Use post-increment or separate nonce validation from increment.',
          exploitScenario: 'Front-run transaction to use nonce before increment',
          economicImpact: 'Can enable unauthorized transactions'
        });
      }
    }

    // Check for missing nonce initialization
    if (code.includes('nonces[') && !code.includes('nonces[') && code.includes('=')) {
      findings.push({
        title: 'Uninitialized Nonce Storage',
        severity: 'Medium',
        description: 'Nonce mapping may not be properly initialized, defaulting to zero.',
        impact: 'First transaction may be vulnerable if nonce starts at zero.',
        location: 'Nonce mapping declaration',
        recommendation: 'Initialize nonces to non-zero values or use different nonce scheme.',
        exploitScenario: 'Use nonce 0 for unauthorized transactions',
        economicImpact: 'Can enable initial transaction hijacking'
      });
    }

    return findings;
  }

  detectCrossChainSignatureReplay(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for cross-chain message signing without chain validation
    if ((code.includes('bridge') || code.includes('cross-chain')) && code.includes('signature')) {
      if (!code.includes('chainId') && !code.includes('block.chainid')) {
        findings.push({
          title: 'Cross-Chain Signature Replay Vulnerability',
          severity: 'Critical',
          description: 'Cross-chain message signatures lack chain ID validation, enabling replay attacks across chains.',
          impact: 'Messages signed for one chain can be replayed on another chain.',
          location: 'Cross-chain message signature validation',
          recommendation: 'Include destination chain ID in signed message to prevent replay.',
          exploitScenario: 'Sign message for testnet, replay on mainnet',
          economicImpact: 'Cross-chain fund theft (e.g., $190M Nomad hack)',
          pocCode: `
// Vulnerable: No chain validation
function processMessage(bytes memory message, bytes memory signature) external {
    Message memory msg = decode(message);
    // Verify signature without chain context
    require(verifySignature(msg, signature), "Invalid signature");
    // Process message - can be replayed on different chain!
}

// Fixed: Include chain ID
struct Message {
    uint256 chainId;  // Destination chain
    address recipient;
    uint256 amount;
    uint256 nonce;
}
          `
        });
      }
    }

    // Check for bridge signature validation bypass
    if (code.includes('bridge') && code.includes('verifySignature')) {
      if (!code.includes('nonce') || !code.includes('processed')) {
        findings.push({
          title: 'Bridge Message Signature Without Nonce',
          severity: 'High',
          description: 'Bridge message validation lacks nonce or replay protection.',
          impact: 'Same message can be processed multiple times.',
          location: 'Bridge message validation',
          recommendation: 'Implement nonce tracking for each message.',
          exploitScenario: 'Replay same bridge message multiple times',
          economicImpact: 'Multiple fund transfers from single message'
        });
      }
    }

    return findings;
  }

  detectMetaTransactionReplay(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for ERC-2771 meta-transaction implementations
    if (code.includes('ERC2771') || code.includes('_msgSender')) {
      // Check for missing forwarder validation
      if (code.includes('_msgSender') && !code.includes('isTrustedForwarder')) {
        findings.push({
          title: 'ERC-2771 Forwarder Validation Missing',
          severity: 'High',
          description: 'Meta-transaction implementation does not validate trusted forwarders.',
          impact: 'Untrusted parties can spoof msg.sender through meta-transactions.',
          location: 'Meta-transaction forwarder logic',
          recommendation: 'Implement trusted forwarder validation.',
          exploitScenario: 'Use untrusted forwarder to spoof transaction origin',
          economicImpact: 'Can bypass access controls and steal funds'
        });
      }

      // Check for replay protection in meta-transactions
      if (code.includes('execute') && !code.includes('nonce')) {
        findings.push({
          title: 'Meta-Transaction Replay Protection Missing',
          severity: 'High',
          description: 'Meta-transactions lack replay protection mechanisms.',
          impact: 'Same meta-transaction can be executed multiple times.',
          location: 'Meta-transaction execution logic',
          recommendation: 'Implement nonce-based replay protection.',
          exploitScenario: 'Replay same meta-transaction multiple times',
          economicImpact: 'Multiple unauthorized executions'
        });
      }
    }

    return findings;
  }

  detectPermit2IntegrationFlaws(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for Permit2 usage
    if (code.includes('Permit2') || code.includes('IPermit2')) {
      // Check for missing domain separator validation
      if (!code.includes('DOMAIN_SEPARATOR')) {
        findings.push({
          title: 'Permit2 Domain Separator Not Validated',
          severity: 'High',
          description: 'Permit2 integration does not validate domain separator matches expected value.',
          impact: 'Signatures can be replayed with different domain separators.',
          location: 'Permit2 integration code',
          recommendation: 'Validate domain separator matches Permit2 contract.',
          exploitScenario: 'Use different domain separator to replay signatures',
          economicImpact: 'Can enable unauthorized token transfers'
        });
      }

      // Check for Permit2 allowance manipulation
      if (code.includes('permitTransferFrom') && !code.includes('amount')) {
        findings.push({
          title: 'Permit2 Allowance Amount Not Validated',
          severity: 'Critical',
          description: 'Permit2 permitTransferFrom calls do not validate transferred amounts.',
          impact: 'Can transfer more tokens than permitted.',
          location: 'Permit2 transfer logic',
          recommendation: 'Validate transfer amounts against permit limits.',
          exploitScenario: 'Transfer more tokens than permitted in signature',
          economicImpact: 'Can drain approved token allowances'
        });
      }

      // Check for Permit2 nonce reuse
      if (code.includes('permit') && !code.includes('nonce')) {
        findings.push({
          title: 'Permit2 Nonce Management Flaw',
          severity: 'High',
          description: 'Permit2 permits lack proper nonce validation.',
          impact: 'Permit signatures can be reused.',
          location: 'Permit2 permit logic',
          recommendation: 'Implement proper nonce tracking for Permit2.',
          exploitScenario: 'Reuse Permit2 signatures multiple times',
          economicImpact: 'Unlimited token transfers from single permit'
        });
      }
    }

    return findings;
  }

  detectSignatureValidationBypass(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for signature malleability in ecrecover usage
    if (code.includes('ecrecover(')) {
      // Check for missing signature validation
      if (!code.includes('v == 27 || v == 28') && !code.includes('v >= 27')) {
        findings.push({
          title: 'ECDSA Signature Malleability Not Prevented',
          severity: 'Medium',
          description: 'ecrecover usage does not prevent signature malleability attacks.',
          impact: 'Multiple valid signatures exist for same message.',
          location: 'ecrecover signature validation',
          recommendation: 'Validate v parameter is 27 or 28 only.',
          exploitScenario: 'Use alternative signature values to bypass validation',
          economicImpact: 'Can enable signature replay attacks'
        });
      }
    }

    // Check for weak signature verification
    if (code.includes('signature.length') && code.includes('== 65')) {
      findings.push({
        title: 'Weak Signature Length Validation',
        severity: 'Low',
        description: 'Signature validation only checks length == 65, missing other validations.',
        impact: 'May accept invalid signature formats.',
        location: 'Signature validation logic',
        recommendation: 'Implement comprehensive signature validation.',
        exploitScenario: 'Use malformed signatures to bypass validation',
        economicImpact: 'Can lead to validation bypass'
      });
    }

    return findings;
  }
}

export const signatureAnalyzer = new SignatureAnalyzerImpl();