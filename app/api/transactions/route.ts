import { NextRequest, NextResponse } from "next/server"
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js"

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com"
const connection = new Connection(SOLANA_RPC, "confirmed")

// Charity wallet mappings
const CHARITY_WALLETS: Record<string, string> = {
  "solar-future": "SoLxCyJhZvfJqTYGdvfKEYvStvfQDPmqAXgBEqGW1hF",
  "kids-first-dao": "KiDS8PFtzrPSTYmKYd6JBSJ8Th82Yiod3yMMsQHpUKP",
  "open-water-relief": "OpWatr567xB6KJ8qLpM9KdHpJm4nX2rVT8wVkYpU3hB",
  "climate-action-accelerator": "ClimateAct123XYZ9qK8Lp2MnOpQrStUvWxYzAbCdEfGh",
  "web3-education-collective": "Web3Edu456ABC9xY8zQrStUvWxYzAbCdEfGhIjKlMnOp",
  "animal-welfare-fund": "AnimalWelfare789XyZ2QrStUvWxYzAbCdEfGhIjKlMnOpQr",
}

interface DonationRequest {
  walletAddress: string
  charityId: string
  amountSol: number
}

/**
 * GET /api/transactions
 * Get transaction history for a wallet
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const wallet = searchParams.get("wallet")
  const charityId = searchParams.get("charity")

  if (!wallet) {
    return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
  }

  try {
    const publicKey = new PublicKey(wallet)
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit: 10,
    })

    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await connection.getTransaction(sig.signature, {
          commitment: "confirmed",
        })
        return {
          signature: sig.signature,
          status: sig.err ? "failed" : "success",
          timestamp: new Date((sig.blockTime || 0) * 1000).toISOString(),
          slot: sig.slot,
        }
      })
    )

    return NextResponse.json({
      wallet,
      transactions,
      count: transactions.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transactions
 * Create a new donation transaction (client-side signing)
 */
export async function POST(request: NextRequest) {
  try {
    const body: DonationRequest = await request.json()
    const { walletAddress, charityId, amountSol } = body

    // Validate inputs
    if (!walletAddress || !charityId || !amountSol || amountSol <= 0) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      )
    }

    const charityWallet = CHARITY_WALLETS[charityId]
    if (!charityWallet) {
      return NextResponse.json(
        { error: "Invalid charity ID" },
        { status: 400 }
      )
    }

    // Validate addresses
    try {
      new PublicKey(walletAddress)
      new PublicKey(charityWallet)
    } catch {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      )
    }

    // Return transaction template for client to sign
    const { blockhash } = await connection.getLatestBlockhash("confirmed")

    return NextResponse.json({
      success: true,
      transaction: {
        recentBlockhash: blockhash,
        fromWallet: walletAddress,
        toWallet: charityWallet,
        amount: amountSol,
        lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
        charityId,
      },
      message: "Transaction template created. Sign with your wallet.",
    })
  } catch (error) {
    console.error("Transaction error:", error)
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    )
  }
}
