/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Kept out of the bundle and required at runtime instead. The Prisma client
  // is generated into node_modules, so bundling it would mean resolving
  // generated code at build time — and a build with no database should not
  // need a generated client at all. lib/exchanges/db.ts imports both
  // dynamically and only when DATABASE_URL is set.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
}

export default nextConfig
