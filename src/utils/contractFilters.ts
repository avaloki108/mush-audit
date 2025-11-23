import type { ContractFile } from "@/types/blockchain";
import { detectLanguage, type BlockchainLanguage } from "./languageDetection";

// Define prefixes of third-party library paths to be filtered
const EXCLUDED_PREFIXES = [
  "@",
  "lib/",
  "node_modules/",
  "@openzeppelin/",
  "open-zeppelin/",
  "solmate/",
  "solady/",
  "permit2/",
  "forge-std/",
  ".deps/",
  "test/",
  "script/",
  "target/", // Rust build output
  "anchor/node_modules/", // Solana Anchor dependencies
];

// Define third-party libraries to be filtered
const EXCLUDED_LIBRARIES = [
  "openzeppelin",
  "solmate",
  "solady",
  "permit2",
  "forge-std",
  "hardhat",
  "foundry",
  "anchor-lang/", // Solana Anchor framework
  "solana-program/", // Solana program library
];

// Check if a file path should be filtered
export function shouldExcludeFile(path: string): boolean {
  // Convert to lowercase for case-insensitive comparison
  const lowerPath = path.toLowerCase();

  // Check path prefixes
  if (
    EXCLUDED_PREFIXES.some((prefix) =>
      lowerPath.startsWith(prefix.toLowerCase())
    )
  ) {
    return true;
  }

  // Check if it contains third-party library names
  if (EXCLUDED_LIBRARIES.some((lib) => lowerPath.includes(lib.toLowerCase()))) {
    return true;
  }

  return false;
}

// Filter contract files with optional filtering control
export function filterContractFiles(files: ContractFile[], applyFilter: boolean = true): ContractFile[] {
  if (!applyFilter) {
    return files; // Return all files without filtering when applyFilter is false
  }
  return files.filter((file) => !shouldExcludeFile(file.path));
}

// Find main contract file
export function findMainContract(files: ContractFile[], applyFilter: boolean = true): ContractFile | null {
  const filteredFiles = filterContractFiles(files, applyFilter);

  // If there is only one file, return it directly
  if (filteredFiles.length === 1) {
    return filteredFiles[0];
  }

  // Try to find the main contract file (usually the file matching the contract name)
  // Add more heuristic rules as needed
  return filteredFiles[0] || null;
}

// Define file type priorities (lower number = higher priority)
// Supports multiple blockchain languages
const FILE_PRIORITIES: Record<string, number> = {
  // Solidity files
  ".sol": 1, // Main contract files
  ".t.sol": 2, // Test files
  ".s.sol": 2, // Script files
  ".test.sol": 2, // Alternative test files
  ".script.sol": 2, // Alternative script files
  ".mock.sol": 3, // Mock contracts
  ".lib.sol": 4, // Library files
  
  // Vyper files
  ".vy": 1, // Main Vyper contract files
  
  // Rust files (Solana)
  ".rs": 1, // Main Rust program files
  "lib.rs": 1, // Library root
  "mod.rs": 2, // Module files
  "test.rs": 3, // Test files
  "_test.rs": 3, // Alternative test files
  
  // Move files (Aptos, Sui)
  ".move": 1, // Main Move module files
  
  // Cairo files (StarkNet)
  ".cairo": 1, // Main Cairo contract files
};

// Get file priority (lower number = higher priority)
function getFilePriority(filename: string): number {
  // Check each known extension pattern
  for (const [ext, priority] of Object.entries(FILE_PRIORITIES)) {
    if (filename.toLowerCase().endsWith(ext)) {
      return priority;
    }
  }
  // Default priority for unknown patterns
  return 99;
}

// Merge multiple contract files with language-aware processing
export function mergeContractContents(files: ContractFile[], applyFilter: boolean = true): string {
  const filteredFiles = filterContractFiles(files, applyFilter);
  
  if (filteredFiles.length === 0) {
    return "";
  }
  
  // Detect the language from the first file
  const language = detectLanguage(filteredFiles[0]);
  
  // Sort files by priority and name
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    // First compare by priority
    const priorityA = getFilePriority(a.name);
    const priorityB = getFilePriority(b.name);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    // If priorities are equal, sort alphabetically
    return a.name.localeCompare(b.name);
  });

  // Process each file based on language
  const processedContents = sortedFiles.map((file) => {
    let content = file.content.trim();
    
    // Language-specific processing
    if (language === 'solidity' || language === 'vyper') {
      // Remove import statements for Solidity/Vyper
      content = content
        .replace(/\n\s*\n\s*\n/g, "\n\n") // Replace 3+ newlines with 2
        .replace(/^\s*import\s+[^;]+;\s*\n*/gm, ""); // Remove import statements
    } else if (language === 'rust') {
      // Remove use statements for Rust (but keep important ones commented)
      content = content
        .replace(/\n\s*\n\s*\n/g, "\n\n") // Replace 3+ newlines with 2
        .replace(/^\s*use\s+[^;]+;\s*\n*/gm, ""); // Remove use statements
    } else if (language === 'move') {
      // Keep Move imports as they're important for understanding
      content = content.replace(/\n\s*\n\s*\n/g, "\n\n");
    } else {
      // Default: just clean up whitespace
      content = content.replace(/\n\s*\n\s*\n/g, "\n\n");
    }

    return {
      name: file.name,
      content: content,
    };
  });

  // Combine all files with proper headers and spacing
  return processedContents
    .map(({ name, content }) => `// File: ${name}\n${content}`)
    .join("\n\n")
    .replace(/\n\s*\n\s*\n/g, "\n\n"); // Final cleanup of multiple empty lines
}
