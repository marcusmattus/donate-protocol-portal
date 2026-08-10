/**
 * TradingView chart ActionId → app event registry.
 * Extensible mapping for future Charting Library widget interactions.
 */

import type { TradingViewActionId, TradingViewChartActionEvent } from "./types"

export interface ActionDefinition {
  actionId: TradingViewActionId
  category: TradingViewChartActionEvent["category"]
  label: string
  description: string
}

/** Typed registry of known chart / donate actions. */
export const TRADINGVIEW_ACTION_REGISTRY: Record<TradingViewActionId, ActionDefinition> = {
  "Chart.Crosshair.PlusButton.DrawHorizontalLine": {
    actionId: "Chart.Crosshair.PlusButton.DrawHorizontalLine",
    category: "chart",
    label: "Draw horizontal line",
    description: "User drew a horizontal line from the crosshair plus button",
  },
  "Chart.MouseWheelZoom": {
    actionId: "Chart.MouseWheelZoom",
    category: "chart",
    label: "Mouse wheel zoom",
    description: "Chart zoom via mouse wheel",
  },
  "Chart.ZoomIn": {
    actionId: "Chart.ZoomIn",
    category: "chart",
    label: "Zoom in",
    description: "Chart zoom in action",
  },
  "Chart.ZoomOut": {
    actionId: "Chart.ZoomOut",
    category: "chart",
    label: "Zoom out",
    description: "Chart zoom out action",
  },
  "Chart.Series.ChangeType": {
    actionId: "Chart.Series.ChangeType",
    category: "chart",
    label: "Change series type",
    description: "User changed chart series type (candles, line, etc.)",
  },
  "Chart.FavoriteDrawingToolsToolbar": {
    actionId: "Chart.FavoriteDrawingToolsToolbar",
    category: "chart",
    label: "Favorite drawing tools",
    description: "Opened favorite drawing tools toolbar",
  },
  "Trading.PlaceOrder": {
    actionId: "Trading.PlaceOrder",
    category: "trading",
    label: "Place order",
    description: "Trading panel place-order intent (simulated)",
  },
  "Trading.CancelOrder": {
    actionId: "Trading.CancelOrder",
    category: "trading",
    label: "Cancel order",
    description: "Trading panel cancel-order intent (simulated)",
  },
  "Trading.ModifyOrder": {
    actionId: "Trading.ModifyOrder",
    category: "trading",
    label: "Modify order",
    description: "Trading panel modify-order intent (simulated)",
  },
  "Alert.Create": {
    actionId: "Alert.Create",
    category: "alert",
    label: "Create alert",
    description: "User created a TradingView alert",
  },
  "Alert.Triggered": {
    actionId: "Alert.Triggered",
    category: "alert",
    label: "Alert triggered",
    description: "TradingView alert fired and hit the webhook",
  },
  "Donate.Signal.Buy": {
    actionId: "Donate.Signal.Buy",
    category: "donate",
    label: "Buy signal ingested",
    description: "Normalized BUY signal entered the donate protocol pipeline",
  },
  "Donate.Signal.Sell": {
    actionId: "Donate.Signal.Sell",
    category: "donate",
    label: "Sell signal ingested",
    description: "Normalized SELL signal entered the donate protocol pipeline",
  },
  "Donate.Webhook.Received": {
    actionId: "Donate.Webhook.Received",
    category: "donate",
    label: "Webhook received",
    description: "Raw TradingView webhook accepted",
  },
  "Donate.Webhook.Rejected": {
    actionId: "Donate.Webhook.Rejected",
    category: "donate",
    label: "Webhook rejected",
    description: "TradingView webhook failed validation",
  },
  "Donate.Connection.Test": {
    actionId: "Donate.Connection.Test",
    category: "donate",
    label: "Connection test",
    description: "User ran a simulated TradingView connection test",
  },
  "Donate.Connection.Activated": {
    actionId: "Donate.Connection.Activated",
    category: "donate",
    label: "Connection activated",
    description: "TradingView webhook connection marked active",
  },
  "Donate.Setup.StepCompleted": {
    actionId: "Donate.Setup.StepCompleted",
    category: "donate",
    label: "Setup step completed",
    description: "User completed a TradingView setup checklist step",
  },
}

export function getActionDefinition(actionId: TradingViewActionId): ActionDefinition {
  return TRADINGVIEW_ACTION_REGISTRY[actionId]
}

/** Map a chart/app action into a trackable event record. */
export function createChartActionEvent(
  actionId: TradingViewActionId,
  options?: {
    payload?: Record<string, unknown>
    relatedSignalId?: string
    timestamp?: string
  }
): TradingViewChartActionEvent {
  const def = getActionDefinition(actionId)
  return {
    id: `tv-act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actionId,
    category: def.category,
    label: def.label,
    timestamp: options?.timestamp || new Date().toISOString(),
    payload: options?.payload,
    relatedSignalId: options?.relatedSignalId,
  }
}

/** Map a normalized signal side to a donate signal action. */
export function signalSideToActionId(side: "BUY" | "SELL"): TradingViewActionId {
  return side === "BUY" ? "Donate.Signal.Buy" : "Donate.Signal.Sell"
}
