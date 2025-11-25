/**
 * Test script for multi-language support
 * Run with: npm run test-language-detection
 */

import { detectLanguage, detectPrimaryLanguage, getLanguageDisplayName, isEvmCompatible } from '../src/utils/languageDetection';
import type { ContractFile } from '../src/types/blockchain';

console.log('🧪 Testing Multi-Language Detection\n');

// Test 1: Solidity Detection
console.log('Test 1: Solidity Detection');
const solidityFile: ContractFile = {
  name: 'MyContract.sol',
  path: 'contracts/MyContract.sol',
  content: `
pragma solidity ^0.8.0;

contract MyContract {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
}
  `
};

const solidityLang = detectLanguage(solidityFile);
console.log(`✓ Detected: ${getLanguageDisplayName(solidityLang)}`);
console.log(`✓ EVM Compatible: ${isEvmCompatible(solidityLang)}\n`);

// Test 2: Rust/Solana Detection
console.log('Test 2: Rust/Solana Detection');
const rustFile: ContractFile = {
  name: 'lib.rs',
  path: 'src/lib.rs',
  content: `
use anchor_lang::prelude::*;

#[program]
pub mod my_program {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}
  `
};

const rustLang = detectLanguage(rustFile);
console.log(`✓ Detected: ${getLanguageDisplayName(rustLang)}`);
console.log(`✓ EVM Compatible: ${isEvmCompatible(rustLang)}\n`);

// Test 3: Vyper Detection
console.log('Test 3: Vyper Detection');
const vyperFile: ContractFile = {
  name: 'MyContract.vy',
  path: 'contracts/MyContract.vy',
  content: `
# @version ^0.3.0

owner: public(address)

@external
def __init__():
    self.owner = msg.sender
  `
};

const vyperLang = detectLanguage(vyperFile);
console.log(`✓ Detected: ${getLanguageDisplayName(vyperLang)}`);
console.log(`✓ EVM Compatible: ${isEvmCompatible(vyperLang)}\n`);

// Test 4: Multiple Files - Primary Language Detection
console.log('Test 4: Multiple Files - Primary Language Detection');
const mixedFiles: ContractFile[] = [
  solidityFile,
  {
    name: 'Interface.sol',
    path: 'interfaces/Interface.sol',
    content: 'interface IMyInterface { }'
  },
  {
    name: 'Helper.sol',
    path: 'contracts/Helper.sol',
    content: 'contract Helper { }'
  }
];

const primaryLang = detectPrimaryLanguage(mixedFiles);
console.log(`✓ Primary Language: ${getLanguageDisplayName(primaryLang)}`);
console.log(`✓ From ${mixedFiles.length} files\n`);

// Test 5: Extension-based Detection
console.log('Test 5: Extension-based Detection');
const testFiles = [
  { name: 'contract.sol', expected: 'Solidity' },
  { name: 'program.rs', expected: 'Rust' },
  { name: 'module.move', expected: 'Move' },
  { name: 'contract.cairo', expected: 'Cairo' },
  { name: 'token.vy', expected: 'Vyper' },
];

testFiles.forEach(({ name, expected }) => {
  const file: ContractFile = { name, path: name, content: '' };
  const detected = getLanguageDisplayName(detectLanguage(file));
  const status = detected === expected ? '✓' : '✗';
  console.log(`${status} ${name} -> ${detected} (expected: ${expected})`);
});

console.log('\n✅ All tests completed!');
