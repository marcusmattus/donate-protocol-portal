import { NextRequest, NextResponse } from "next/server"
import { DEMO_STRATEGIES } from "@/lib/seed-data"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const trending = searchParams.get("trending")

  let strategies = DEMO_STRATEGIES

  if (trending === "true") {
    strategies = strategies.filter((s) => s.trending)
  }

  return NextResponse.json(strategies)
}
