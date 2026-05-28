import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

/**
 * Reusable prompts that encode the OpenClaw agent playbooks. A host agent can
 * surface these to the operator as one-click flows.
 */
export function registerPrompts(server: McpServer) {
  server.registerPrompt(
    "process_signal",
    {
      title: "Process a trading signal",
      description: "Walk the full Donate Protocol agent pipeline for an incoming signal and route the resulting donation.",
      argsSchema: {
        symbol: z.string(),
        side: z.string(),
        price: z.string(),
        size: z.string().optional(),
        charityId: z.string().optional(),
      },
    },
    ({ symbol, side, price, size, charityId }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `You are the OpenClaw execution agent for Donate Protocol.`,
              `A signal arrived: ${side} ${symbol} @ ${price}${size ? ` size ${size}` : ""}.`,
              ``,
              `Do the following in order, using the available tools:`,
              `1. Call check_risk. If it fails, stop and explain why.`,
              `2. Call get_jupiter_quote for the swap.`,
              `3. Call simulate_signal to execute end-to-end${charityId ? ` routing the donation to charity "${charityId}"` : ""}.`,
              `4. Summarize the PnL, the donation amount, the destination charity, and the tx signature.`,
              `Keep the summary concise and investor-friendly.`,
            ].join("\n"),
          },
        },
      ],
    }),
  )

  server.registerPrompt(
    "recommend_charity",
    {
      title: "Recommend a charity",
      description: "Pick the best charity destination for a donor given a cause area and budget.",
      argsSchema: {
        cause: z.string(),
        priorities: z.string().optional(),
      },
    },
    ({ cause, priorities }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Recommend a Donate Protocol charity for a donor focused on "${cause}".`,
              priorities ? `Donor priorities: ${priorities}.` : ``,
              `Use list_charities (filter by the relevant category) and compare impact score, raised volume, and verification.`,
              `Return your top pick with a one-paragraph rationale and its on-chain wallet, plus one runner-up.`,
            ].filter(Boolean).join("\n"),
          },
        },
      ],
    }),
  )

  server.registerPrompt(
    "impact_report",
    {
      title: "Generate an impact report",
      description: "Produce a short impact report from the donation ledger and protocol stats.",
      argsSchema: { period: z.string().optional() },
    },
    ({ period }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Generate an impact report${period ? ` for ${period}` : ""} for Donate Protocol.`,
              `Use get_protocol_stats and list_donations. Break down total routed value by charity,`,
              `highlight the top 3 destinations, and close with a one-line headline suitable for social.`,
            ].join("\n"),
          },
        },
      ],
    }),
  )
}
