import { NextRequest, NextResponse } from "next/server"
import { encryptData, generateSecureToken } from "@/lib/wallet-encryption"

interface ExchangeLoginRequest {
  userId: string
  exchangeName: string
  apiKey: string
  apiSecret: string
  apiPassphrase?: string
}

/**
 * POST /api/auth/exchange-login
 * Connect an exchange account (encrypted credentials). Demo-safe.
 */
export async function POST(request: NextRequest) {
  try {
    const body: ExchangeLoginRequest = await request.json()
    const { userId, exchangeName, apiKey, apiSecret, apiPassphrase } = body

    if (!userId || !exchangeName || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const encryptedKey = encryptData(apiKey)
    const encryptedSecret = encryptData(apiSecret || "")
    const encryptedPassphrase = apiPassphrase
      ? encryptData(apiPassphrase)
      : undefined

    const exchangeConnection = {
      id: generateSecureToken(16),
      userId,
      exchangeName,
      encryptedKey,
      encryptedSecret,
      encryptedPassphrase,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/exchange/${generateSecureToken(12)}`,
      webhookSecret: generateSecureToken(32),
      autoLogin: true,
      autoTrade: false,
      createdAt: new Date(),
      lastLogin: new Date(),
    }

    const autoLoginSession = encryptData(
      JSON.stringify({
        exchangeConnection,
        refreshToken: generateSecureToken(32),
      })
    )

    return NextResponse.json(
      {
        success: true,
        exchangeConnection: {
          id: exchangeConnection.id,
          exchangeName,
          webhookUrl: exchangeConnection.webhookUrl,
          autoLoginEnabled: true,
        },
        autoLoginSession,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Exchange login error:", error)
    return NextResponse.json(
      { error: "Exchange connection failed" },
      { status: 500 }
    )
  }
}
