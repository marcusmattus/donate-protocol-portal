/**
 * In-memory TradingView store — shared source of truth for webhook ingest + dashboard.
 * Demo-safe: no real funds, no durable DB writes.
 */

import { getStrategyById, DEMO_PORTFOLIOS } from "@/lib/seed-data"
import { createChartActionEvent, signalSideToActionId } from "./actions"
import {
  createInitialConnectionState,
  createInitialSetupSteps,
  isSetupComplete,
  refreshConnectionDerivedFields,
} from "./connection"
import { TRADINGVIEW_CONFIG } from "./config"
import { createWebhookEvent, toTradeSignal } from "./normalize"
import type {
  TradingViewChartActionEvent,
  TradingViewConnectionState,
  TradingViewDashboardSnapshot,
  TradingViewSetupStepId,
  TradingViewSignal,
  TradingViewWebhookEvent,
  TradingViewWebhookPayload,
} from "./types"

const MAX_HISTORY = 100

interface StoreShape {
  connection: TradingViewConnectionState
  signals: TradingViewSignal[]
  events: TradingViewWebhookEvent[]
  actions: TradingViewChartActionEvent[]
  donations: Array<Record<string, unknown>>
}

declare global {
  // Persist across Next.js HMR in development
  // eslint-disable-next-line no-var
  var __donateTradingViewStore: StoreShape | undefined
}

function createStore(): StoreShape {
  return {
    connection: createInitialConnectionState({
      token: TRADINGVIEW_CONFIG.defaultToken,
      setupSteps: createInitialSetupSteps(),
    }),
    signals: [],
    events: [],
    actions: [],
    donations: [],
  }
}

function getStore(): StoreShape {
  if (!globalThis.__donateTradingViewStore) {
    globalThis.__donateTradingViewStore = createStore()
  }
  return globalThis.__donateTradingViewStore
}

function pushCapped<T>(list: T[], item: T, max = MAX_HISTORY): T[] {
  list.push(item)
  if (list.length > max) {
    list.splice(0, list.length - max)
  }
  return list
}

function trackAction(
  store: StoreShape,
  event: TradingViewChartActionEvent
): void {
  pushCapped(store.actions, event)
}

function isValidToken(token: string): boolean {
  const expected = getStore().connection.token
  return Boolean(token) && token === expected
}

export function getTradingViewConnection(): TradingViewConnectionState {
  return refreshConnectionDerivedFields(getStore().connection)
}

export function getTradingViewSnapshot(): TradingViewDashboardSnapshot {
  const store = getStore()
  const connection = refreshConnectionDerivedFields(store.connection)
  store.connection = connection
  return {
    connection,
    recentSignals: [...store.signals].reverse().slice(0, 25),
    recentEvents: [...store.events].reverse().slice(0, 25),
    recentActions: [...store.actions].reverse().slice(0, 25),
  }
}

export function markSetupStep(
  stepId: TradingViewSetupStepId,
  completed = true
): TradingViewConnectionState {
  const store = getStore()
  store.connection.setupSteps = store.connection.setupSteps.map((step) =>
    step.id === stepId ? { ...step, completed } : step
  )
  store.connection = refreshConnectionDerivedFields(store.connection)

  trackAction(
    store,
    createChartActionEvent("Donate.Setup.StepCompleted", {
      payload: { stepId, completed },
    })
  )

  if (store.connection.setupComplete && !store.connection.isActive) {
    trackAction(store, createChartActionEvent("Donate.Connection.Activated"))
  }

  return getTradingViewConnection()
}

export function activateTradingViewConnection(): TradingViewConnectionState {
  const store = getStore()
  // Mark required steps complete for a quick "connect" path in demo
  const requiredIds: TradingViewSetupStepId[] = [
    "copy_webhook",
    "create_alert",
    "paste_payload",
    "test_signal",
  ]
  store.connection.setupSteps = store.connection.setupSteps.map((step) =>
    requiredIds.includes(step.id) ? { ...step, completed: true } : step
  )
  store.connection.lastError = null
  store.connection = refreshConnectionDerivedFields(store.connection)
  trackAction(store, createChartActionEvent("Donate.Connection.Activated"))
  return getTradingViewConnection()
}

export function resetTradingViewConnection(): TradingViewConnectionState {
  const store = getStore()
  store.connection = createInitialConnectionState({
    token: TRADINGVIEW_CONFIG.defaultToken,
  })
  store.signals = []
  store.events = []
  store.actions = []
  store.donations = []
  return getTradingViewConnection()
}

function simulateExecution(signal: TradingViewSignal): {
  signal: TradingViewSignal
  donation?: Record<string, unknown>
} {
  const simulatedPnL =
    Math.random() > 0.3
      ? Math.abs(Math.random() * 2000 - 500)
      : -Math.abs(Math.random() * 500)

  signal.status = "executed"
  signal.pnl = simulatedPnL

  if (simulatedPnL <= 0) {
    return { signal }
  }

  const strategy = getStrategyById(signal.strategy)
  if (!strategy) return { signal }

  const donationAmount = simulatedPnL * (strategy.donationRate / 100)
  const firstUser = Object.values(DEMO_PORTFOLIOS)[0]
  if (!firstUser?.followedCharities?.length) return { signal }

  const charityId = firstUser.followedCharities[0]
  const donation = {
    id: `donation-${Date.now()}`,
    tradeId: signal.id,
    fromWallet: firstUser.walletAddress,
    charityId,
    amount: donationAmount,
    percentage: strategy.donationRate,
    timestamp: new Date().toISOString(),
    source: "tradingview",
  }
  return { signal, donation }
}

export interface IngestResult {
  ok: boolean
  status: number
  error?: string
  event: TradingViewWebhookEvent
  signal?: TradingViewSignal
  donation?: Record<string, unknown>
  tradeSignal?: ReturnType<typeof toTradeSignal>
  connection: TradingViewConnectionState
}

/**
 * Ingest a TradingView webhook payload for a given token.
 * Validates token, normalizes payload, persists to demo store, tracks actions.
 */
export function ingestTradingViewWebhook(params: {
  token: string
  payload: TradingViewWebhookPayload
  source?: TradingViewWebhookEvent["source"]
}): IngestResult {
  const store = getStore()
  const source = params.source || "webhook"

  if (!isValidToken(params.token)) {
    const event = createWebhookEvent({
      token: params.token,
      rawPayload: params.payload,
      source,
    })
    event.valid = false
    event.error = "Invalid webhook token"
    event.normalized = null
    pushCapped(store.events, event)
    store.connection.lastError = "Invalid webhook token"
    store.connection.lastWebhookAt = event.receivedAt
    store.connection = refreshConnectionDerivedFields(store.connection)
    trackAction(
      store,
      createChartActionEvent("Donate.Webhook.Rejected", {
        payload: { reason: "invalid_token", token: params.token },
      })
    )
    return {
      ok: false,
      status: 401,
      error: "Invalid webhook token",
      event,
      connection: getTradingViewConnection(),
    }
  }

  const event = createWebhookEvent({
    token: params.token,
    rawPayload: params.payload,
    source,
  })
  pushCapped(store.events, event)
  store.connection.lastWebhookAt = event.receivedAt

  if (!event.valid || !event.normalized) {
    store.connection.lastError = event.error || "Invalid payload"
    store.connection = refreshConnectionDerivedFields(store.connection)
    trackAction(
      store,
      createChartActionEvent("Donate.Webhook.Rejected", {
        payload: { reason: event.error },
      })
    )
    return {
      ok: false,
      status: 400,
      error: event.error || "Invalid payload",
      event,
      connection: getTradingViewConnection(),
    }
  }

  trackAction(
    store,
    createChartActionEvent("Donate.Webhook.Received", {
      payload: { eventId: event.id },
    })
  )
  trackAction(
    store,
    createChartActionEvent("Alert.Triggered", {
      payload: { symbol: event.normalized.symbol, side: event.normalized.side },
      relatedSignalId: event.normalized.id,
    })
  )

  const { signal, donation } = simulateExecution({ ...event.normalized })
  event.normalized = signal
  pushCapped(store.signals, signal)
  if (donation) {
    pushCapped(store.donations, donation)
  }

  store.connection.signalsIngested = store.signals.length
  store.connection.lastSignal = signal
  store.connection.lastError = null
  if (source === "test" || source === "simulate") {
    store.connection.lastTestAt = event.receivedAt
    store.connection.lastTestResult = "success"
    store.connection.setupSteps = store.connection.setupSteps.map((step) =>
      step.id === "test_signal" || step.id === "confirm_receipt"
        ? { ...step, completed: true }
        : step
    )
    trackAction(
      store,
      createChartActionEvent("Donate.Connection.Test", {
        payload: { result: "success" },
        relatedSignalId: signal.id,
      })
    )
  }

  // Auto-complete confirm when a real webhook arrives
  if (source === "webhook") {
    store.connection.setupSteps = store.connection.setupSteps.map((step) =>
      step.id === "confirm_receipt" ? { ...step, completed: true } : step
    )
  }

  store.connection.setupComplete = isSetupComplete(store.connection.setupSteps)
  store.connection = refreshConnectionDerivedFields(store.connection)

  trackAction(
    store,
    createChartActionEvent(signalSideToActionId(signal.side), {
      relatedSignalId: signal.id,
      payload: {
        symbol: signal.symbol,
        price: signal.price,
        strategy: signal.strategy,
      },
    })
  )

  return {
    ok: true,
    status: 200,
    event,
    signal,
    donation,
    tradeSignal: toTradeSignal(signal),
    connection: getTradingViewConnection(),
  }
}

/** Simulate a test alert through the same ingest path. */
export function simulateTradingViewTestSignal(
  overrides?: Partial<TradingViewWebhookPayload>
): IngestResult {
  const store = getStore()
  const payload: TradingViewWebhookPayload = {
    symbol: "SOLUSDT",
    side: "BUY",
    price: 181.2,
    strategy: "momentum-alpha",
    timestamp: new Date().toISOString(),
    comment: "donate-protocol-test-signal",
    ...overrides,
  }
  // Ensure copy_webhook / create / paste are marked when user runs a test from UI
  store.connection.setupSteps = store.connection.setupSteps.map((step) =>
    step.id === "copy_webhook" ||
    step.id === "create_alert" ||
    step.id === "paste_payload"
      ? { ...step, completed: true }
      : step
  )
  return ingestTradingViewWebhook({
    token: store.connection.token,
    payload,
    source: "test",
  })
}

export function getRecentTradingViewSignals(limit = 25): TradingViewSignal[] {
  const store = getStore()
  return [...store.signals].reverse().slice(0, limit)
}

export function getTradingViewWebhookHistory() {
  const store = getStore()
  return {
    recentSignals: [...store.signals].reverse().slice(0, 10),
    recentDonations: [...store.donations].reverse().slice(0, 10),
    recentEvents: [...store.events].reverse().slice(0, 10),
    totalSignalsProcessed: store.signals.length,
    totalDonationsTriggered: store.donations.length,
    connection: getTradingViewConnection(),
  }
}
