import { NextRequest, NextResponse } from "next/server"
import { DEMO_CHARITIES, DEMO_STRATEGIES } from "@/lib/seed-data"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get("type") // "charities" or "strategies"
  const category = searchParams.get("category")
  const sortBy = searchParams.get("sort") // "impact", "raised", "followers", "winRate"
  const trending = searchParams.get("trending")

  let results: any[] = []

  if (type === "strategies" || !type) {
    let strategies = DEMO_STRATEGIES

    if (trending === "true") {
      strategies = strategies.filter((s) => s.trending)
    }

    if (sortBy === "winRate") {
      strategies.sort((a, b) => b.winRate - a.winRate)
    }

    if (type === "strategies") {
      return NextResponse.json(strategies)
    }

    results = strategies
  }

  if (type === "charities" || !type) {
    let charities = DEMO_CHARITIES

    if (category) {
      charities = charities.filter((c) => c.category === category)
    }

    if (sortBy === "impact") {
      charities.sort((a, b) => b.impactScore - a.impactScore)
    } else if (sortBy === "raised") {
      charities.sort((a, b) => b.raised - a.raised)
    } else if (sortBy === "followers") {
      charities.sort((a, b) => b.followers - a.followers)
    }

    if (type === "charities") {
      return NextResponse.json(charities)
    }

    results = charities
  }

  return NextResponse.json({
    charities: DEMO_CHARITIES,
    strategies: DEMO_STRATEGIES,
    timestamp: new Date().toISOString(),
  })
}
