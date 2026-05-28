import { NextRequest, NextResponse } from "next/server"
import { hash, compare } from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { generateSecureToken, encryptData, decryptData } from "@/lib/wallet-encryption"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "donate-protocol-jwt-secret-2026"
)

interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

interface SignupRequest {
  email: string
  password: string
  passwordConfirm: string
  fullName: string
}

interface ExchangeLoginRequest {
  userId: string
  exchangeName: string
  apiKey: string
  apiSecret: string
  apiPassphrase?: string
}

/**
 * POST /api/auth/signup
 * Create new user account
 */
export async function signup(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json()
    const { email, password, passwordConfirm, fullName } = body

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user (in real app, save to database)
    const user = {
      id: generateSecureToken(16),
      email,
      fullName,
      passwordHash: hashedPassword,
      createdAt: new Date(),
      wallets: [],
      exchanges: [],
    }

    // Create JWT token
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET)

    return NextResponse.json(
      {
        success: true,
        user: { id: user.id, email, fullName },
        token,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Signup failed" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/login
 * Login with email and password
 */
export async function login(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password, rememberMe } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      )
    }

    // In real app, fetch from database
    // Mock user for demo
    const mockUser = {
      id: "user_demo_001",
      email: email,
      fullName: "Demo User",
      passwordHash: await hash("password123", 10),
    }

    // Verify password
    const isValidPassword = await compare(password, mockUser.passwordHash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Create JWT
    const expiresIn = rememberMe ? "30d" : "7d"
    const token = await new SignJWT({
      userId: mockUser.id,
      email: mockUser.email,
      rememberMe,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(JWT_SECRET)

    // Set secure httpOnly cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.fullName,
        },
        token,
      },
      { status: 200 }
    )

    response.cookies.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/exchange-login
 * Connect exchange account with auto-login
 */
export async function exchangeLogin(request: NextRequest) {
  try {
    const body: ExchangeLoginRequest = await request.json()
    const { userId, exchangeName, apiKey, apiSecret, apiPassphrase } = body

    if (!userId || !exchangeName || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Encrypt credentials
    const encryptedKey = encryptData(apiKey)
    const encryptedSecret = encryptData(apiSecret)
    const encryptedPassphrase = apiPassphrase ? encryptData(apiPassphrase) : undefined

    // Create connection record
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

    // Store auto-login session
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

/**
 * GET /api/auth/verify
 * Verify JWT token
 */
export async function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)

    const verified = await jwtVerify(token, JWT_SECRET)

    return NextResponse.json({
      valid: true,
      payload: verified.payload,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    )
  }
}

/**
 * POST /api/auth/logout
 * Clear auth session
 */
export async function logout(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  })

  response.cookies.delete("authToken")
  return response
}

/**
 * Handle all auth endpoints
 */
export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path.includes("signup")) {
    return signup(request)
  } else if (path.includes("login") && path.includes("exchange")) {
    return exchangeLogin(request)
  } else if (path.includes("login")) {
    return login(request)
  } else if (path.includes("logout")) {
    return logout(request)
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

/**
 * GET /api/auth/verify
 */
export async function GET(request: NextRequest) {
  if (request.nextUrl.pathname.includes("verify")) {
    return verifyToken(request)
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}
