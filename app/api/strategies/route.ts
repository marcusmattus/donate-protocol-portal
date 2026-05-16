import { NextResponse } from "next/server"
import { STRATEGIES } from "@/lib/demo-data"

export async function GET() {
  return NextResponse.json({ strategies: STRATEGIES })
}
