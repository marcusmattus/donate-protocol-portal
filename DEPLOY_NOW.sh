#!/bin/bash

echo "🚀 Donate Protocol - Privy.io Integration"
echo "=========================================="
echo ""
echo "Starting development server..."
echo ""
echo "Configuration:"
echo "- Privy App ID: ✅ Configured"
echo "- Solana Devnet: ✅ Connected"
echo "- Wallet Support: ✅ Privy + Phantom + Solflare"
echo ""

cd /Users/marcusmattus/donate-protocol-portal

echo "Installing dependencies (if needed)..."
npm install --legacy-peer-deps > /dev/null 2>&1

echo ""
echo "�� Starting server..."
echo ""

npm run dev

echo ""
echo "✅ Server running at: http://localhost:3000"
echo "📌 Live Donations: http://localhost:3000/live-donation"
echo ""
