import { NextResponse } from "next/server"
import { findCharity } from "@/lib/demo-data"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const c = findCharity(id)
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 })
  return NextResponse.json({ charity: c })
}
