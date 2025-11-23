"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { checkContractOnChains } from "@/utils/blockchain";
import { getRpcUrl } from "@/utils/chainServices";
import type { ChainContractInfo, ContractFile } from "@/types/blockchain";
import { loadGitHubSolidityFiles, parseGitHubRepoUrl, sanitizeTokenInput } from "@/utils/githubRepoLoader";
import ContractInfoCard from "@/components/audit/ContractInfoCard";
import Image from "next/image";
import Link from "next/link";
import {
  FileIcon,
  FilesIcon,
  WalletIcon,
  SecurityIcon,
  SecurityAnalysisIcon,
  MultiChainIcon,
  CodeIcon,
  AIIcon,
} from "@/components/Icons";
import Editor from "@monaco-editor/react";
import AIConfigModal from "@/components/audit/AIConfigModal";
import { analyzeContract } from "@/services/audit/contractAnalyzer";
import { useAIConfig, getModelName, getAIConfig } from "@/utils/ai";
import html2canvas from "html2canvas";
import {
  findMainContract,
  mergeContractContents,
} from "@/utils/contractFilters";

type TabType = "address" | "single-file" | "multi-files" | "repository";

export default function AuditPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [chainInfo, setChainInfo] = useState<ChainContractInfo | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("address");
  // Repository tab states
  const [repoUrl, setRepoUrl] = useState("");
  const [repoToken, setRepoToken] = useState("");
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoFiles, setRepoFiles] = useState<ContractFile[]>([]);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [isAIConfigModalOpen, setIsAIConfigModalOpen] = useState(false);
  const [contractCode, setContractCode] = useState("");
  const [analysisFiles, setAnalysisFiles] = useState<ContractFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { config } = useAIConfig();
  const [editorContent, setEditorContent] =
    useState(`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VaultLogic {
    address public owner; // slot 0
    bytes32 private password; // slot 1

    constructor(bytes32 _password) public {
        owner = msg.sender;
        password = _password;
    }

    function changeOwner(bytes32 _password, address newOwner) public {
        if (password == _password) {
            owner = newOwner;
        } else {
            revert("password error");
        }
    }
}

contract Vault {
    address public owner; // slot 0
    VaultLogic logic; // slot 1
    mapping(address => uint256) deposites; // slot 2
    bool public canWithdraw = false; // slot 3

    constructor(address _logicAddress) public {
        logic = VaultLogic(_logicAddress);
        owner = msg.sender;
    }

    fallback() external {
        (bool result,) = address(logic).delegatecall(msg.data);
        if (result) {
            this;
        }
    }

    receive() external payable { }

    function deposite() public payable {
        deposites[msg.sender] += msg.value;
    }

    function isSolve() external view returns (bool) {
        if (address(this).balance == 0) {
            return true;
        }
    }

    function openWithdraw() external {
        if (owner == msg.sender) {
            canWithdraw = true;
        } else {
            revert("not owner");
        }
    }

    function withdraw() public {
        if (canWithdraw && deposites[msg.sender] >= 0) {
            (bool result,) = msg.sender.call{ value: deposites[msg.sender] }("");
            if (result) {
                deposites[msg.sender] = 0;
            }
        }
    }
}`);

  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<ContractFile[]>([]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();

    if (value && !value.startsWith("0x")) {
      value = "0x" + value;
    }

    setAddress(value);
  };

  const handleCheck = async () => {
    let formattedAddress = address.trim();
    if (formattedAddress && !formattedAddress.startsWith("0x")) {
      formattedAddress = "0x" + formattedAddress;
    }

    if (!ethers.isAddress(formattedAddress)) {
      toast.error("Invalid contract address");
      return;
    }

    try {
      setLoading(true);
      setChainInfo(null);
      const info = await checkContractOnChains(formattedAddress);
      setChainInfo(info);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch contract information");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAnalysis = async () => {
    try {
      if (!editorContent.trim()) {
        toast.error("Please enter contract code");
        return;
      }

      setIsAnalyzing(true);
      setIsAIConfigModalOpen(false);

      const controller = new AbortController();
      setAbortController(controller);

      const contractFile = {
        name: "Contract.sol",
        path: "Contract.sol",
        content: editorContent,
      };

      const result = await analyzeContract({
        files: [contractFile],
        contractName: "Contract",
        signal: controller.signal,
      });

      let analysisContent = result.report.analysis;
      if (!analysisContent.match(/^#\s+/m)) {
        analysisContent = `# Smart Contract Security Analysis Report\n\n${analysisContent}`;
      }

      let languageCfg = getAIConfig(config).language;
      languageCfg = languageCfg === "english" ? "" : `-${languageCfg}`;
      let withSuperPrompt = getAIConfig(config).superPrompt
        ? "-SuperPrompt"
        : "";

      const reportFileName = `report-analysis-${getModelName(
        getAIConfig(config)
      )}${languageCfg}${withSuperPrompt}.md`;

      const reportFile = {
        name: reportFileName,
        path: reportFileName,
        content: analysisContent,
      };

      setAnalysisFiles((prev) => {
        const filesWithoutCurrentModelReport = prev.filter(
          (f) => f.path !== reportFileName
        );
        return [...filesWithoutCurrentModelReport, reportFile];
      });

      toast.success("Analysis completed");
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        toast.success("Analysis cancelled");
      } else {
        console.error("Error in analysis:", error);
        toast.error("Error during analysis");
      }
    } finally {
      setIsAnalyzing(false);
      setAbortController(null);
    }
  };

  const handleCancelAnalysis = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const handleViewReport = (content: string, fileName: string) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${fileName}</title>
            <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
            <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: #1A1A1A;
                color: #E5E5E5;
              }
              h1 {
                color: #E5E5E5;
                border-bottom: 1px solid #333;
                padding-bottom: 0.5em;
              }
              h2 {
                color: #FF8B3E;
                margin-top: 1.5em;
              }
              pre {
                background: #252526;
                padding: 16px;
                border-radius: 4px;
                overflow-x: auto;
                border: 1px solid #333;
              }
              code {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 0.9em;
              }
              p {
                margin: 1em 0;
              }
              ul, ol {
                padding-left: 2em;
              }
              a {
                color: #FF8B3E;
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
              blockquote {
                border-left: 4px solid #FF8B3E;
                margin: 1em 0;
                padding-left: 1em;
                color: #CCCCCC;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                margin: 1em 0;
              }
              th, td {
                border: 1px solid #333;
                padding: 8px;
                text-align: left;
              }
              th {
                background: #252526;
              }
            </style>
          </head>
          <body>
            <div id="content"></div>
            <button id="saveAsImage" style="
              position: fixed;
              top: 20px;
              right: 20px;
              padding: 8px 16px;
              background: #252526;
              color: #FF8B3E;
              border: 1px solid rgba(255,139,62,0.2);
              border-radius: 6px;
              cursor: pointer;
              font-family: system-ui;
              transition: all 0.2s;
            ">Save as Image</button>
            <script>
              document.getElementById('content').innerHTML = marked.parse(\`${content.replace(
                /`/g,
                "\\`"
              )}\`);
              
              document.getElementById('saveAsImage').addEventListener('click', async () => {
                const content = document.getElementById('content');
                try {
                  const canvas = await html2canvas(content, {
                    backgroundColor: '#1A1A1A',
                    scale: 2,
                    useCORS: true,
                    logging: false
                  });
                  
                  const link = document.createElement('a');
                  link.download = '${fileName.replace(".md", "")}.png';
                  link.href = canvas.toDataURL('image/png');
                  link.click();
                } catch (error) {
                  console.error('Error generating image:', error);
                }
              });
            </script>
          </body>
        </html>
      `);
    }
  };

  const handleDownloadReport = (file: ContractFile) => {
    const blob = new Blob([file.content], { type: "text/markdown" });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleRemoveFile = (path: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.path !== path));
    // Reset analysis files when removing a file
    setAnalysisFiles([]);
    // Reset analyzing state and abort controller if needed
    if (isAnalyzing) {
      if (abortController) {
        abortController.abort();
      }
      setIsAnalyzing(false);
      setAbortController(null);
    }
    // Close AI config modal if open
    setIsAIConfigModalOpen(false);
  };

  const handleMultiFileAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Please upload contract files first");
      return;
    }

    try {
      setIsAnalyzing(true);
      setIsAIConfigModalOpen(false);

      const controller = new AbortController();
      setAbortController(controller);

      // Analyze all uploaded files together
      const result = await analyzeContract({
        files: uploadedFiles,
        contractName:
          findMainContract(uploadedFiles, false)?.name.replace(".sol", "") ||
          "MultiContract",
        signal: controller.signal,
        isMultiFile: true,
      });

      let analysisContent = result.report.analysis;
      if (!analysisContent.match(/^#\s+/m)) {
        analysisContent = `# Smart Contract Security Analysis Report\n\n${analysisContent}`;
      }

      // Generate report filename with model info
      let languageCfg = getAIConfig(config).language;
      languageCfg = languageCfg === "english" ? "" : `-${languageCfg}`;
      let withSuperPrompt = getAIConfig(config).superPrompt
        ? "-SuperPrompt"
        : "";

      const reportFileName = `report-analysis-${getModelName(
        getAIConfig(config)
      )}${languageCfg}${withSuperPrompt}.md`;

      const reportFile = {
        name: reportFileName,
        path: reportFileName,
        content: analysisContent,
      };

      setAnalysisFiles((prev) => {
        const filesWithoutCurrentModelReport = prev.filter(
          (f) => f.path !== reportFileName
        );
        return [...filesWithoutCurrentModelReport, reportFile];
      });

      toast.success("Analysis completed");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Analysis failed");
    } finally {
      setIsAnalyzing(false);
      setAbortController(null);
    }
  };

  const handleRemoveReport = (path: string) => {
    setAnalysisFiles((prev) => prev.filter((file) => file.path !== path));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    try {
      // Reset analysis states
      setAnalysisFiles([]);
      setIsAnalyzing(false);
      setIsAIConfigModalOpen(false);
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }

      // Reset input value so the same file can be selected again
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      const contractFiles: ContractFile[] = await Promise.all(
        files.map(async (file) => {
          const content = await file.text();
          return {
            name: file.name,
            path: file.name,
            content: content,
          };
        })
      );
      
      // Update file list, overwrite existing files with the same name
      setUploadedFiles(prevFiles => {
        const newFiles = [...prevFiles];
        
        contractFiles.forEach(newFile => {
          const existingIndex = newFiles.findIndex(f => f.name === newFile.name);
          if (existingIndex !== -1) {
            // If file exists, replace it
            newFiles[existingIndex] = newFile;
          } else {
            // If file doesn't exist, add it
            newFiles.push(newFile);
          }
        });
        
        return newFiles;
      });

      toast.success(`Successfully uploaded ${files.length} file(s)`);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process files');
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="absolute top-4 right-4 text-gray-400">
        The ticker is ETH
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold text-[#E5E5E5] mb-4">
            Smart Contract <span className="text-[#FF8B3E]">Security</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Powered by AI, securing your blockchain future with real-time
            analysis
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <p className="text-gray-400 text-center mb-6">
            Choose your preferred method to analyze smart contracts
          </p>

          <div className="bg-gradient-to-r from-[#1E1E1E] via-[#252526] to-[#1E1E1E] p-1 rounded-xl">
            <div className="bg-[#1A1A1A]/60 rounded-lg p-1 flex gap-1">
              {[
                {
                  id: "address",
                  label: "Address",
                  icon: WalletIcon,
                  desc: "Analyze deployed contracts",
                },
                {
                  id: "single-file",
                  label: "Single File",
                  icon: FileIcon,
                  desc: "Audit a single contract file",
                },
                {
                  id: "multi-files",
                  label: "Multi Files",
                  icon: FilesIcon,
                  desc: "Analyze multiple contract files",
                },
                {
                  id: "repository",
                  label: "Repository",
                  icon: CodeIcon,
                  desc: "GitHub or local folder",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    flex-1 py-3 px-4 rounded-lg
                    transition-all duration-300 ease-out
                    group hover:bg-[#252526]
                    ${
                      activeTab === tab.id
                        ? "bg-[#252526] shadow-lg"
                        : "hover:bg-[#252526]/50"
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-2">
                    <tab.icon
                      className={`w-6 h-6 transition-colors duration-300
                        ${
                          activeTab === tab.id
                            ? "text-[#FF8B3E]"
                            : "text-gray-400 group-hover:text-gray-300"
                        }`}
                    />
                    <span
                      className={`font-medium transition-colors duration-300
                      ${
                        activeTab === tab.id
                          ? "text-[#FF8B3E]"
                          : "text-gray-400 group-hover:text-gray-300"
                      }`}
                    >
                      {tab.label}
                    </span>
                    <span className="text-xs text-gray-500 group-hover:text-gray-400">
                      {tab.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="bg-gradient-to-br from-[#252526] to-[#1E1E1E] rounded-xl p-8 mb-8 border border-[#333333]/50 relative overflow-hidden
            before:absolute before:inset-0 before:p-[1px] before:-m-[1px] before:bg-gradient-to-r before:from-mush-orange/0 before:via-mush-orange/20 before:to-mush-orange/0 before:rounded-xl before:-z-10
            after:absolute after:inset-0 after:p-[1px] after:-m-[1px] after:bg-gradient-to-b after:from-white/10 after:via-white/0 after:to-white/5 after:rounded-xl after:-z-10"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-mush-orange/0 via-mush-orange/30 to-mush-orange/0" />

          <div className="mb-6">
            <h2 className="text-2xl font-medium text-white mb-2">
              {activeTab === "address" && "Enter Contract Address"}
              {activeTab === "single-file" && "Upload Contract File"}
              {activeTab === "multi-files" && "Upload Contract Files"}
              {activeTab === "repository" && "Load Repository Contracts"}
            </h2>
            <p className="text-gray-400">
              {activeTab === "address" &&
                "Enter the deployed contract address to start analysis"}
              {activeTab === "single-file" &&
                "Upload a single Solidity contract file (.sol)"}
              {activeTab === "multi-files" &&
                "Upload multiple related contract files"}
              {activeTab === "repository" &&
                "Load smart contract files from a GitHub repository or select a local cloned folder"}
            </p>
          </div>
          {activeTab === "repository" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <label className="text-sm text-gray-300">GitHub Repository URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. https://github.com/owner/repo or owner/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="flex-1 h-11 bg-[#1A1A1A] border border-[#333333] rounded-lg px-4 text-[#E5E5E5] placeholder-gray-500 focus:outline-none focus:border-[#505050] focus:ring-1 focus:ring-[#505050] text-base"
                  />
                  <button
                    onClick={async () => {
                      if (!repoUrl.trim()) {
                        toast.error("Enter a repository URL");
                        return;
                      }
                      setRepoLoading(true);
                      setRepoError(null);
                      try {
                        const parsed = parseGitHubRepoUrl(repoUrl.trim());
                        if (!parsed) {
                          throw new Error("Invalid repository URL format");
                        }
                        const files = await loadGitHubSolidityFiles(repoUrl.trim(), {
                          token: repoToken ? sanitizeTokenInput(repoToken) : undefined,
                        });
                        if (files.length === 0) {
                          toast.error("No Solidity (.sol) files found");
                        }
                        setRepoFiles(files);
                        // reset analysis state
                        setAnalysisFiles([]);
                        setUploadedFiles([]);
                        toast.success(`Loaded ${files.length} .sol file(s)`);
                      } catch (err: any) {
                        console.error(err);
                        setRepoError(err.message || "Failed to load repository");
                        toast.error("Failed to load repository");
                      } finally {
                        setRepoLoading(false);
                      }
                    }}
                    disabled={repoLoading}
                    className="h-11 inline-flex items-center gap-2 px-5 bg-[#1E1E1E] text-mush-orange text-base font-normal border border-[#333333] rounded-lg transition-all duration-300 hover:bg-mush-orange/10 hover:border-mush-orange/50 disabled:opacity-50"
                  >
                    {repoLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <span>Load Repo</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-300">Optional GitHub Token (increases rate limits)</label>
                  <input
                    type="password"
                    placeholder="ghp_..."
                    value={repoToken}
                    onChange={(e) => setRepoToken(e.target.value)}
                    className="h-11 bg-[#1A1A1A] border border-[#333333] rounded-lg px-4 text-[#E5E5E5] placeholder-gray-500 focus:outline-none focus:border-[#505050] focus:ring-1 focus:ring-[#505050] text-base"
                  />
                </div>
                {repoError && <p className="text-sm text-red-400">{repoError}</p>}
              </div>

              <div className="flex flex-col gap-3 border-t border-[#333333] pt-6">
                <label className="text-sm text-gray-300">Local Cloned Repository Folder</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    // @ts-ignore - non standard attribute
                    webkitdirectory=""
                    multiple
                    accept=".sol"
                    onChange={async (e) => {
                      const fileList = e.target.files;
                      if (!fileList) return;
                      const arr = Array.from(fileList).filter(f => f.name.endsWith(".sol"));
                      if (arr.length === 0) {
                        toast.error("No .sol files in selected folder");
                        return;
                      }
                      const contractFiles: ContractFile[] = await Promise.all(arr.map(async (file) => ({
                        name: file.name,
                        path: (file as any).webkitRelativePath || file.name,
                        content: await file.text(),
                      })));
                      setRepoFiles(contractFiles);
                      setAnalysisFiles([]);
                      setUploadedFiles([]);
                      toast.success(`Loaded ${contractFiles.length} local .sol file(s)`);
                    }}
                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#252526] file:text-mush-orange hover:file:bg-[#333] cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">Directory selection requires Chromium-based browsers or Safari (File System API). Files stay local.</p>
                </div>
              </div>

              {repoFiles.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-gray-400 flex items-center justify-between">
                    <span>Loaded files ({repoFiles.length})</span>
                    <button
                      onClick={() => { setRepoFiles([]); setAnalysisFiles([]); }}
                      className="text-xs text-gray-500 hover:text-gray-300"
                    >Clear</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {repoFiles.map((file) => (
                      <div key={file.path} className="flex items-center justify-between p-3 bg-[#1A1A1A] border border-[#333333] rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300 text-xs truncate max-w-[220px]" title={file.path}>{file.path}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {repoFiles.length > 0 && (
                <>
                  <button
                    onClick={() => setIsAIConfigModalOpen(true)}
                    className="self-end h-11 inline-flex items-center gap-2 px-5 bg-[#1E1E1E] text-mush-orange text-base font-normal border border-[#333333] rounded-lg transition-all duration-300 hover:bg-mush-orange/10 hover:border-mush-orange/50"
                  >
                    <span>Analyze Repository</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <AIConfigModal
                    isOpen={isAIConfigModalOpen}
                    onClose={() => setIsAIConfigModalOpen(false)}
                    onStartAnalysis={async () => {
                      if (repoFiles.length === 0) {
                        toast.error("No repository files loaded");
                        return;
                      }
                      try {
                        setIsAnalyzing(true);
                        setIsAIConfigModalOpen(false);
                        const controller = new AbortController();
                        setAbortController(controller);
                        const result = await analyzeContract({
                          files: repoFiles,
                          contractName: "RepositoryContracts",
                          signal: controller.signal,
                          isMultiFile: true,
                          analysisMode: 'protocol'
                        });
                        let analysisContent = result.report.analysis;
                        if (!analysisContent.match(/^#\s+/m)) {
                          analysisContent = `# Smart Contract Security Analysis Report\n\n${analysisContent}`;
                        }
                        let languageCfg = getAIConfig(config).language;
                        languageCfg = languageCfg === "english" ? "" : `-${languageCfg}`;
                        let withSuperPrompt = getAIConfig(config).superPrompt ? "-SuperPrompt" : "";
                        const reportFileName = `report-analysis-${getModelName(getAIConfig(config))}${languageCfg}${withSuperPrompt}.md`;
                        const reportFile = { name: reportFileName, path: reportFileName, content: analysisContent };
                        setAnalysisFiles((prev) => {
                          const filesWithoutCurrentModelReport = prev.filter((f) => f.path !== reportFileName);
                          return [...filesWithoutCurrentModelReport, reportFile];
                        });
                        toast.success("Repository analysis completed");
                      } catch (err) {
                        console.error(err);
                        toast.error("Repository analysis failed");
                      } finally {
                        setIsAnalyzing(false);
                        setAbortController(null);
                      }
                    }}
                  />
                </>
              )}

              {analysisFiles.length > 0 && repoFiles.length > 0 && (
                <div className="border-t border-[#333333] mt-4 pt-4">
                  <h3 className="text-gray-300 text-sm font-medium mb-2">Analysis Reports:</h3>
                  <div className="space-y-2">
                    {analysisFiles.map((file) => (
                      <div key={file.path} className="bg-[#252526] p-3 rounded-lg border border-[#333333]">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">{file.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewReport(file.content, file.name)}
                              className="text-gray-400 text-sm hover:text-gray-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-[#333333] transition-colors duration-150"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              View
                            </button>
                            <button
                              onClick={() => handleDownloadReport(file)}
                              className="text-gray-400 text-sm hover:text-gray-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-[#333333] transition-colors duration-150"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              Download
                            </button>
                            <button
                              onClick={() => handleRemoveReport(file.path)}
                              className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-[#333333] transition-colors duration-150"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "address" && (
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={address}
                onChange={handleAddressChange}
                placeholder="Enter contract address (0x...)"
                className="flex-1 h-11 bg-[#1A1A1A] border border-[#333333] rounded-lg px-4
                         text-[#E5E5E5] placeholder-gray-500 
                         focus:outline-none focus:border-[#505050]
                         hover:border-[#404040]
                         focus:ring-1 focus:ring-[#505050]
                         transition-[border,box-shadow]
                         duration-200 ease-in-out text-base"
              />
              <button
                onClick={handleCheck}
                disabled={loading}
                className="h-11 inline-flex items-center gap-2 px-5
                         bg-[#1E1E1E] text-mush-orange text-base font-normal
                         border border-[#333333] rounded-lg
                         transition-all duration-300
                         hover:bg-mush-orange/10 hover:border-mush-orange/50
                         whitespace-nowrap
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <span>Check Contract</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === "single-file" && (
            <div className="flex flex-col gap-3">
              <Editor
                height="400px"
                defaultLanguage="sol"
                theme="vs-dark"
                value={editorContent}
                onChange={(value) => {
                  const newContent = value || "";
                  if (newContent !== contractCode) {
                    setAnalysisFiles([]);
                  }
                  setEditorContent(newContent);
                  setContractCode(newContent);
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  roundedSelection: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                }}
              />

              {analysisFiles.length > 0 && (
                <div className="border-t border-[#333333] mt-4 pt-4">
                  <h3 className="text-gray-300 text-sm font-medium mb-2">
                    Analysis Reports:
                  </h3>
                  <div className="space-y-2">
                    {analysisFiles.map((file) => (
                      <div
                        key={file.path}
                        className="bg-[#252526] p-3 rounded-lg border border-[#333333]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">
                            {file.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleViewReport(file.content, file.name)
                              }
                              className="text-gray-400 text-sm hover:text-gray-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-[#333333] transition-colors duration-150"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              View
                            </button>
                            <button
                              onClick={() => handleDownloadReport(file)}
                              className="text-gray-400 text-sm hover:text-gray-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-[#333333] transition-colors duration-150"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              Download
                            </button>
                            <button
                              onClick={() => handleRemoveReport(file.path)}
                              className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-[#333333] transition-colors duration-150"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsAIConfigModalOpen(true)}
                className="self-end h-11 inline-flex items-center gap-2 px-5
                         bg-[#1E1E1E] text-mush-orange text-base font-normal
                         border border-[#333333] rounded-lg
                         transition-all duration-300
                         hover:bg-mush-orange/10 hover:border-mush-orange/50
                         whitespace-nowrap"
              >
                <span>Analyze Contract</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <AIConfigModal
                isOpen={isAIConfigModalOpen}
                onClose={() => setIsAIConfigModalOpen(false)}
                onStartAnalysis={handleStartAnalysis}
              />

              {isAnalyzing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                  <div className="bg-[#1E1E1E] rounded-lg p-8 flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-4">
                      <div className="absolute inset-0 border-4 border-t-[#FF8B3E] border-r-[#FF8B3E]/50 border-b-[#FF8B3E]/30 border-l-[#FF8B3E]/10 rounded-full animate-spin" />
                      <div className="absolute inset-2 bg-[#1E1E1E] rounded-full flex items-center justify-center">
                        <Image
                          src="/mush.png"
                          alt="Loading"
                          width={40}
                          height={40}
                          className="animate-bounce-slow"
                        />
                      </div>
                    </div>
                    <p className="text-[#E5E5E5] text-lg mb-2">
                      Analyzing Contract
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      This may take a few moments...
                    </p>
                    <button
                      onClick={handleCancelAnalysis}
                      className="px-4 py-2 bg-[#252526] text-[#FF8B3E] rounded-md 
                               border border-[#FF8B3E]/20
                               hover:bg-[#FF8B3E]/10 transition-colors
                               font-medium"
                    >
                      Cancel Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "multi-files" && (
            <div className="flex flex-col gap-4">
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border border-dashed border-[#333333] rounded-lg p-8 bg-[#1A1A1A] hover:border-[#505050] transition-colors duration-200"
              >
                <div className="flex flex-col items-center gap-3">
                  <FilesIcon className="w-12 h-12 text-gray-500" />
                  <div className="text-center">
                    <p className="text-gray-300 mb-1">
                      Drag and drop contract files here
                    </p>
                    <p className="text-gray-500 text-sm">or</p>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept=".sol"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <span
                      className="h-9 inline-flex items-center gap-2 px-4
                      bg-[#1E1E1E] text-mush-orange text-sm font-normal
                      border border-[#333333] rounded-lg
                      transition-all duration-300
                      hover:bg-mush-orange/10 hover:border-mush-orange/50
                      cursor-pointer"
                    >
                      Browse files
                    </span>
                  </label>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-gray-400">Selected files:</div>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.path}
                        className="flex items-center justify-between p-3 bg-[#1A1A1A] border border-[#333333] rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300 text-sm">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(file.path)}
                          className="text-gray-500 hover:text-gray-300"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <>
                  <button
                    onClick={() => setIsAIConfigModalOpen(true)}
                    className="self-end h-11 inline-flex items-center gap-2 px-5
                             bg-[#1E1E1E] text-mush-orange text-base font-normal
                             border border-[#333333] rounded-lg
                             transition-all duration-300
                             hover:bg-mush-orange/10 hover:border-mush-orange/50
                             whitespace-nowrap"
                  >
                    <span>Analyze Contract</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  {analysisFiles.length > 0 && (
                    <div className="border-t border-[#333333] mt-4 pt-4">
                      <h3 className="text-gray-300 text-sm font-medium mb-2">
                        Analysis Reports:
                      </h3>
                      <div className="space-y-2">
                        {analysisFiles.map((file) => (
                          <div
                            key={file.path}
                            className="bg-[#252526] p-3 rounded-lg border border-[#333333]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300 text-sm">
                                {file.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleViewReport(file.content, file.name)
                                  }
                                  className="text-gray-400 text-sm hover:text-gray-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-[#333333] transition-colors duration-150"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                  View
                                </button>
                                <button
                                  onClick={() => handleDownloadReport(file)}
                                  className="text-gray-400 text-sm hover:text-gray-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-[#333333] transition-colors duration-150"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                  </svg>
                                  Download
                                </button>
                                <button
                                  onClick={() => handleRemoveReport(file.path)}
                                  className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-[#333333] transition-colors duration-150"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <AIConfigModal
                isOpen={isAIConfigModalOpen}
                onClose={() => setIsAIConfigModalOpen(false)}
                onStartAnalysis={handleMultiFileAnalysis}
              />

              {isAnalyzing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                  <div className="bg-[#1E1E1E] rounded-lg p-8 flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-4">
                      <div className="absolute inset-0 border-4 border-t-[#FF8B3E] border-r-[#FF8B3E]/50 border-b-[#FF8B3E]/30 border-l-[#FF8B3E]/10 rounded-full animate-spin" />
                      <div className="absolute inset-2 bg-[#1E1E1E] rounded-full flex items-center justify-center">
                        <Image
                          src="/mush.png"
                          alt="Loading"
                          width={40}
                          height={40}
                          className="animate-bounce-slow"
                        />
                      </div>
                    </div>
                    <p className="text-[#E5E5E5] text-lg mb-2">
                      Analyzing Contract
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      This may take a few moments...
                    </p>
                    <button
                      onClick={handleCancelAnalysis}
                      className="px-4 py-2 bg-[#252526] text-[#FF8B3E] rounded-md 
                               border border-[#FF8B3E]/20
                               hover:bg-[#FF8B3E]/10 transition-colors
                               font-medium"
                    >
                      Cancel Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {activeTab === "address" &&
          chainInfo &&
          Object.entries(chainInfo).map(
            ([chain, info]) =>
              info?.exists && (
                <ContractInfoCard
                  key={chain}
                  chainInfo={info}
                  chain={chain}
                  address={address}
                />
              )
          )}
      </main>

      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-mush-orange/0 via-mush-orange/30 to-mush-orange/0" />
    </div>
  );
}
