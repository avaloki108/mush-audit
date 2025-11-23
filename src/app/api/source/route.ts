import { NextRequest, NextResponse } from 'next/server';
import type { ContractFile } from '@/types/blockchain';
import { getApiScanConfig } from '@/utils/chainServices';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const chain = searchParams.get('chain');

  if (!address || !chain) {
    return NextResponse.json(
      { error: 'Address and chain are required' },
      { status: 400 }
    );
  }

  try {
    const { url, apiKey, chainId } = getApiScanConfig(chain);
    const buildApiUrl = (action: string, targetAddress: string) =>
      `${url}?chainid=${chainId}&module=contract&action=${action}&address=${targetAddress}&apikey=${apiKey}`;
    
    // // 1. Try to get source code from blockscan
    // try {
    //   const blockscanResponse = await fetch(`${blockscanUrl}/${address}`);
    //   if (blockscanResponse.ok) {
    //     const blockscanData = await blockscanResponse.json();
    //     if (blockscanData.result) {
    //       // Process blockscan response data
    //       return NextResponse.json({
    //         files: blockscanData.result.files,
    //         settings: blockscanData.result.settings,
    //         contractName: blockscanData.result.name,
    //         compiler: blockscanData.result.compiler,
    //         optimization: blockscanData.result.settings?.optimizer?.enabled || false,
    //         runs: blockscanData.result.settings?.optimizer?.runs || 200
    //       });
    //     }
    //   }
    // } catch (e) {
    //   console.log('Failed to fetch from blockscan, falling back to etherscan');
    // }

    // 2. If blockscan fails, fallback to etherscan
    const apiUrl = buildApiUrl('getsourcecode', address);
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status === '1' && data.result[0]) {
      const result = data.result[0];
      
      if (result.SourceCode === '') {
        return NextResponse.json(
          { error: 'Contract source code not verified' },
          { status: 404 }
        );
      }

      const files: ContractFile[] = [];
      const filteredFiles: ContractFile[] = [];
      let settings = null;
      
      // Handle multi-file contract case
      if (result.SourceCode.startsWith('{')) {
        try {
          const sourceString = result.SourceCode.substring(1, result.SourceCode.length - 1);
          const parsed = JSON.parse(sourceString);
          
          // Extract compiler settings
          if (parsed.settings) {
            settings = parsed.settings;
          }
          
          // Process source files
          if (parsed.sources) {
            Object.entries(parsed.sources).forEach(([path, fileInfo]: [string, any]) => {
              files.push({
                name: path.split('/').pop() || path,
                path: path,
                content: fileInfo.content
              });
            });
          } else {
            Object.entries(parsed).forEach(([path, content]: [string, any]) => {
              files.push({
                name: path.split('/').pop() || path,
                path: path,
                content: typeof content === 'string' ? content : content.content
              });
            });
          }
        } catch (e) {
          console.error('Error parsing multi-file contract:', e);
          files.push({
            name: `${result.ContractName}.sol`,
            path: `${result.ContractName}.sol`,
            content: result.SourceCode
          });
        }
      } else {
        files.push({
          name: `${result.ContractName}.sol`,
          path: `${result.ContractName}.sol`,
          content: result.SourceCode
        });
      }

      // Create default settings.json
      if (!settings) {
        settings = {
          remappings: [],
          optimizer: {
            enabled: result.OptimizationUsed === '1',
            runs: parseInt(result.Runs) || 200
          },
          metadata: {
            bytecodeHash: "none"
          },
          outputSelection: {
            "*": {
              "*": [
                "evm.bytecode",
                "evm.deployedBytecode",
                "devdoc",
                "userdoc",
                "metadata",
                "abi"
              ]
            }
          }
        };
      }

      // Check if this is a proxy contract
      const isProxy = result.Implementation && result.Implementation !== '0x0000000000000000000000000000000000000000';

      if (isProxy) {
        // Process proxy contract source code
        if (result.SourceCode.startsWith('{')) {
          try {
            const sourceString = result.SourceCode.substring(1, result.SourceCode.length - 1);
            const parsed = JSON.parse(sourceString);
            
            if (parsed.sources) {
              // Add proxy contract files
              Object.entries(parsed.sources).forEach(([path, fileInfo]: [string, any]) => {
                filteredFiles.push({
                  name: path.split('/').pop() || path,
                  path: `proxy/${path}`,  // Add proxy/ prefix
                  content: fileInfo.content
                });
              });
            }
          } catch (e) {
            filteredFiles.push({
              name: `${result.ContractName}.sol`,
              path: `proxy/${result.ContractName}.sol`,  // Add proxy/ prefix
              content: result.SourceCode
            });
          }
        } else {
          filteredFiles.push({
            name: `${result.ContractName}.sol`,
            path: `proxy/${result.ContractName}.sol`,  // Add proxy/ prefix
            content: result.SourceCode
          });
        }

        // Get implementation contract source code
        const implUrl = buildApiUrl('getsourcecode', result.Implementation);
        const implResponse = await fetch(implUrl);
        const implData = await implResponse.json();

        if (implData.status === '1' && implData.result[0]) {
          const implResult = implData.result[0];
          
          if (implResult.SourceCode.startsWith('{')) {
            try {
              const sourceString = implResult.SourceCode.substring(1, implResult.SourceCode.length - 1);
              const parsed = JSON.parse(sourceString);
              
              if (parsed.sources) {
                // Add implementation contract files
                Object.entries(parsed.sources).forEach(([path, fileInfo]: [string, any]) => {
                  filteredFiles.push({
                    name: path.split('/').pop() || path,
                    path: `implementation/${path}`,  // Add implementation/ prefix
                    content: fileInfo.content
                  });
                });
              }
            } catch (e) {
              filteredFiles.push({
                name: `${implResult.ContractName}.sol`,
                path: `implementation/${implResult.ContractName}.sol`,  // Add implementation/ prefix
                content: implResult.SourceCode
              });
            }
          } else {
            filteredFiles.push({
              name: `${implResult.ContractName}.sol`,
              path: `implementation/${implResult.ContractName}.sol`,  // Add implementation/ prefix
              content: implResult.SourceCode
            });
          }
        }
      } else {
        // Process non-proxy contract source code
        if (result.SourceCode.startsWith('{')) {
          try {
            const sourceString = result.SourceCode.substring(1, result.SourceCode.length - 1);
            const parsed = JSON.parse(sourceString);
            
            if (parsed.sources) {
              // Add source files
              Object.entries(parsed.sources).forEach(([path, fileInfo]: [string, any]) => {
                filteredFiles.push({
                  name: path.split('/').pop() || path,
                  path: path,  // No prefix for non-proxy contracts
                  content: fileInfo.content
                });
              });
            }
          } catch (e) {
            filteredFiles.push({
              name: `${result.ContractName}.sol`,
              path: `${result.ContractName}.sol`,  // No prefix for non-proxy contracts
              content: result.SourceCode
            });
          }
        } else {
          filteredFiles.push({
            name: `${result.ContractName}.sol`,
            path: `${result.ContractName}.sol`,  // No prefix for non-proxy contracts
            content: result.SourceCode
          });
        }
      }

      // Get contract ABI
      const abiUrl = buildApiUrl('getabi', address);
      const abiResponse = await fetch(abiUrl);
      const abiData = await abiResponse.json();

      let contractABI = [];
      let implementationABI = [];

      if (abiData.status === '1' && abiData.result) {
        try {
          contractABI = JSON.parse(abiData.result);
        } catch (e) {
          console.error('Error parsing ABI:', e);
        }
      }

      // If proxy contract, also get implementation contract ABI
      if (isProxy && result.Implementation) {
        const implAbiUrl = buildApiUrl('getabi', result.Implementation);
        const implAbiResponse = await fetch(implAbiUrl);
        const implAbiData = await implAbiResponse.json();

        if (implAbiData.status === '1' && implAbiData.result) {
          try {
            implementationABI = JSON.parse(implAbiData.result);
          } catch (e) {
            console.error('Error parsing implementation ABI:', e);
          }
        }
      }

      return NextResponse.json({
        files: filteredFiles,
        settings,
        contractName: result.ContractName,
        compiler: result.CompilerVersion,
        optimization: settings.optimizer.enabled,
        runs: settings.optimizer.runs,
        abi: contractABI,
        implementationAbi: implementationABI,
        // ... other return fields ...
      });
    }
    
    throw new Error('Failed to fetch contract source');
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract source' },
      { status: 500 }
    );
  }
} 
