/**
 * Exchange Connection System
 * Handles API key storage, webhooks, and auto-trading
 */

import { encryptData, decryptData, hashData, generateSecureToken } from "./wallet-encryption"

export interface ExchangeConfig {
  apiKey: string
  apiSecret: string
  accessToken?: string
  webhookSecret?: string
}

export interface AutoTradeConfig {
  enabled: boolean
  minProfit: number
  maxLoss: number
  maxTradeSize: number
  autoWithdraw: boolean
  donationPercentage: number
}

export interface ExchangeWebhook {
  id: string
  exchangeName: string
  userId: string
  url: string
  secret: string
  isActive: boolean
  createdAt: Date
}

/**
 * Store encrypted exchange credentials
 */
export async function storeExchangeCredentials(
  userId: string,
  exchange: string,
  config: ExchangeConfig
): Promise<{
  id: string
  encryptedKey: string
  encryptedSecret: string
  webhookUrl: string
}> {
  const id = generateSecureToken(12)
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/exchange/${id}`

  return {
    id,
    encryptedKey: encryptData(config.apiKey),
    encryptedSecret: encryptData(config.apiSecret),
    webhookUrl,
  }
}

/**
 * Retrieve and decrypt exchange credentials
 */
export function getExchangeCredentials(
  encryptedKey: string,
  encryptedSecret: string
): ExchangeConfig {
  return {
    apiKey: decryptData(encryptedKey),
    apiSecret: decryptData(encryptedSecret),
  }
}

/**
 * Generate webhook signature for verification
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  const crypto = require("crypto")
  return crypto.createHmac("sha256", secret).update(payload).digest("hex")
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret)
  return signature === expectedSignature
}

/**
 * Auto-login configuration for exchanges
 */
export interface AutoLoginConfig {
  exchangeName: string
  userId: string
  encryptedCredentials: string
  lastLogin?: Date
  autoRefresh: boolean
  refreshToken?: string
}

/**
 * Store auto-login session
 */
export function createAutoLoginSession(
  userId: string,
  exchange: string,
  config: ExchangeConfig
): AutoLoginConfig {
  return {
    exchangeName: exchange,
    userId,
    encryptedCredentials: encryptData(JSON.stringify(config)),
    lastLogin: new Date(),
    autoRefresh: true,
    refreshToken: generateSecureToken(32),
  }
}

/**
 * Retrieve auto-login session
 */
export function getAutoLoginSession(encryptedSession: string): AutoLoginConfig | null {
  try {
    const decrypted = decryptData(encryptedSession)
    return JSON.parse(decrypted)
  } catch (error) {
    console.error("Auto-login retrieval error:", error)
    return null
  }
}

/**
 * Exchange API connection templates
 */
export const EXCHANGE_TEMPLATES = {
  kraken: {
    name: "Kraken",
    requiresApiKey: true,
    requiresApiSecret: true,
    requiresPassphrase: false,
    webhookSupport: true,
    baseUrl: "https://api.kraken.com",
  },
  binance: {
    name: "Binance",
    requiresApiKey: true,
    requiresApiSecret: true,
    requiresPassphrase: false,
    webhookSupport: true,
    baseUrl: "https://api.binance.com",
  },
  coinbase: {
    name: "Coinbase",
    requiresApiKey: true,
    requiresApiSecret: true,
    requiresPassphrase: true,
    webhookSupport: true,
    baseUrl: "https://api.coinbase.com",
  },
  tradingview: {
    name: "TradingView",
    requiresApiKey: true,
    requiresApiSecret: false,
    requiresPassphrase: false,
    webhookSupport: true,
    baseUrl: "https://www.tradingview.com/pine_connector/",
  },
}

/**
 * Mock exchange trade execution
 */
export interface ExchangeTrade {
  id: string
  exchange: string
  pair: string
  side: "BUY" | "SELL"
  quantity: number
  price: number
  total: number
  status: "pending" | "filled" | "failed"
  timestamp: Date
  profitLoss?: number
  donationAmount?: number
}

export function executeMockTrade(
  exchange: string,
  pair: string,
  side: "BUY" | "SELL",
  quantity: number,
  price: number
): ExchangeTrade {
  const total = quantity * price
  return {
    id: generateSecureToken(16),
    exchange,
    pair,
    side,
    quantity,
    price,
    total,
    status: "filled",
    timestamp: new Date(),
  }
}

/**
 * Calculate donation from trade
 */
export function calculateDonationFromTrade(
  profitLoss: number,
  donationPercentage: number
): number {
  if (profitLoss <= 0) return 0
  return (profitLoss * donationPercentage) / 100
}
