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
