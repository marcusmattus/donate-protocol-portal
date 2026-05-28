import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { CHARITIES, DONATIONS, DonationEvent, findCharity } from "@/lib/demo-data"
import { generateDemoTx } from "@/lib/solana"

const schema = z.object({
  charityId: z.string().min(1),
  amount: z.number().positive().max(100_000),
  asset: z.enum(["USDC", "SOL", "JUP"]),
  recurring: z.boolean().optional().default(false),
  from: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null)
  if (!json) return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 })

  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "validation failed" }, { status: 422 })
  }

  const { charityId, amount, asset, recurring, from } = parsed.data
  const charity = findCharity(charityId)
  if (!charity) {
    return NextResponse.json({ ok: false, error: "charity not found" }, { status: 404 })
  }

  // Simulate Solana devnet inclusion latency
  await new Promise((r) => setTimeout(r, 750))

  const tx = generateDemoTx("Tx")
  const event: DonationEvent = {
    id: `don-${Date.now()}`,
    ts: Date.now(),
    amount,
    fromUser: from ? `wallet:${from.slice(0, 6)}…${from.slice(-4)}` : "Anonymous",
    toCharityId: charity.id,
    toCharity: charity.name,
    sourceTrade: "manual",
    txSignature: tx,
    status: "settled",
  }

  DONATIONS.unshift(event)
  // Reflect to charity counters
  const c = CHARITIES.find((x) => x.id === charity.id)
  if (c) {
    c.raised += asset === "USDC" ? amount : amount * 150
    c.donationsCount += 1
  }

  return NextResponse.json({
    ok: true,
    txSignature: tx,
    event,
    recurring,
    asset,
  })
}
