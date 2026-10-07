/**
 * Prisma 7 configuration.
 *
 * Prisma 7 removed `url` from the datasource block, so the connection string
 * for Migrate lives here instead. `process.env.DATABASE_URL` rather than
 * Prisma's `env()` helper on purpose: `url` is optional, and reading it this
 * way leaves it `undefined` when the variable is unset instead of failing. That
 * matters because `prisma generate` runs on every install — including CI and
 * builds that have no database — and must not need one.
 *
 * The client does not read this file; it gets its connection from the driver
 * adapter built in lib/exchanges/db.ts.
 */

import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
