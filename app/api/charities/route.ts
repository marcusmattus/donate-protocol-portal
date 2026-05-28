import { NextResponse } from "next/server"
import { CHARITIES } from "@/lib/demo-data"

export async function GET() {
  return NextResponse.json({ charities: CHARITIES })
import { NextRequest, NextResponse } from "next/server"
import { DEMO_CHARITIES } from "@/lib/seed-data"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get("category")

  let charities = DEMO_CHARITIES

  if (category) {
    charities = charities.filter((c) => c.category === category)
  }

  return NextResponse.json(charities)
}
