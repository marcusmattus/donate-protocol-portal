// In-memory ramp position store.
//
// Demo scope: resets with the server process and is not shared across serverless
// instances. Swap for the Prisma models before this handles real custody.

import { RampConfig } from "@/lib/charity-ramp"
import { generateDemoTx } from "@/lib/solana"

export interface RampPosition {
  id: string
  createdAt: number
  config: RampConfig
  venueName: string
  charityName: string
  charityWallet: string
  status: "ramping" | "active" | "closed"
  /** Tranches filled so far. */
  filled: number
  depositSignatures: string[]
  /** Yield harvested and sent to the charity so far. */
  donatedToDateUsd: number
  projection: {
    deployedUsd: number
    grossYieldUsd: number
    donatedUsd: number
    finalBalanceUsd: number
    effectiveApyPct: number
  }
}

const POSITIONS: RampPosition[] = []

export function addRampPosition(position: RampPosition): RampPosition {
  POSITIONS.push(position)
  return position
}

export function listRampPositions(limit = 20): RampPosition[] {
  return POSITIONS.slice(-limit).reverse()
}

export function findRampPosition(id: string): RampPosition | undefined {
  return POSITIONS.find((p) => p.id === id)
}

/** Positions still ramping in, oldest first — the queue a webhook fill drains. */
export function openRamps(): RampPosition[] {
  return POSITIONS.filter((p) => p.status === "ramping")
}

/**
 * Advance a ramp by one tranche. Returns the position, or undefined if the id
 * is unknown or the ramp is already fully deployed.
 */
export function recordRampFill(positionId: string): RampPosition | undefined {
  const position = POSITIONS.find((p) => p.id === positionId)
  if (!position || position.status !== "ramping") return undefined

  position.filled = Math.min(position.config.tranches, position.filled + 1)
  position.depositSignatures.push(generateDemoTx("Ramp"))
  if (position.filled >= position.config.tranches) position.status = "active"
  return position
}

/** Credit a harvested donation against a position. */
export function recordRampDonation(positionId: string, amountUsd: number): RampPosition | undefined {
  const position = POSITIONS.find((p) => p.id === positionId)
  if (!position) return undefined
  position.donatedToDateUsd = Math.round((position.donatedToDateUsd + amountUsd) * 100) / 100
  return position
}
