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

export interface CrossChainAnalyzer {
  detectBridgeMessageReplay(code: string): VulnerabilityFinding[];
  detectLayerZeroEndpointValidation(code: string): VulnerabilityFinding[];
  detectAxelarMessagePassingFlaws(code: string): VulnerabilityFinding[];
  detectCrossChainGovernanceAttacks(code: string): VulnerabilityFinding[];
  detectProtocolComposabilityRisks(code: string): VulnerabilityFinding[];
  detectMessageNonceValidationFailure(code: string): VulnerabilityFinding[];
  detectChainIdValidationBypass(code: string): VulnerabilityFinding[];
  detectOracleConsistencyIssues(code: string): VulnerabilityFinding[];
  detectCrossChainReentrancy(code: string): VulnerabilityFinding[];
  detectWormholeVulnerabilities(code: string): VulnerabilityFinding[]; // NEW
  detectSignatureReplay(code: string): VulnerabilityFinding[]; // NEW
}

export class CrossChainAnalyzerImpl implements CrossChainAnalyzer {

  detectBridgeMessageReplay(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for bridge message processing without replay protection
    if (code.includes('bridge') || code.includes('message')) {
      if (!code.includes('nonce') && !code.includes('processed') && !code.includes('executed')) {
        findings.push({
          title: 'Bridge Message Replay Vulnerability',
          severity: 'Critical',
          description: 'Bridge accepts messages without replay protection, allowing same message to be processed multiple times.',
          impact: 'Funds can be transferred multiple times from single bridge message.',
          location: 'Bridge message processing function',
          recommendation: 'Implement message nonce tracking and replay protection.',
          exploitScenario: 'Capture bridge message, replay it multiple times to drain funds',
          economicImpact: 'Multiple fund transfers (e.g., $190M Nomad bridge hack)',
          pocCode: `
// Vulnerable bridge (like Nomad)
function processMessage(bytes memory message) external {
    Message memory msg = decode(message);
    // No replay protection!
    transferFunds(msg.recipient, msg.amount); // Can be called multiple times
}

// Attacker replays same message
for(uint i = 0; i < 100; i++) {
    bridge.processMessage(sameMessage);
}
          `
        });
      }
    }

    // Check for insufficient replay protection
    if (code.includes('processed[') && code.includes('message')) {
      if (!code.includes('keccak256') && !code.includes('hash')) {
        findings.push({
          title: 'Weak Bridge Message Replay Protection',
          severity: 'High',
          description: 'Bridge replay protection uses raw message data instead of cryptographic hash.',
          impact: 'Replay protection can be bypassed with equivalent message encodings.',
          location: 'Message replay protection logic',
          recommendation: 'Use keccak256 hash of message for replay protection.',
          exploitScenario: 'Create equivalent message with different encoding to bypass protection',
          economicImpact: 'Can enable message replay attacks'
        });
      }
    }

    return findings;
  }

  detectLayerZeroEndpointValidation(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for LayerZero endpoint implementations
    if (code.includes('LayerZero') || code.includes('lzReceive') || code.includes('endpoint')) {
      // Check for missing endpoint validation
      if (!code.includes('trustedRemote') && !code.includes('isTrustedRemote')) {
        findings.push({
          title: 'LayerZero Endpoint Validation Missing',
          severity: 'Critical',
          description: 'LayerZero endpoint accepts messages from untrusted remote endpoints.',
          impact: 'Malicious contracts can send arbitrary messages to this endpoint.',
          location: 'LayerZero message receiving logic',
          recommendation: 'Implement trusted remote endpoint validation.',
          exploitScenario: 'Deploy malicious contract, send fake messages to victim endpoint',
          economicImpact: 'Can execute arbitrary actions on destination chain'
        });
      }

      // Check for lzReceive access control
      if (code.includes('lzReceive') && !code.includes('onlyEndpoint')) {
        findings.push({
          title: 'LayerZero lzReceive Function Exposed',
          severity: 'High',
          description: 'lzReceive function can be called directly without LayerZero endpoint validation.',
          impact: 'Anyone can call lzReceive with crafted messages.',
          location: 'lzReceive function implementation',
          recommendation: 'Restrict lzReceive to LayerZero endpoint only.',
          exploitScenario: 'Call lzReceive directly with malicious payload',
          economicImpact: 'Can bypass cross-chain message validation'
        });
      }

      // Check for missing payload validation
      if (code.includes('lzReceive') && !code.includes('validatePayload')) {
        findings.push({
          title: 'LayerZero Payload Validation Missing',
          severity: 'High',
          description: 'LayerZero message payloads are not validated before processing.',
          impact: 'Malicious payloads can cause unexpected behavior.',
          location: 'LayerZero payload processing',
          recommendation: 'Implement payload validation and sanitization.',
          exploitScenario: 'Send malformed payload to cause contract malfunction',
          economicImpact: 'Can lead to fund loss or contract compromise'
        });
      }
    }

    return findings;
  }

  detectAxelarMessagePassingFlaws(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for Axelar gateway implementations
    if (code.includes('Axelar') || code.includes('gateway') || code.includes('commandId')) {
      // Check for command ID validation
      if (code.includes('execute') && !code.includes('commandId')) {
        findings.push({
          title: 'Axelar Command ID Validation Missing',
          severity: 'Critical',
          description: 'Axelar gateway executes commands without validating command IDs.',
          impact: 'Commands can be replayed or executed out of order.',
          location: 'Axelar command execution logic',
          recommendation: 'Validate and track command IDs to prevent replay.',
          exploitScenario: 'Replay old commands or execute out-of-order',
          economicImpact: 'Can cause incorrect cross-chain operations'
        });
      }

      // Check for gateway approval validation
      if (code.includes('approveContractCall') && !code.includes('validateContractCall')) {
        findings.push({
          title: 'Axelar Contract Call Approval Bypass',
          severity: 'High',
          description: 'Axelar contract call approvals lack proper validation.',
          impact: 'Unapproved contract calls can be executed.',
          location: 'Axelar approval logic',
          recommendation: 'Implement strict approval validation for contract calls.',
          exploitScenario: 'Execute unapproved contract calls through Axelar',
          economicImpact: 'Can enable unauthorized cross-chain calls'
        });
      }
    }

    return findings;
  }

  detectCrossChainGovernanceAttacks(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for cross-chain governance implementations
    if ((code.includes('governance') || code.includes('vote')) && (code.includes('bridge') || code.includes('cross-chain'))) {
      // Check for governance message replay
      if (!code.includes('nonce') && !code.includes('processed')) {
        findings.push({
          title: 'Cross-Chain Governance Message Replay',
          severity: 'Critical',
          description: 'Cross-chain governance messages lack replay protection.',
          impact: 'Same governance actions can be executed multiple times.',
          location: 'Cross-chain governance message processing',
          recommendation: 'Implement nonce-based replay protection for governance messages.',
          exploitScenario: 'Replay governance votes or proposals across chains',
          economicImpact: 'Can manipulate governance outcomes'
        });
      }

      // Check for governance delay bypass
      if (code.includes('timelock') && code.includes('cross-chain')) {
        if (!code.includes('delay') || !code.includes('block.timestamp')) {
          findings.push({
            title: 'Cross-Chain Governance Timelock Bypass',
            severity: 'High',
            description: 'Cross-chain governance bypasses timelock mechanisms.',
            impact: 'Critical governance actions execute immediately without delay.',
            location: 'Cross-chain governance execution',
            recommendation: 'Enforce timelock delays for cross-chain governance actions.',
            exploitScenario: 'Execute governance changes without required delay',
            economicImpact: 'Can lead to rushed, potentially harmful governance decisions'
          });
        }
      }

      // Check for bridge dependency in governance
      if (code.includes('governance') && code.includes('bridge')) {
        findings.push({
          title: 'Governance Bridge Dependency Risk',
          severity: 'Medium',
          description: 'Governance system depends on external bridge for execution.',
          impact: 'Bridge compromise or failure affects governance functionality.',
          location: 'Cross-chain governance bridge integration',
          recommendation: 'Implement fallback mechanisms and bridge redundancy.',
          exploitScenario: 'Bridge compromise blocks governance or enables manipulation',
          economicImpact: 'Can cause governance deadlock or manipulation'
        });
      }
    }

    return findings;
  }

  detectProtocolComposabilityRisks(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for external protocol integrations
    if (code.includes('external') || code.includes('call')) {
      if (code.includes('protocol') || code.includes('defi')) {
        findings.push({
          title: 'Cross-Protocol Composability Risk',
          severity: 'High',
          description: 'Contract integrates with external DeFi protocols without proper safeguards.',
          impact: 'Vulnerabilities in external protocols can affect this contract.',
          location: 'External protocol integration points',
          recommendation: 'Implement circuit breakers, rate limiting, and external call validation.',
          exploitScenario: 'Exploit vulnerability in integrated protocol to affect this contract',
          economicImpact: 'Can lead to cascading failures (e.g., $625M Ronin hack)',
          pocCode: `
// Vulnerable composability
function rebalance() external {
    // Call external protocol without checks
    externalProtocol.swap(tokenA, tokenB, amount); // External protocol vulnerable
    
    // Update state after external call
    userBalance[msg.sender] = newBalance; // State corrupted if external call fails
}

// Attacker exploits external protocol vulnerability
// which cascades to this contract
          `
        });
      }
    }

    // Check for flash loan composability
    if (code.includes('flashLoan') && code.includes('protocol')) {
      findings.push({
        title: 'Flash Loan Cross-Protocol Exploitation',
        severity: 'Critical',
        description: 'Flash loan operations interact with multiple protocols, enabling complex exploits.',
        impact: 'Single transaction can manipulate multiple protocols simultaneously.',
        location: 'Flash loan and protocol interaction logic',
        recommendation: 'Implement flash loan restrictions and cross-protocol guards.',
        exploitScenario: 'Use flash loan to manipulate prices across multiple protocols',
        economicImpact: 'Can drain liquidity from multiple protocols simultaneously'
      });
    }

    return findings;
  }

  detectMessageNonceValidationFailure(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for message nonce handling
    if (code.includes('nonce') && (code.includes('message') || code.includes('bridge'))) {
      // Check for nonce reuse
      if (!code.includes('increment') && !code.includes('++')) {
        findings.push({
          title: 'Message Nonce Not Properly Incremented',
          severity: 'High',
          description: 'Message nonces are not incremented after use, allowing replay attacks.',
          impact: 'Same nonce can be used for multiple messages.',
          location: 'Message nonce management',
          recommendation: 'Increment nonce after successful message processing.',
          exploitScenario: 'Reuse same nonce for multiple bridge messages',
          economicImpact: 'Can enable message replay attacks'
        });
      }

      // Check for nonce ordering validation
      if (code.includes('nonce') && !code.includes('expectedNonce')) {
        findings.push({
          title: 'Message Nonce Ordering Not Enforced',
          severity: 'Medium',
          description: 'Messages can be processed out of order, violating sequencing requirements.',
          impact: 'State updates can occur in wrong order.',
          location: 'Message processing logic',
          recommendation: 'Enforce sequential nonce processing.',
          exploitScenario: 'Process messages out of order to manipulate state',
          economicImpact: 'Can cause incorrect state transitions'
        });
      }
    }

    return findings;
  }

  detectChainIdValidationBypass(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for chain ID validation in cross-chain operations
    if (code.includes('chainId') || code.includes('block.chainid')) {
      // Check for missing chain ID validation
      if (code.includes('message') && !code.includes('chainId')) {
        findings.push({
          title: 'Missing Chain ID Validation in Messages',
          severity: 'High',
          description: 'Cross-chain messages do not validate destination chain ID.',
          impact: 'Messages intended for one chain can be executed on another.',
          location: 'Cross-chain message validation',
          recommendation: 'Validate message contains correct destination chain ID.',
          exploitScenario: 'Execute message on wrong chain by bypassing chain validation',
          economicImpact: 'Can cause incorrect cross-chain operations'
        });
      }

      // Check for chain ID comparison issues
      if (code.includes('chainId') && code.includes('==')) {
        if (!code.includes('block.chainid')) {
          findings.push({
            title: 'Incorrect Chain ID Comparison',
            severity: 'Medium',
            description: 'Chain ID comparison uses stored value instead of current block.chainid.',
            impact: 'Chain validation can be bypassed if stored value is incorrect.',
            location: 'Chain ID validation logic',
            recommendation: 'Use block.chainid for current chain validation.',
            exploitScenario: 'Bypass chain validation with outdated stored chain ID',
            economicImpact: 'Can enable cross-chain replay attacks'
          });
        }
      }
    }

    return findings;
  }

  detectOracleConsistencyIssues(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for cross-chain oracle usage
    if (code.includes('oracle') && (code.includes('chain') || code.includes('bridge'))) {
      // Check for single oracle dependency
      if (code.includes('oracle') && !code.includes('multiple') && !code.includes('fallback')) {
        findings.push({
          title: 'Single Oracle Dependency Risk',
          severity: 'High',
          description: 'Cross-chain operations depend on single oracle source.',
          impact: 'Oracle compromise or failure affects all cross-chain operations.',
          location: 'Oracle integration points',
          recommendation: 'Implement multiple oracle sources and fallback mechanisms.',
          exploitScenario: 'Compromise single oracle to manipulate cross-chain prices',
          economicImpact: 'Can cause incorrect pricing and fund loss'
        });
      }

      // Check for oracle data freshness validation
      if (code.includes('price') && !code.includes('timestamp')) {
        findings.push({
          title: 'Oracle Data Freshness Not Validated',
          severity: 'Medium',
          description: 'Oracle price data freshness is not validated across chains.',
          impact: 'Stale price data can be used in critical operations.',
          location: 'Oracle price feed integration',
          recommendation: 'Validate oracle data timestamps and freshness.',
          exploitScenario: 'Use stale price data to manipulate transaction outcomes',
          economicImpact: 'Can lead to incorrect liquidations or trades'
        });
      }

      // Check for oracle consensus validation
      if (code.includes('oracle') && code.includes('update')) {
        if (!code.includes('consensus') && !code.includes('threshold')) {
          findings.push({
            title: 'Oracle Update Without Consensus',
            severity: 'Medium',
            description: 'Oracle updates lack consensus validation across chains.',
            impact: 'Single compromised oracle can update global state.',
            location: 'Cross-chain oracle update logic',
            recommendation: 'Require consensus from multiple oracles for updates.',
            exploitScenario: 'Compromise single oracle to update cross-chain prices',
            economicImpact: 'Can manipulate global price feeds'
          });
        }
      }
    }

    return findings;
  }

  detectCrossChainReentrancy(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for cross-chain reentrancy patterns
    if ((code.includes('bridge') || code.includes('cross-chain')) && code.includes('callback')) {
      // Check for state changes before bridge calls
      if (code.includes('bridge') && code.includes('state') && code.includes('callback')) {
        findings.push({
          title: 'Cross-Chain Reentrancy Vulnerability',
          severity: 'Critical',
          description: 'Cross-chain operations with callbacks can enable reentrancy attacks.',
          impact: 'Malicious contracts can reenter during cross-chain operations.',
          location: 'Cross-chain callback handling',
          recommendation: 'Use reentrancy guards and follow checks-effects-interactions pattern.',
          exploitScenario: 'Reenter contract through bridge callback to manipulate state',
          economicImpact: 'Can lead to fund drainage through reentrancy',
          pocCode: `
// Vulnerable cross-chain reentrancy
function bridgeTokens(address token, uint256 amount) external {
    // State change before bridge call
    userBalances[msg.sender] -= amount;
    
    // Bridge call with callback
    bridge.sendTokens(token, amount, msg.sender); // Callback can reenter
    
    // Callback function
    function onBridgeCallback() external {
        // Attacker reenters here and manipulates state
        userBalances[attacker] += amount; // Double-spend!
    }
}
          `
        });
      }
    }

    // Check for bridge callback validation
    if (code.includes('callback') && code.includes('bridge')) {
      if (!code.includes('onlyBridge') && !code.includes('validateCallback')) {
        findings.push({
          title: 'Bridge Callback Validation Missing',
          severity: 'High',
          description: 'Bridge callbacks are not validated, allowing arbitrary callback execution.',
          impact: 'Anyone can call callback functions with crafted data.',
          location: 'Bridge callback functions',
          recommendation: 'Validate callback origin and data authenticity.',
          exploitScenario: 'Call bridge callbacks directly with malicious data',
          economicImpact: 'Can bypass bridge security controls'
        });
      }
    }

    return findings;
  }

  /**
   * NEW: Detect Wormhole-specific vulnerabilities
   */
  detectWormholeVulnerabilities(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for Wormhole bridge usage
    if (code.includes('Wormhole') || code.includes('wormhole') || code.includes('parseAndVerifyVM')) {
      
      // 1. Check for parseAndVerifyVM without proper validation
      if (code.includes('parseAndVerifyVM')) {
        if (!code.includes('verifyVMSignatures') && !code.includes('guardianSet')) {
          findings.push({
            title: 'Wormhole parseAndVerifyVM Missing Signature Verification',
            severity: 'Critical',
            description: 'parseAndVerifyVM is used without verifying guardian signatures, allowing forged messages.',
            impact: 'Attackers can create fake Wormhole messages and execute arbitrary cross-chain actions.',
            location: 'Wormhole message parsing logic',
            recommendation: 'Always verify guardian signatures using verifyVMSignatures before processing VAA (Verified Action Approval).',
            exploitScenario: 'Forge Wormhole VAA without valid signatures to execute unauthorized cross-chain transfers',
            economicImpact: 'Total bridge funds at risk (e.g., $325M Wormhole hack)',
            pocCode: `
// Vulnerable Wormhole integration
function processWormholeMessage(bytes memory encodedVM) external {
    (IWormhole.VM memory vm, bool valid, string memory reason) = wormhole.parseAndVerifyVM(encodedVM);
    
    // Missing: Guardian signature verification!
    // if (!valid) revert("Invalid VM");
    
    // Process message without validation
    executeAction(vm.payload);
}

// Attacker creates fake VAA
bytes memory fakeVAA = craftFakeWormholeVAA(...);
victim.processWormholeMessage(fakeVAA); // Succeeds without signature check
            `
          });
        }

        // Check for sequence number validation
        if (!code.includes('consumedMessages') && !code.includes('sequence')) {
          findings.push({
            title: 'Wormhole Message Replay Risk',
            severity: 'High',
            description: 'Wormhole messages lack sequence number tracking, allowing replay attacks.',
            impact: 'Same Wormhole message can be replayed multiple times.',
            location: 'Wormhole message processing',
            recommendation: 'Track consumed message hashes using mapping(bytes32 => bool) consumedMessages.',
            exploitScenario: 'Replay valid Wormhole messages to drain funds',
            economicImpact: 'Multiple fund transfers from single message'
          });
        }
      }

      // 2. Check for emitter address validation
      if (code.includes('parseAndVerifyVM') && !code.includes('emitterAddress')) {
        findings.push({
          title: 'Missing Wormhole Emitter Address Validation',
          severity: 'High',
          description: 'Wormhole messages accepted from any emitter without validation.',
          impact: 'Malicious contracts can send messages pretending to be trusted sources.',
          location: 'Wormhole message validation',
          recommendation: 'Validate vm.emitterAddress matches expected trusted emitter.',
          exploitScenario: 'Deploy malicious contract on source chain and send fake messages',
          economicImpact: 'Can spoof cross-chain messages'
        });
      }

      // 3. Check for chain ID validation
      if (code.includes('parseAndVerifyVM') && !code.includes('emitterChainId')) {
        findings.push({
          title: 'Missing Wormhole Chain ID Validation',
          severity: 'Medium',
          description: 'Wormhole messages not validated for source chain ID.',
          impact: 'Messages from unexpected chains may be processed.',
          location: 'Wormhole chain validation',
          recommendation: 'Validate vm.emitterChainId matches expected source chain.',
          exploitScenario: 'Send messages from untrusted chains',
          economicImpact: 'Cross-chain validation bypass'
        });
      }

      // 4. Check for payload parsing vulnerabilities
      if (code.includes('parseAndVerifyVM') && code.includes('abi.decode')) {
        if (!code.includes('require') || !code.includes('payload.length')) {
          findings.push({
            title: 'Unsafe Wormhole Payload Parsing',
            severity: 'Medium',
            description: 'Wormhole payload decoded without length or format validation.',
            impact: 'Malformed payloads can cause unexpected behavior or reverts.',
            location: 'Wormhole payload processing',
            recommendation: 'Validate payload length and structure before decoding.',
            exploitScenario: 'Send malformed payload to cause DOS or unexpected state',
            economicImpact: 'Contract malfunction or denial of service'
          });
        }
      }

      // 5. Check for consistency level validation
      if (code.includes('parseAndVerifyVM') && !code.includes('consistencyLevel')) {
        findings.push({
          title: 'Wormhole Consistency Level Not Enforced',
          severity: 'Low',
          description: 'Messages accepted without checking required finality level.',
          impact: 'Messages may be processed before reaching sufficient finality.',
          location: 'Wormhole message processing',
          recommendation: 'Enforce minimum consistencyLevel based on security requirements.',
          exploitScenario: 'Process messages before finality, then reorg source chain',
          economicImpact: 'Messages can be invalidated post-processing'
        });
      }
    }

    return findings;
  }

  /**
   * NEW: Detect generic signature replay vulnerabilities in cross-chain messages
   */
  detectSignatureReplay(code: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    // Check for signature-based cross-chain operations
    const hasSignatures = /signature|ecrecover|verify|ECDSA/.test(code);
    const isCrossChain = /bridge|cross-chain|crosschain|relay|message/.test(code);

    if (hasSignatures && isCrossChain) {
      
      // 1. Check for missing nonce in signature verification
      if (code.includes('ecrecover') || code.includes('verify')) {
        if (!code.includes('nonce') && !code.includes('_nonce')) {
          findings.push({
            title: 'Cross-Chain Signature Replay - Missing Nonce',
            severity: 'Critical',
            description: 'Signatures verified without nonce, enabling replay attacks across chains.',
            impact: 'Same signature can be replayed on multiple chains or multiple times.',
            location: 'Signature verification logic',
            recommendation: 'Include nonce in signed message and track used nonces per signer.',
            exploitScenario: 'Capture valid signature and replay on multiple chains',
            economicImpact: 'Complete loss of signed authorizations',
            pocCode: `
// Vulnerable signature verification
function executeWithSignature(
    address target,
    bytes calldata data,
    bytes calldata signature
) external {
    bytes32 messageHash = keccak256(abi.encodePacked(target, data));
    address signer = ECDSA.recover(messageHash, signature);
    
    // Missing: nonce validation!
    require(signer == owner, "Invalid signer");
    
    // Execute action
    (bool success,) = target.call(data);
}

// Attacker replays signature
victim.executeWithSignature(target, data, signature); // Works first time
victim.executeWithSignature(target, data, signature); // Works again! (replay)
            `
          });
        }

        // 2. Check for missing deadline/expiry
        if (!code.includes('deadline') && !code.includes('expiry') && !code.includes('timestamp')) {
          findings.push({
            title: 'Cross-Chain Signature Without Expiry',
            severity: 'High',
            description: 'Signatures have no expiration time, allowing use indefinitely.',
            impact: 'Old signatures can be used long after they were created.',
            location: 'Signature verification',
            recommendation: 'Include deadline timestamp in signature and validate against block.timestamp.',
            exploitScenario: 'Use old signature months/years later when circumstances changed',
            economicImpact: 'Stale authorizations can be exploited'
          });
        }

        // 3. Check for missing chain ID in signature
        if (!code.includes('chainId') && !code.includes('block.chainid')) {
          findings.push({
            title: 'Cross-Chain Signature Replay Across Chains',
            severity: 'Critical',
            description: 'Signatures not bound to specific chain, allowing cross-chain replay.',
            impact: 'Signature valid on one chain can be replayed on all other chains.',
            location: 'Signature message construction',
            recommendation: 'Include block.chainid in signed message to prevent cross-chain replay.',
            exploitScenario: 'Capture signature on testnet and replay on mainnet, or vice versa',
            economicImpact: 'Cross-chain authorization theft',
            pocCode: `
// Vulnerable - no chainId
bytes32 messageHash = keccak256(abi.encodePacked(
    action,
    amount,
    recipient
    // Missing: block.chainid
));

// Safe version
bytes32 messageHash = keccak256(abi.encodePacked(
    action,
    amount,
    recipient,
    block.chainid,  // Prevents cross-chain replay
    nonce,          // Prevents same-chain replay
    deadline        // Prevents time-based attacks
));
            `
          });
        }

        // 4. Check for EIP-712 usage
        if (!code.includes('EIP712') && !code.includes('DOMAIN_SEPARATOR')) {
          findings.push({
            title: 'Cross-Chain Signatures Not Using EIP-712',
            severity: 'Medium',
            description: 'Signatures not following EIP-712 standard, missing domain separation.',
            impact: 'Signatures may be valid across different contracts or versions.',
            location: 'Signature scheme implementation',
            recommendation: 'Implement EIP-712 with proper domain separator including contract address and chain ID.',
            exploitScenario: 'Replay signature from different contract or contract version',
            economicImpact: 'Cross-contract signature replay'
          });
        }

        // 5. Check for signature malleability
        if (code.includes('ecrecover') && !code.includes('v == 27 || v == 28')) {
          findings.push({
            title: 'ECDSA Signature Malleability',
            severity: 'Low',
            description: 'Signature validation vulnerable to malleability attacks.',
            impact: 'Attacker can create multiple valid signatures for same message.',
            location: 'ecrecover usage',
            recommendation: 'Use OpenZeppelin ECDSA library or validate v parameter (v == 27 || v == 28).',
            exploitScenario: 'Create alternate signature to bypass nonce checks',
            economicImpact: 'Can bypass some replay protections'
          });
        }
      }

      // 6. Check for permit/approval signature issues
      if (code.includes('permit') || code.includes('Permit')) {
        if (!code.includes('nonces[')) {
          findings.push({
            title: 'Permit Function Missing Nonce Tracking',
            severity: 'Critical',
            description: 'ERC20 permit function does not track nonces per address.',
            impact: 'Permit signatures can be replayed multiple times.',
            location: 'Permit implementation',
            recommendation: 'Implement mapping(address => uint256) public nonces and increment after each permit.',
            exploitScenario: 'Replay permit signature to approve tokens multiple times',
            economicImpact: 'Unlimited approvals from single signature'
          });
        }
      }

      // 7. Check for meta-transaction replay
      if (code.includes('meta') || code.includes('relay')) {
        if (!code.includes('nonce') || !code.includes('executed')) {
          findings.push({
            title: 'Meta-Transaction Replay Vulnerability',
            severity: 'High',
            description: 'Meta-transactions lack proper replay protection.',
            impact: 'Same meta-transaction can be executed multiple times.',
            location: 'Meta-transaction execution',
            recommendation: 'Track executed transaction hashes or use incremental nonces.',
            exploitScenario: 'Replay meta-transaction to execute action multiple times',
            economicImpact: 'Duplicate transactions and fund loss'
          });
        }
      }
    }

    return findings;
  }
}

export const crossChainAnalyzer = new CrossChainAnalyzerImpl();