/**
 * Language Detection Utilities
 * 
 * This module handles detection and classification of different blockchain
 * programming languages for smart contract auditing.
 */

import type { ContractFile } from "@/types/blockchain";

/**
 * Supported blockchain programming languages
 */
export type BlockchainLanguage = 
  | 'solidity'      // Ethereum, Monad, and other EVM chains
  | 'rust'          // Solana, Near, Polkadot (Substrate)
  | 'move'          // Aptos, Sui
  | 'cairo'         // StarkNet
  | 'vyper'         // Ethereum alternative
  | 'unknown';

/**
 * Language metadata
 */
export interface LanguageInfo {
  language: BlockchainLanguage;
  displayName: string;
  fileExtensions: string[];
  ecosystem: string[];
  description: string;
}

/**
 * Language definitions and metadata
 */
export const BLOCKCHAIN_LANGUAGES: Record<BlockchainLanguage, LanguageInfo> = {
  solidity: {
    language: 'solidity',
    displayName: 'Solidity',
    fileExtensions: ['.sol'],
    ecosystem: ['Ethereum', 'Monad', 'Polygon', 'BSC', 'Arbitrum', 'Optimism', 'Base', 'zkSync', 'and all EVM-compatible chains'],
    description: 'Smart contract language for Ethereum Virtual Machine (EVM)'
  },
  rust: {
    language: 'rust',
    displayName: 'Rust',
    fileExtensions: ['.rs'],
    ecosystem: ['Solana', 'Near', 'Polkadot', 'Substrate'],
    description: 'Systems programming language used for Solana programs and Substrate chains'
  },
  move: {
    language: 'move',
    displayName: 'Move',
    fileExtensions: ['.move'],
    ecosystem: ['Aptos', 'Sui'],
    description: 'Resource-oriented programming language designed for blockchain'
  },
  cairo: {
    language: 'cairo',
    displayName: 'Cairo',
    fileExtensions: ['.cairo'],
    ecosystem: ['StarkNet'],
    description: 'Language for writing provable programs on StarkNet'
  },
  vyper: {
    language: 'vyper',
    displayName: 'Vyper',
    fileExtensions: ['.vy'],
    ecosystem: ['Ethereum', 'EVM-compatible chains'],
    description: 'Python-based smart contract language for EVM'
  },
  unknown: {
    language: 'unknown',
    displayName: 'Unknown',
    fileExtensions: [],
    ecosystem: [],
    description: 'Unknown or unsupported language'
  }
};

/**
 * Detect language from file extension
 */
export function detectLanguageFromExtension(filename: string): BlockchainLanguage {
  const lowerFilename = filename.toLowerCase();
  
  for (const [lang, info] of Object.entries(BLOCKCHAIN_LANGUAGES)) {
    if (info.fileExtensions.some(ext => lowerFilename.endsWith(ext))) {
      return lang as BlockchainLanguage;
    }
  }
  
  return 'unknown';
}

/**
 * Detect language from file content
 * Uses heuristics and keywords to identify the language
 */
export function detectLanguageFromContent(content: string): BlockchainLanguage {
  const firstLines = content.split('\n').slice(0, 20).join('\n').toLowerCase();
  
  // Solidity detection
  if (
    firstLines.includes('pragma solidity') ||
    firstLines.includes('contract ') ||
    firstLines.includes('interface ') && firstLines.includes('function') ||
    /\bsolidity\b/.test(firstLines)
  ) {
    return 'solidity';
  }
  
  // Rust detection (Solana-specific)
  if (
    firstLines.includes('use solana_program') ||
    firstLines.includes('use anchor_lang') ||
    firstLines.includes('#[program]') ||
    firstLines.includes('fn process_instruction') ||
    firstLines.includes('use borsh::{')
  ) {
    return 'rust';
  }
  
  // Move detection
  if (
    firstLines.includes('module ') && (firstLines.includes('aptos') || firstLines.includes('sui')) ||
    firstLines.includes('public entry fun') ||
    /\bmodule\s+\w+::\w+/.test(firstLines)
  ) {
    return 'move';
  }
  
  // Cairo detection
  if (
    firstLines.includes('@contract') ||
    firstLines.includes('from starkware') ||
    /\%lang starknet/.test(firstLines)
  ) {
    return 'cairo';
  }
  
  // Vyper detection
  if (
    firstLines.includes('# @version') ||
    firstLines.includes('@external') && firstLines.includes('def ') ||
    /\b@payable\b/.test(firstLines)
  ) {
    return 'vyper';
  }
  
  return 'unknown';
}

/**
 * Detect language from a contract file
 * Combines extension and content detection
 */
export function detectLanguage(file: ContractFile): BlockchainLanguage {
  // First try extension detection
  const extLang = detectLanguageFromExtension(file.name);
  if (extLang !== 'unknown') {
    return extLang;
  }
  
  // Fall back to content detection
  return detectLanguageFromContent(file.content);
}

/**
 * Detect the primary language from a list of files
 * Returns the most common language in the file set
 */
export function detectPrimaryLanguage(files: ContractFile[]): BlockchainLanguage {
  if (files.length === 0) {
    return 'unknown';
  }
  
  const languageCounts = new Map<BlockchainLanguage, number>();
  
  files.forEach(file => {
    const lang = detectLanguage(file);
    languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
  });
  
  // Find the language with the highest count
  let maxCount = 0;
  let primaryLang: BlockchainLanguage = 'unknown';
  
  languageCounts.forEach((count, lang) => {
    if (count > maxCount && lang !== 'unknown') {
      maxCount = count;
      primaryLang = lang;
    }
  });
  
  return primaryLang;
}

/**
 * Check if a language is EVM-compatible
 */
export function isEvmCompatible(language: BlockchainLanguage): boolean {
  return language === 'solidity' || language === 'vyper';
}

/**
 * Get language-specific file extensions for filtering
 */
export function getLanguageExtensions(language: BlockchainLanguage): string[] {
  return BLOCKCHAIN_LANGUAGES[language]?.fileExtensions || [];
}

/**
 * Get display name for a language
 */
export function getLanguageDisplayName(language: BlockchainLanguage): string {
  return BLOCKCHAIN_LANGUAGES[language]?.displayName || 'Unknown';
}

/**
 * Get ecosystem information for a language
 */
export function getLanguageEcosystem(language: BlockchainLanguage): string[] {
  return BLOCKCHAIN_LANGUAGES[language]?.ecosystem || [];
}
