import { NextRequest, NextResponse } from "next/server"
import { DEMO_CHARITIES, DEMO_PORTFOLIOS, getDemoPortfolio } from "@/lib/seed-data"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const wallet = searchParams.get("wallet")

  if (!wallet) {
    return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
  }

  const portfolio = getDemoPortfolio(wallet)

  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
  }

  return NextResponse.json(portfolio)
}
