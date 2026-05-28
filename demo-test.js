#!/usr/bin/env node

/**
 * Donate Protocol Demo Test Script
 * Test all endpoints and simulate the complete flow
 *
 * Usage: node demo-test.js
 */

const http = require("http")

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path)
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    }

    const req = http.request(options, (res) => {
      let data = ""
      res.on("data", (chunk) => {
        data += chunk
      })
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          })
        }
      })
    })

    req.on("error", reject)

    if (body) {
      req.write(JSON.stringify(body))
    }
    req.end()
  })
}

async function runTests() {
  console.log("🚀 Donate Protocol Demo Test Suite\n")
  console.log(`Base URL: ${BASE_URL}\n`)

  let passed = 0
  let failed = 0

  // Test 1: Get Demo Data
  console.log("📝 Test 1: Get Demo Data")
  try {
    const res = await makeRequest("GET", "/api/demo/data")
    if (res.status === 200 && res.body.charities && res.body.strategies) {
      console.log(`✅ PASS - Got ${res.body.charities.length} charities, ${res.body.strategies.length} strategies`)
      passed++
    } else {
      console.log(`❌ FAIL - Unexpected response: ${res.status}`)
      failed++
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    failed++
  }

  // Test 2: Get Charities
  console.log("\n📝 Test 2: Get Charities")
  try {
    const res = await makeRequest("GET", "/api/charities")
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ PASS - Got ${res.body.length} charities`)
      passed++
    } else {
      console.log(`❌ FAIL - Unexpected response: ${res.status}`)
      failed++
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    failed++
  }

  // Test 3: Get Charities by Category
  console.log("\n📝 Test 3: Get Charities by Category")
  try {
    const res = await makeRequest("GET", "/api/charities?category=climate")
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ PASS - Got ${res.body.length} climate charities`)
      passed++
    } else {
      console.log(`❌ FAIL - Unexpected response: ${res.status}`)
      failed++
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    failed++
  }

  // Test 4: Get Strategies
  console.log("\n📝 Test 4: Get Strategies")
  try {
    const res = await makeRequest("GET", "/api/strategies")
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ PASS - Got ${res.body.length} strategies`)
      passed++
    } else {
      console.log(`❌ FAIL - Unexpected response: ${res.status}`)
      failed++
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    failed++
  }

  // Test 5: Get Portfolio
  console.log("\n📝 Test 5: Get Portfolio")
  try {
    const res = await makeRequest("GET", "/api/portfolio?wallet=7XYDemo222")
    if (res.status === 200 && res.body.walletAddress) {
      console.log(`✅ PASS - Portfolio: $${res.body.totalVolume} volume, $${res.body.totalPnL} PnL`)
      passed++
    } else {
      console.log(`❌ FAIL - Unexpected response: ${res.status}`)
      failed++
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    failed++
  }

  // Test 6: Send TradingView Signal
  console.log("\n📝 Test 6: Send TradingView Signal")
  try {
    const payload = {
      symbol: "SOLUSDT",
      side: "BUY",
      price: "181.20",
      strategy: "momentum-alpha",
    }
    const res = await makeRequest("POST", "/api/webhooks/tradingview", payload)
    if (res.status === 200 && res.body.signal) {
      console.log(`✅ PASS - Trade signal processed`)
      if (res.body.donation) {
        console.log(`   💚 Donation triggered: $${res.body.donation.amount.toFixed(2)}`)
      }
      passed++
    } else {
      console.log(`❌ FAIL - Unexpected response: ${res.status}`)
      failed++
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    failed++
  }

  // Test 7: Get Webhook History
  console.log("\n📝 Test 7: Get Webhook History")
  try {
    const res = await makeRequest("GET", "/api/webhooks/tradingview")
    if (res.status === 200) {
      console.log(
        `✅ PASS - Processed ${res.body.totalSignalsProcessed} signals, triggered ${res.body.totalDonationsTriggered} donations`
      )
      passed++
    } else {
      console.log(`❌ FAIL - Unexpected response: ${res.status}`)
      failed++
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    failed++
  }

  // Test 8: Invalid TradingView Signal
  console.log("\n📝 Test 8: Invalid TradingView Signal (should fail)")
  try {
    const payload = { symbol: "SOLUSDT" }
    const res = await makeRequest("POST", "/api/webhooks/tradingview", payload)
    if (res.status === 400) {
      console.log(`✅ PASS - Correctly rejected invalid payload`)
      passed++
    } else {
      console.log(`❌ FAIL - Should have rejected with 400, got ${res.status}`)
      failed++
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    failed++
  }

  // Test 9: Portfolio Not Found
  console.log("\n📝 Test 9: Portfolio Not Found (should fail)")
  try {
    const res = await makeRequest("GET", "/api/portfolio?wallet=InvalidWallet")
    if (res.status === 404) {
      console.log(`✅ PASS - Correctly returned 404 for missing portfolio`)
      passed++
    } else {
      console.log(`❌ FAIL - Should have returned 404, got ${res.status}`)
      failed++
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    failed++
  }

  // Summary
  console.log("\n" + "=".repeat(50))
  console.log(`📊 Test Summary`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  console.log("=".repeat(50))

  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
