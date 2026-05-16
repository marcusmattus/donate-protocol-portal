import { NextRequest, NextResponse } from "next/server"
import { DEMO_CHARITIES, DEMO_STRATEGIES, DEMO_USERS } from "@/lib/seed-data"

export async function GET() {
  return NextResponse.json({
    charities: DEMO_CHARITIES,
    strategies: DEMO_STRATEGIES,
    users: DEMO_USERS,
    timestamp: new Date().toISOString(),
  })
}
