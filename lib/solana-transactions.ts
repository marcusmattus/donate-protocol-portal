import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js"

const SOLANA_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com"

export const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed")

// Charity wallets on testnet
export const CHARITY_WALLETS = {
  "solar-future": "SoLxCyJhZvfJqTYGdvfKEYvStvfQDPmqAXgBEqGW1hF",
  "kids-first-dao": "KiDS8PFtzrPSTYmKYd6JBSJ8Th82Yiod3yMMsQHpUKP",
  "open-water-relief": "OpWatr567xB6KJ8qLpM9KdHpJm4nX2rVT8wVkYpU3hB",
  "climate-action-accelerator": "ClimateAct123XYZ9qK8Lp2MnOpQrStUvWxYzAbCdEfGh",
  "web3-education-collective": "Web3Edu456ABC9xY8zQrStUvWxYzAbCdEfGhIjKlMnOp",
  "animal-welfare-fund": "AnimalWelfare789XyZ2QrStUvWxYzAbCdEfGhIjKlMnOpQr",
}

export interface SolanaTransaction {
  signature: string
  status: "success" | "pending" | "failed"
  amount: number
  recipient: string
  timestamp: string
  charityId: string
}

/**
 * Send SOL to a charity wallet on testnet
 * @param fromPublicKey - User's wallet public key
 * @param toCharityId - Charity ID to send to
 * @param amountSol - Amount in SOL
 * @param signTransaction - Function to sign the transaction
 * @returns Transaction signature and status
 */
export async function sendDonationTransaction(
  fromPublicKey: PublicKey,
  toCharityId: string,
  amountSol: number,
  signTransaction: (transaction: Transaction) => Promise<Transaction>
): Promise<SolanaTransaction> {
  try {
    const charityWallet = CHARITY_WALLETS[toCharityId as keyof typeof CHARITY_WALLETS]

    if (!charityWallet) {
      throw new Error(`Invalid charity ID: ${toCharityId}`)
    }

    const toPublicKey = new PublicKey(charityWallet)

    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash("confirmed")

    // Create transaction
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: fromPublicKey,
    })

    // Add transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
      })
    )

    // Sign transaction
    const signedTransaction = await signTransaction(transaction)

    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      }
    )

    // Confirm transaction
    await connection.confirmTransaction(signature, "confirmed")

    return {
      signature,
      status: "success",
      amount: amountSol,
      recipient: charityWallet,
      timestamp: new Date().toISOString(),
      charityId: toCharityId,
    }
  } catch (error) {
    console.error("Transaction error:", error)
    return {
      signature: "",
      status: "failed",
      amount: amountSol,
      recipient: CHARITY_WALLETS[toCharityId as keyof typeof CHARITY_WALLETS] || "",
      timestamp: new Date().toISOString(),
      charityId: toCharityId,
    }
  }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(signature: string) {
  try {
    const transaction = await connection.getTransaction(signature, {
      commitment: "confirmed",
    })

    return {
      signature,
      status: transaction ? "success" : "pending",
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error getting transaction status:", error)
    return {
      signature,
      status: "failed",
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Get charity wallet balance
 */
export async function getCharityBalance(charityId: string): Promise<number> {
  try {
    const wallet =
      CHARITY_WALLETS[charityId as keyof typeof CHARITY_WALLETS]
    if (!wallet) return 0

    const publicKey = new PublicKey(wallet)
    const balance = await connection.getBalance(publicKey)
    return balance / LAMPORTS_PER_SOL
  } catch (error) {
    console.error("Error getting balance:", error)
    return 0
  }
}

/**
 * Validate wallet address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

/**
 * Get airdrop for testnet (devnet only)
 */
export async function requestTestnetAirdrop(
  publicKey: PublicKey,
  amountSol: number = 1
): Promise<string> {
  try {
    // Only works on devnet
    const signature = await connection.requestAirdrop(
      publicKey,
      Math.floor(amountSol * LAMPORTS_PER_SOL)
    )

    await connection.confirmTransaction(signature, "confirmed")
    return signature
  } catch (error) {
    console.error("Airdrop error:", error)
    throw error
  }
}
