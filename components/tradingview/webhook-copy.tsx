"use client"

import { useState } from "react"

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    try {
      const el = document.createElement("textarea")
      el.value = value
      el.setAttribute("readonly", "")
      el.style.position = "absolute"
      el.style.left = "-9999px"
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(el)
      return ok
    } catch {
      return false
    }
  }
}

export function WebhookCopyField({
  label,
  value,
  onCopied,
}: {
  label: string
  value: string
  onCopied?: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyText(value)
    if (ok) {
      setCopied(true)
      onCopied?.()
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-2">
      <div
        className="text-[10px] uppercase tracking-widest text-slate-500"
        style={{ fontFamily: "var(--font-jetbrains), monospace" }}
      >
        {label}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <code className="flex-1 break-all bg-black/50 border border-slate-800 px-3 py-3 text-xs text-teal-300">
          {value}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 px-4 py-3 border border-teal-400 text-teal-400 text-[10px] uppercase font-bold tracking-widest hover:bg-teal-400 hover:text-slate-950 transition"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  )
}
