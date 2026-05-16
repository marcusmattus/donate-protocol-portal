import { NextResponse } from "next/server"
import { RECENT_SIGNALS } from "@/lib/demo-data"

export async function GET() {
  return NextResponse.json({ signals: RECENT_SIGNALS })
}
