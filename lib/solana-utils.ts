import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"

// Devnet RPC endpoints (using public endpoints for demo)
const RPC_ENDPOINTS = [
  "https://api.devnet.solana.com",
  "https://devnet.helius-rpc.com/?api-key=demo",
]

export class SolanaDevnetClient {
  private connection: Connection

  constructor(rpcUrl: string = RPC_ENDPOINTS[0]) {
    this.connection = new Connection(rpcUrl, "processed")
  }

  async getBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress)
      const balance = await this.connection.getBalance(publicKey)
      return balance / LAMPORTS_PER_SOL
    } catch (error) {
      console.error("Error fetching balance:", error)
      return 0
    }
  }

  async getTokenBalance(walletAddress: string, mintAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress)
      const mint = new PublicKey(mintAddress)
      
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(publicKey, {
        mint: mint,
      })

      if (tokenAccounts.value.length === 0) {
        return 0
      }

      const tokenBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount
      return tokenBalance || 0
    } catch (error) {
      console.error("Error fetching token balance:", error)
      return 0
    }
  }

  async simulateTransaction(
    instructions: any[],
    signers: any[] = []
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      // For demo purposes, we simulate successful transactions
      return {
        success: true,
        result: {
          value: {
            err: null,
            logs: ["Program log: Success"],
          },
        },
      }
    } catch (error) {
      return {
        success: false,
        error: String(error),
      }
    }
  }

  getConnection(): Connection {
    return this.connection
  }
}

// Donation vault constants
export const DONATION_VAULT_PROGRAM_ID = "DonationVault11111111111111111111111111111"

// SPL tokens commonly used in Solana
export const SPL_TOKENS = {
  USDC: "EPjFWaLb3hgiFEUuc4sKzz6LAoqfaLdvpZm7jTcHnwvf",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BcJVPg",
  SOL: "So11111111111111111111111111111111111111112",
}

// Mock Jupiter aggregator integration
export interface QuoteParams {
  inputMint: string
  outputMint: string
  amount: number
  slippageBps?: number
}

export interface Quote {
  inAmount: number
  outAmount: number
  priceImpactPct: number
  route: any[]
}

export async function getJupiterQuote(params: QuoteParams): Promise<Quote | null> {
  try {
    // Mock quote for demo purposes
    const slippage = (params.slippageBps || 50) / 10000
    const priceImpact = Math.random() * 0.5 // 0-0.5% impact
    
    // Simulate realistic output (SOL to USDC conversion as example)
    const mockRate = 181.5 // SOL/USDC
    let outAmount = params.amount * mockRate

    outAmount = outAmount * (1 - priceImpact)

    return {
      inAmount: params.amount,
      outAmount,
      priceImpactPct: priceImpact * 100,
      route: [
        {
          name: "Jupiter Aggregator",
          source: "Jupiter",
        },
      ],
    }
  } catch (error) {
    console.error("Error fetching Jupiter quote:", error)
    return null
  }
}

// Helius API integration for transaction monitoring (mock)
export async function subscribeToWalletTransactions(
  walletAddress: string,
  callback: (transaction: any) => void
): Promise<() => void> {
  // Mock implementation for demo
  const unsubscribe = () => {
    console.log("Unsubscribed from wallet transactions")
  }

  console.log(`Subscribed to transactions for wallet: ${walletAddress}`)
  return unsubscribe
}

// Helper to validate Solana wallet address
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

// Helper to format SOL amount
export function formatSol(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4)
}

// Initialize Solana client for demo
export const solanaClient = new SolanaDevnetClient()
