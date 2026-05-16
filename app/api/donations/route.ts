import { NextResponse } from "next/server"
import { DONATIONS } from "@/lib/demo-data"

export async function GET() {
  return NextResponse.json({ donations: DONATIONS })
}
