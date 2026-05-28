// Shared data access for the MCP server.
// Re-exports the demo dataset and Solana simulators from the monorepo lib,
// so the agent and the web app stay in lockstep on a single source of truth.

export {
  CHARITIES,
  STRATEGIES,
  DEMO_USERS,
  RECENT_SIGNALS,
  DONATIONS,
  CATEGORY_META,
  findCharity,
  findStrategy,
  formatUSD,
  shortWallet,
  timeAgo,
} from "../../../lib/demo-data"

export type {
  Charity,
  CharityCategory,
  Strategy,
  DemoUser,
  TradeSignal,
  DonationEvent,
} from "../../../lib/demo-data"

export {
  runRiskCheck,
  simulateTradeAndDonation,
  mockJupiterQuote,
  generateDemoTx,
} from "../../../lib/solana"
