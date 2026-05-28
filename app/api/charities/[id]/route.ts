import { NextResponse } from "next/server"
import { findCharity } from "@/lib/demo-data"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const c = findCharity(id)
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 })
  return NextResponse.json({ charity: c })
import { NextRequest, NextResponse } from "next/server"
import { DEMO_CHARITIES } from "@/lib/seed-data"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: charityId } = await params

  const charity = DEMO_CHARITIES.find((c) => c.id === charityId)

  if (!charity) {
    return NextResponse.json(
      { error: "Charity not found", charityId },
      { status: 404 }
    )
  }

  return NextResponse.json(charity)
}
