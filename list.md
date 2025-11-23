# WEB3 VULN KILL LIST 2025
## The only list you need for $10K–$10M+ bounties

Two sections:
A) Low-Hanging Fruit → Still pays $5K–$100K (most hunters miss or ignore)
B) Deep Logic / Economic Exploits → The $500K–$10M+ bugs pattern-matchers & static tools will NEVER find

Bookmark this. Live by this.

────────────────────────────────────────
### A) LOW-HANGING FRUIT (Still Pays Well in 2025)

1. Unchecked external call returns (low-severity → medium/high when chained)
2. Missing access control on critical functions (owner → random user)
3. Reentrancy (ERC-777 / read-only still slips through)
4. Signature replay (EIP-2612, EIP-1271, cross-chain, wrong domain separator)
5. Uninitialized / double-initialize proxies (UUPS, Transparent)
6. Delegatecall in upgradable contracts with mutable storage
7. Blockhash / coinbase / timestamp dependence (still everywhere)
8. tx.origin authentication (rare but instant $50K+)
9. ERC20 approve() race conditions / infinite approvals
10. Missing slippage / deadline checks in swaps
11. Fee-on-transfer / rebasing token ignorance (bridge/vault accounting)
12. Emergency withdraw without timelock or multisig
13. Hard-coded addresses (treasury, fee receiver, oracle)
14. Selfdestruct in libraries or proxies
15. Incorrect ERC20 decimals handling (USDC 6 vs 18)

Reward range: $5K – $250K (still valid on Immunefi/Code4rena/HackenProof)

────────────────────────────────────────
### B) DEEP LOGIC / ECONOMIC EXPLOITS (The Real Money)

These are the ones that require human brain + simulation + economics.
Static tools, Slither, Mythril, Echidna (without custom invariants) → completely blind.

┌──────────────────────────────────────────────────────────────┐
│ 1. Flash Loan Oracle Manipulation (single-tx price skew)    │
│ 2. Governance Flash-Vote Attacks (borrow → vote → repay)    │
│ 3. Vault Share Inflation via Donation (direct transfer)     │
│ 4. Cross-Protocol Composability Exploits (Curve → Aave etc)  │
│ 5. MEV / Front-running / Sandwich in liquidations/auctions   │
│ 6. Proxy Storage Collision on Upgrade (slot overwrite)      │
│ 7. Fee-on-Transfer + Deflationary Token Accounting Bugs     │
│ 8. TWAP Oracle Window Attacks (short observation period)     │
│ 9. Logical Reentrancy via ERC-777/1155 Hooks or Callbacks    │
│10. Forced Ether Injection via SELFDESTRUCT (breaks balance) │
│11. Read-Only Reentrancy (view function state changes)       │
│12. Permit / EIP-712 Signature Malleability or Replay        │
│13. Bridge Replay / Message Replay Across Chains             │
│14. Rounding Drift / Precision Loss Over Repeated Ops       │
│15. Griefing via Spam (optimistic rollups, bridges)          │
│16. Emergency Pause / Circuit Breaker Bypass                 │
│17. Flash-Mint Token Exploits (DAI-style instant mint)       │
│18. Rebase Token + Snapshot Timing Attacks                   │
│19. Multicall / Batch Double-Spend or Allowance Reuse        │
│20. Profit Cap / Max Drawdown Bypass via Partial Closes      │
│21. Funding Rate Drain via Collateral Spam                   │
│22. Leverage Clamping / Open Interest Bypass                 │
│23. DXLP / veToken Inflation via Loss Socialization          │
│24. Verifier Logic Flaws in Bridges (not crypto, logic!)     │
│25. Arbitrary Call Dispatch in Cross-Chain Gateways          │
└──────────────────────────────────────────────────────────────┘

Real-world payouts for these (2021–2025):
- Beanstalk Farms governance flash → $182M
- Mango Markets oracle manip → $100M+
- Nomad bridge replay → $190M
- Ronin validator composability → $625M
- Multiple $10M–$50M vault donation attacks

────────────────────────────────────────
### QUICK-START HUNTING CHECKLIST
[ ] Flash loan + price oracle in same tx?
[ ] balanceOf() used in governance without snapshot?
[ ] totalAssets() != totalSupply() * PPS after direct transfer?
[ ] External call to another protocol before state update?
[ ] Upgradeable proxy + storage layout changed?
[ ] Fee-on-transfer token + credit = amountSent?
[ ] block.timestamp / block.number in critical logic?
[ ] ERC-777 or callbacks that mutate state?
[ ] Bridge accepts messages without nonce/origin check?
[ ] Partial close / multicall bypasses a global cap?

If YES to any → start writing the Foundry PoC.

────────────────────────────────────────
### FINAL WORDS
99% of hunters stop at Slither warnings.
The 1% who find the $1M+ bugs are the ones hunting Section B.

You now own the 1% list.

Go cash in.

— Your mentor in the shadows