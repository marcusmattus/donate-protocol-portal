/**
 * TradingView integration types — connection state, webhooks, signals, and chart actions.
 * Designed around Charting Library concepts while remaining demo-safe.
 */

import type { TradeSignal } from "@/lib/types"

/** High-level connection lifecycle for the TradingView webhook integration. */
export type TradingViewConnectionStatus =
  | "not_connected"
  | "setup_incomplete"
  | "connected"
  | "receiving_signals"
  | "error"
  | "test_succeeded"

export type TradingViewSetupStepId =
  | "copy_webhook"
  | "create_alert"
  | "paste_payload"
  | "test_signal"
  | "confirm_receipt"

export interface TradingViewSetupStep {
  id: TradingViewSetupStepId
  label: string
  description: string
  completed: boolean
  optional?: boolean
}

export interface TradingViewConnectionState {
  status: TradingViewConnectionStatus
  token: string
  webhookUrl: string
  isActive: boolean
  setupSteps: TradingViewSetupStep[]
  setupComplete: boolean
  signalsIngested: number
  lastWebhookAt: string | null
  lastSignal: TradingViewSignal | null
  lastError: string | null
  lastTestAt: string | null
  lastTestResult: "success" | "failure" | null
  createdAt: string
  updatedAt: string
}

/** Raw alert body accepted from TradingView webhooks (flexible alert JSON). */
export interface TradingViewWebhookPayload {
  symbol?: string
  ticker?: string
  side?: string
  action?: string
  order?: string
  price?: string | number
  close?: string | number
  strategy?: string
  strategy_id?: string
  timestamp?: string
  time?: string
  /** Free-form TradingView `{{strategy.order.comment}}` style fields */
  comment?: string
  exchange?: string
  interval?: string
  [key: string]: unknown
}

export interface TradingViewWebhookEvent {
  id: string
  token: string
  receivedAt: string
  rawPayload: TradingViewWebhookPayload
  normalized: TradingViewSignal | null
  valid: boolean
  error?: string
  source: "webhook" | "test" | "simulate"
}

export interface TradingViewSignal {
  id: string
  symbol: string
  side: "BUY" | "SELL"
  price: number
  strategy: string
  timestamp: string
  status: TradeSignal["status"]
  pnl?: number
  source: "tradingview"
  webhookEventId: string
  token: string
  interval?: string
  exchange?: string
  comment?: string
}

/**
 * Charting Library ActionId-inspired identifiers.
 * Subset + app-specific extensions for signal/intent tracking.
 * @see https://www.tradingview.com/charting-library-docs/latest/api/enums/Charting_Library.ActionId
 */
export type TradingViewActionId =
  | "Chart.Crosshair.PlusButton.DrawHorizontalLine"
  | "Chart.MouseWheelZoom"
  | "Chart.ZoomIn"
  | "Chart.ZoomOut"
  | "Chart.Series.ChangeType"
  | "Chart.FavoriteDrawingToolsToolbar"
  | "Trading.PlaceOrder"
  | "Trading.CancelOrder"
  | "Trading.ModifyOrder"
  | "Alert.Create"
  | "Alert.Triggered"
  | "Donate.Signal.Buy"
  | "Donate.Signal.Sell"
  | "Donate.Webhook.Received"
  | "Donate.Webhook.Rejected"
  | "Donate.Connection.Test"
  | "Donate.Connection.Activated"
  | "Donate.Setup.StepCompleted"

export interface TradingViewChartActionEvent {
  id: string
  actionId: TradingViewActionId
  category: "chart" | "trading" | "alert" | "donate"
  label: string
  timestamp: string
  payload?: Record<string, unknown>
  relatedSignalId?: string
}

export interface TradingViewBar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface TradingViewSymbolInfo {
  ticker: string
  name: string
  description: string
  type: string
  session: string
  timezone: string
  exchange: string
  minmov: number
  pricescale: number
  has_intraday: boolean
  supported_resolutions: string[]
  volume_precision: number
  data_status: "streaming" | "endofday" | "pulsed" | "delayed_streaming"
}

export interface TradingViewDatafeedConfiguration {
  supported_resolutions: string[]
  exchanges: Array<{ value: string; name: string; desc: string }>
  symbols_types: Array<{ name: string; value: string }>
  supports_marks: boolean
  supports_timescale_marks: boolean
  supports_time: boolean
}

/** Charting Library datafeed callback shapes (simplified). */
export type OnReadyCallback = (config: TradingViewDatafeedConfiguration) => void
export type ResolveCallback = (symbolInfo: TradingViewSymbolInfo) => void
export type ErrorCallback = (reason: string) => void
export type HistoryCallback = (bars: TradingViewBar[], meta: { noData?: boolean }) => void
export type SubscribeBarsCallback = (bar: TradingViewBar) => void
export type SearchSymbolsCallback = (
  items: Array<{
    symbol: string
    full_name: string
    description: string
    exchange: string
    ticker: string
    type: string
  }>
) => void

export interface TradingViewDashboardSnapshot {
  connection: TradingViewConnectionState
  recentSignals: TradingViewSignal[]
  recentEvents: TradingViewWebhookEvent[]
  recentActions: TradingViewChartActionEvent[]
}
