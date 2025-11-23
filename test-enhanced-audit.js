const { analyzeContract } = require('./src/services/audit/contractAnalyzer');

async function testEnhancedAudit() {
  console.log('🚀 Testing Enhanced DeFi Security Audit Tool on Centrifuge Protocol V3...');
  
  try {
    const result = await analyzeContract({
      contractPath: '/home/dok/web3/protocol-3.0.1/src/hub/Hub.sol',
      analysisMode: 'protocol',
      enableCrossContractAnalysis: true,
      enableEconomicSimulation: true,
      enableThreatIntelligence: true,
      enableProxyAnalysis: true,
      enableSignatureAnalysis: true
    });
    
    console.log('✅ Analysis completed successfully!');
    console.log('📊 Results:', JSON.stringify(result, null, 2));
    
    // Check for any issues or bugs in the tool
    if (result.errors && result.errors.length > 0) {
      console.log('🐛 Tool Issues Found:', result.errors);
    }
    
    if (result.warnings && result.warnings.length > 0) {
      console.log('⚠️ Tool Warnings:', result.warnings);
    }
    
  } catch (error) {
    console.error('❌ Tool Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testEnhancedAudit();