import { NextResponse } from "next/server"
import { CHARITIES } from "@/lib/demo-data"

export async function GET() {
  return NextResponse.json({ charities: CHARITIES })
}
