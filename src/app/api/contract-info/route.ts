import { NextRequest, NextResponse } from "next/server";
import { getApiScanConfig, getExplorerUrl } from "@/utils/chainServices";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");
  const chain = searchParams.get("chain");

  if (!address || !chain) {
    return NextResponse.json(
      { error: "Missing address or chain" },
      { status: 400 }
    );
  }

  try {
    // Aurora chain
    if (chain === "aurora") {
      const auroraUrl = `https://explorer.mainnet.aurora.dev/api/v2/smart-contracts/${address}`;
      const response = await fetch(auroraUrl);
      const data = await response.json();

      const { url: apiUrl, apiKey, chainId } = getApiScanConfig(chain);
      const creationUrl = `${apiUrl}?chainid=${chainId}&module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${apiKey}`;
      const creationResponse = await fetch(creationUrl);
      const creationData = await creationResponse.json();

      let creator = "";
      let creationTxHash = "";

      // Get creation info
      if (creationData.status === "1" && creationData.result?.[0]) {
        creator = creationData.result[0].contractCreator;
        creationTxHash = creationData.result[0].txHash;
      }

      return NextResponse.json({
        contractName: data.name || "",
        compiler: data.compiler_version || "",
        optimization: data.optimization_enabled || false,
        runs: data.optimization_runs || 200,
        evmVersion: data.evm_version || "default",
        creationCode: data.creation_bytecode || "",
        deployedBytecode: data.deployed_bytecode || "",
        implementation: data.proxy_type ? data.implementations[0] : null,
        creator: creator,
        creationTxHash: creationTxHash,
      });
    } else {
      // other chain
      const { url: apiUrl, apiKey, chainId } = getApiScanConfig(chain);

      // 1. Get contract bytecode
      const bytecodeUrl = `${apiUrl}?chainid=${chainId}&module=proxy&action=eth_getCode&address=${address}&tag=latest&apikey=${apiKey}`;
      const bytecodeResponse = await fetch(bytecodeUrl);
      const bytecodeData = await bytecodeResponse.json();

      // 2. Get contract creation code and creator info
      const creationUrl = `${apiUrl}?chainid=${chainId}&module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${apiKey}`;
      const creationResponse = await fetch(creationUrl);
      const creationData = await creationResponse.json();

      let creationCode = "";
      let creator = "";
      let creationTxHash = "";

      // Get creation info
      if (creationData.status === "1" && creationData.result?.[0]) {
        creationCode = creationData.result[0].creationBytecode;
        creator = creationData.result[0].contractCreator;
        creationTxHash = creationData.result[0].txHash;
      }

      // not found
      if (creationCode === "" || creationCode === undefined) {
        creationCode = "";
      }

      // Get contract source code information
      const sourceUrl = `${apiUrl}?chainid=${chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
      const sourceResponse = await fetch(sourceUrl);
      const sourceData = await sourceResponse.json();

      // Get deployed bytecode
      let deployedBytecode = bytecodeData.result || "";
      // not found
      if (deployedBytecode === "" || deployedBytecode === undefined) {
        deployedBytecode = "";
      }

      return NextResponse.json({
        contractName: sourceData.result[0]?.ContractName || "",
        compiler: sourceData.result[0]?.CompilerVersion || "",
        optimization: sourceData.result[0]?.OptimizationUsed === "1",
        runs: parseInt(sourceData.result[0]?.Runs) || 200,
        evmVersion: sourceData.result[0]?.EVMVersion || "default",
        creationCode,
        deployedBytecode: deployedBytecode,
        implementation: sourceData.result[0]?.Implementation,
        creator,
        creationTxHash,
      });
    }
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json(
      { error: "Failed to fetch contract info" },
      { status: 500 }
    );
  }
}
