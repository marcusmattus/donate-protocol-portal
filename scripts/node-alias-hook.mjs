/**
 * Make `@/…` imports resolve under `node --experimental-strip-types`.
 *
 * The unit suites run TypeScript straight through Node, with no build step and
 * no test framework — which is what keeps them worth having. Node, though,
 * knows nothing about tsconfig's `paths`, so a module that imports
 * `@/lib/exchanges/crypto` cannot be loaded that way.
 *
 * This installs the smallest possible resolver for exactly that: `@/x` means
 * `<repo>/x`, with the extension the file actually has. Nothing else changes,
 * so a suite still fails for real reasons rather than for loader reasons.
 *
 *   node --experimental-strip-types --import ./scripts/node-alias-hook.mjs some-test.ts
 */

import { registerHooks } from "node:module"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const CANDIDATES = ["", ".ts", ".tsx", ".mjs", ".js", "/index.ts", "/index.tsx"]

registerHooks({
  resolve(specifier, context, next) {
    if (!specifier.startsWith("@/")) return next(specifier, context)

    const base = path.join(root, specifier.slice(2))
    for (const suffix of CANDIDATES) {
      const candidate = base + suffix
      if (suffix !== "" && existsSync(candidate)) return next(pathToFileURL(candidate).href, context)
    }
    if (existsSync(base)) return next(pathToFileURL(base).href, context)

    throw new Error(`cannot resolve "${specifier}" under ${root}`)
  },
})
