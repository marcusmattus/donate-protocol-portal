import { NextRequest, NextResponse } from "next/server"
import { STRATEGIES } from "@/lib/demo-data"

export async function GET(req: NextRequest) {
  const trendingOnly = req.nextUrl.searchParams.get("trendingOnly") === "true"
  const rows = trendingOnly ? STRATEGIES.filter((s) => s.trending) : STRATEGIES
  return NextResponse.json({ strategies: rows })
}
