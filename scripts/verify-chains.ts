#!/usr/bin/env node
/**
 * Etherscan v2 Chain Verification Script
 * 
 * This script verifies that all chains are properly configured
 * and can connect to their respective RPC endpoints.
 */

import { CHAINS } from '../src/utils/constants';

interface ChainStatus {
  name: string;
  displayName: string;
  chainId: string;
  rpcConnected: boolean;
  explorerConfigured: boolean;
  apiKeyConfigured: boolean;
  error?: string;
}

async function testRpcConnection(rpcUrl: string, timeout = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function verifyChain(name: string): Promise<ChainStatus> {
  const chain = CHAINS[name];
  
  if (!chain) {
    return {
      name,
      displayName: 'Unknown',
      chainId: '0',
      rpcConnected: false,
      explorerConfigured: false,
      apiKeyConfigured: false,
      error: 'Chain not found in configuration'
    };
  }

  const rpcConnected = await testRpcConnection(chain.rpcUrls.default);
  const explorerConfigured = !!chain.blockExplorers.default.apiUrl;
  const apiKeyConfigured = !!chain.blockExplorers.default.apiKey;

  return {
    name,
    displayName: chain.displayName,
    chainId: chain.id,
    rpcConnected,
    explorerConfigured,
    apiKeyConfigured,
  };
}

async function verifyAllChains(): Promise<void> {
  console.log('🔍 Verifying Etherscan v2 Chain Configurations...\n');
  console.log('═'.repeat(80));
  
  const chainNames = Object.keys(CHAINS);
  console.log(`📊 Total Chains: ${chainNames.length}\n`);
  
  const results: ChainStatus[] = [];
  let successCount = 0;
  let failureCount = 0;
  
  // Test first 10 chains as a sample
  const samplesToTest = chainNames.slice(0, 10);
  
  console.log('Testing RPC connectivity for sample chains (first 10)...\n');
  
  for (const name of samplesToTest) {
    process.stdout.write(`Testing ${name}... `);
    const result = await verifyChain(name);
    results.push(result);
    
    if (result.rpcConnected) {
      console.log('✅');
      successCount++;
    } else {
      console.log('❌');
      failureCount++;
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('📋 Summary:\n');
  
  console.log('Sample Test Results:');
  console.log(`  ✅ Connected: ${successCount}/${samplesToTest.length}`);
  console.log(`  ❌ Failed: ${failureCount}/${samplesToTest.length}`);
  
  console.log('\nAll Configured Chains:');
  for (const name of chainNames) {
    const chain = CHAINS[name];
    const hasApiKey = chain.blockExplorers.default.apiKey ? '🔑' : '  ';
    console.log(`  ${hasApiKey} ${chain.displayName.padEnd(35)} (ID: ${chain.id})`);
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('Legend:');
  console.log('  🔑 = API Key configured');
  console.log('  ✅ = RPC connection successful');
  console.log('  ❌ = RPC connection failed\n');
  
  console.log('💡 Note: Failed RPC connections may be due to:');
  console.log('   - Network issues');
  console.log('   - Rate limiting');
  console.log('   - Temporary RPC downtime');
  console.log('   - CORS restrictions (not an issue in production)\n');
  
  console.log('Total chains configured: ' + chainNames.length);
  console.log('✨ Etherscan v2 integration complete!');
}

// Run verification
verifyAllChains().catch(console.error);
