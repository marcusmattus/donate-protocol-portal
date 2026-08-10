/**
 * TradingView connection state helpers and setup checklist.
 */

import { buildTradingViewWebhookUrl, TRADINGVIEW_CONFIG } from "./config"
import { deriveConnectionStatus } from "./normalize"
import type {
  TradingViewConnectionState,
  TradingViewConnectionStatus,
  TradingViewSetupStep,
  TradingViewSetupStepId,
  TradingViewSignal,
} from "./types"

export const SETUP_STEP_DEFINITIONS: Array<
  Omit<TradingViewSetupStep, "completed"> & { id: TradingViewSetupStepId }
> = [
  {
    id: "copy_webhook",
    label: "Copy webhook URL",
    description: "Copy your unique Donate Protocol webhook URL into the clipboard.",
  },
  {
    id: "create_alert",
    label: "Create TradingView alert",
    description: "Open a chart in TradingView and create an alert on your strategy or condition.",
  },
  {
    id: "paste_payload",
    label: "Paste alert JSON",
    description: "In the alert Notifications → Webhook URL, paste the JSON message template.",
  },
  {
    id: "test_signal",
    label: "Send test signal",
    description: "Fire a simulated alert from this portal to verify end-to-end ingestion.",
  },
  {
    id: "confirm_receipt",
    label: "Confirm first signal",
    description: "Confirm a live or simulated signal appears in the dashboard feed.",
    optional: true,
  },
]

export function createInitialSetupSteps(
  completedIds: TradingViewSetupStepId[] = []
): TradingViewSetupStep[] {
  const done = new Set(completedIds)
  return SETUP_STEP_DEFINITIONS.map((step) => ({
    ...step,
    completed: done.has(step.id),
  }))
}

export function isSetupComplete(steps: TradingViewSetupStep[]): boolean {
  return steps
    .filter((s) => !s.optional)
    .every((s) => s.completed)
}

export function createInitialConnectionState(
  overrides?: Partial<TradingViewConnectionState>
): TradingViewConnectionState {
  const token = overrides?.token || TRADINGVIEW_CONFIG.defaultToken
  const setupSteps = overrides?.setupSteps || createInitialSetupSteps()
  const setupComplete = isSetupComplete(setupSteps)
  const now = new Date().toISOString()

  const base: TradingViewConnectionState = {
    status: "setup_incomplete",
    token,
    webhookUrl: buildTradingViewWebhookUrl(token),
    isActive: false,
    setupSteps,
    setupComplete,
    signalsIngested: 0,
    lastWebhookAt: null,
    lastSignal: null,
    lastError: null,
    lastTestAt: null,
    lastTestResult: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }

  base.status = deriveConnectionStatus({
    tokenConfigured: Boolean(base.token),
    setupComplete: base.setupComplete,
    signalsIngested: base.signalsIngested,
    lastError: base.lastError,
    lastTestResult: base.lastTestResult,
  })
  base.isActive =
    base.status === "connected" ||
    base.status === "receiving_signals" ||
    base.status === "test_succeeded"

  return base
}

export function refreshConnectionDerivedFields(
  state: TradingViewConnectionState
): TradingViewConnectionState {
  const setupComplete = isSetupComplete(state.setupSteps)
  const status = deriveConnectionStatus({
    tokenConfigured: Boolean(state.token),
    setupComplete,
    signalsIngested: state.signalsIngested,
    lastError: state.lastError,
    lastTestResult: state.lastTestResult,
  })
  return {
    ...state,
    setupComplete,
    status,
    isActive:
      status === "connected" ||
      status === "receiving_signals" ||
      status === "test_succeeded",
    webhookUrl: buildTradingViewWebhookUrl(state.token),
    updatedAt: new Date().toISOString(),
  }
}

export function statusLabel(status: TradingViewConnectionStatus): string {
  switch (status) {
    case "not_connected":
      return "Not connected"
    case "setup_incomplete":
      return "Setup incomplete"
    case "connected":
      return "Connected"
    case "receiving_signals":
      return "Receiving signals"
    case "error":
      return "Error / invalid token"
    case "test_succeeded":
      return "Test signal succeeded"
    default:
      return status
  }
}

export function statusTone(
  status: TradingViewConnectionStatus
): "neutral" | "warning" | "success" | "danger" {
  switch (status) {
    case "receiving_signals":
    case "connected":
    case "test_succeeded":
      return "success"
    case "setup_incomplete":
    case "not_connected":
      return "warning"
    case "error":
      return "danger"
    default:
      return "neutral"
  }
}

export function summarizeLastSignal(signal: TradingViewSignal | null): string {
  if (!signal) return "No signals yet"
  return `${signal.side} ${signal.symbol} @ $${signal.price} · ${signal.strategy}`
}
