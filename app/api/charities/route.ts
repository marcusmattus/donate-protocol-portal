import { NextRequest, NextResponse } from "next/server"
import { CHARITIES, CharityCategory } from "@/lib/demo-data"

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") as CharityCategory | null
  const verifiedOnly = req.nextUrl.searchParams.get("verifiedOnly") === "true"
  let rows = CHARITIES
  if (category) rows = rows.filter((c) => c.category === category)
  if (verifiedOnly) rows = rows.filter((c) => c.verified)
  return NextResponse.json({ charities: rows })
}
