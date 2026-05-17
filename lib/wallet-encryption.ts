/**
 * Private Wallet System
 * Stores encrypted wallet data and manages user authentication
 */

import { encode as base64Encode, decode as base64Decode } from "js-base64"
import crypto from "crypto"

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "donate-protocol-secure-key-2026"
const IV_LENGTH = 16

interface PrivateWallet {
  id: string
  userId: string
  publicKey: string
  encryptedPrivateKey: string
  walletType: "phantom" | "solflare" | "keypair" | "ledger"
  createdAt: Date
  lastUsed?: Date
  isActive: boolean
}

interface ExchangeConnection {
  id: string
  userId: string
  exchangeName: "kraken" | "binance" | "coinbase" | "tradingview"
  encryptedApiKey: string
  encryptedApiSecret: string
  encryptedAccessToken?: string
  webhookUrl?: string
  createdAt: Date
  isActive: boolean
  autoTrade: boolean
}

/**
 * Encrypt sensitive data (AES-256-GCM)
 */
export function encryptData(data: string, key: string = ENCRYPTION_KEY): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(key.padEnd(32, "0").slice(0, 32)),
      iv
    )

    let encrypted = cipher.update(data, "utf8", "hex")
    encrypted += cipher.final("hex")

    const authTag = cipher.getAuthTag()
    return base64Encode(`${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`)
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt data")
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string, key: string = ENCRYPTION_KEY): string {
  try {
    const decoded = base64Decode(encryptedData)
    const [ivHex, encrypted, authTagHex] = decoded.split(":")

    const iv = Buffer.from(ivHex, "hex")
    const authTag = Buffer.from(authTagHex, "hex")

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(key.padEnd(32, "0").slice(0, 32)),
      iv
    )

    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error("Failed to decrypt data")
  }
}

/**
 * Hash sensitive data (for comparison)
 */
export function hashData(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex")
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

/**
 * Validate wallet data structure
 */
export function validateWallet(wallet: any): wallet is PrivateWallet {
  return (
    wallet.id &&
    wallet.userId &&
    wallet.publicKey &&
    wallet.encryptedPrivateKey &&
    ["phantom", "solflare", "keypair", "ledger"].includes(wallet.walletType) &&
    typeof wallet.isActive === "boolean"
  )
}

/**
 * Validate exchange connection
 */
export function validateExchangeConnection(conn: any): conn is ExchangeConnection {
  return (
    conn.id &&
    conn.userId &&
    ["kraken", "binance", "coinbase", "tradingview"].includes(conn.exchangeName) &&
    conn.encryptedApiKey &&
    (conn.encryptedApiSecret || conn.encryptedAccessToken)
  )
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, showChars: number = 4): string {
  if (data.length <= showChars) return "***"
  return data.slice(0, showChars) + "*".repeat(Math.max(0, data.length - showChars - 4)) + data.slice(-4)
}

export interface WalletConfig {
  solanaRpc?: string
  ethereumRpc?: string
  encryptionKey?: string
}

export class WalletManager {
  private config: WalletConfig

  constructor(config: WalletConfig = {}) {
    this.config = {
      solanaRpc: config.solanaRpc || "https://api.devnet.solana.com",
      ethereumRpc: config.ethereumRpc || "https://sepolia.infura.io/v3/YOUR_KEY",
      encryptionKey: config.encryptionKey || ENCRYPTION_KEY,
    }
  }

  /**
   * Create encrypted wallet backup
   */
  createBackup(wallet: PrivateWallet, password: string): string {
    const backupData = JSON.stringify({
      wallet,
      timestamp: new Date().toISOString(),
      version: "1.0",
    })

    return encryptData(backupData, password)
  }

  /**
   * Restore wallet from backup
   */
  restoreBackup(backup: string, password: string): PrivateWallet | null {
    try {
      const decrypted = decryptData(backup, password)
      const data = JSON.parse(decrypted)
      return data.wallet
    } catch (error) {
      console.error("Backup restore error:", error)
      return null
    }
  }
}
