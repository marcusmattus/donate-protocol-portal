#!/usr/bin/env node
/**
 * Privy login — security regression.
 *
 * The property that matters: a session is only ever issued for a Privy access
 * token whose signature verified against Privy's JWKS. A forged, unsigned,
 * expired or wrong-audience token must never produce a session cookie, and the
 * session cookie itself must not be forgeable without SESSION_SECRET.
 *
 * Usage: BASE_URL=http://localhost:3000 node privy-auth-test.js
 */

const crypto = require("crypto")

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"
const SESSION_COOKIE = "dp_session"

let passed = 0
let failed = 0

function check(name, cond, detail = "") {
  if (cond) {
    console.log(`✅ ${name}`)
    passed++
  } else {
    console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`)
    failed++
  }
}

async function req(method, path, { body, headers = {} } = {}) {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  })
  const text = await res.text()
  let parsed = null
  try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }
  return { status: res.status, body: parsed, raw: text, headers: res.headers }
}

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

/** A syntactically valid but unsigned JWT — the classic forgery attempt. */
function forgedJwt(claims = {}, alg = "ES256") {
  const header = b64url(JSON.stringify({ alg, typ: "JWT" }))
  const payload = b64url(
    JSON.stringify({
      sub: "did:privy:forged000000000000000",
      iss: "privy.io",
      aud: "forged-app-id",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...claims,
    })
  )
  return `${header}.${payload}.${b64url(crypto.randomBytes(64))}`
}

/** An HS256 JWT signed with an attacker-chosen key — alg-confusion attempt. */
function hs256Jwt(secret, claims = {}) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const payload = b64url(
    JSON.stringify({
      userId: "did:privy:attacker",
      sub: "did:privy:attacker",
      iss: "donate-protocol",
      aud: "donate-protocol-session",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...claims,
    })
  )
  const sig = crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest()
  return `${header}.${payload}.${b64url(sig)}`
}

function setCookieOf(res) {
  return res.headers.get("set-cookie") ?? ""
}

async function run() {
  console.log("=".repeat(64))
  console.log("🔑 Privy login — security regression")
  console.log(`   ${BASE_URL}`)
  console.log("=".repeat(64) + "\n")

  // ── Configuration reporting ───────────────────────────────────────
  console.log("— session endpoint —")
  const status = await req("GET", "/api/auth/privy")
  check("GET returns 200", status.status === 200, `got ${status.status}`)
  check(
    "reports configuration without leaking values",
    typeof status.body?.privyConfigured === "boolean" &&
      typeof status.body?.sessionConfigured === "boolean" &&
      !/PRIVY_APP_SECRET|SESSION_SECRET=|appSecret/i.test(status.raw),
    status.raw.slice(0, 160)
  )
  check("unauthenticated GET reports no user", status.body?.authenticated === false, status.raw.slice(0, 120))

  const configured = status.body?.privyConfigured && status.body?.sessionConfigured
  if (!configured) {
    console.log("\n⚠️  NEXT_PUBLIC_PRIVY_APP_ID and/or SESSION_SECRET are not set on the server.")
    console.log("   Token-verification assertions still run — an unconfigured server must reject,")
    console.log("   never fall open.\n")
  }

  // ── Token rejection ───────────────────────────────────────────────
  console.log("— token verification —")

  const noToken = await req("POST", "/api/auth/privy", { body: {} })
  check("POST without a token is rejected", noToken.status === 401 || noToken.status === 503, `got ${noToken.status}`)
  check("no session cookie set when rejected", !setCookieOf(noToken).includes(`${SESSION_COOKIE}=ey`), setCookieOf(noToken).slice(0, 80))

  const garbage = await req("POST", "/api/auth/privy", { headers: { authorization: "Bearer not-a-jwt" } })
  check("garbage bearer token is rejected", garbage.status === 401 || garbage.status === 503, `got ${garbage.status}`)

  const forged = await req("POST", "/api/auth/privy", { headers: { authorization: `Bearer ${forgedJwt()}` } })
  check(
    "forged ES256 token (valid shape, bad signature) is rejected",
    forged.status === 401 || forged.status === 503,
    `got ${forged.status}`
  )
  check(
    "a rejected token reports no sign-up outcome",
    !/"isNewAccount"\s*:\s*(true|false)/.test(forged.raw),
    "a rejected exchange disclosed isNewAccount"
  )
  check("forged token issues no session cookie", !setCookieOf(forged).includes(`${SESSION_COOKIE}=ey`), setCookieOf(forged).slice(0, 80))

  const expired = await req("POST", "/api/auth/privy", {
    headers: {
      authorization: `Bearer ${forgedJwt({ exp: Math.floor(Date.now() / 1000) - 60 })}`,
    },
  })
  check("expired token is rejected", expired.status === 401 || expired.status === 503, `got ${expired.status}`)

  // alg confusion: an HS256 token where ES256 is required.
  const algConfusion = await req("POST", "/api/auth/privy", {
    headers: { authorization: `Bearer ${hs256Jwt("whatever", { iss: "privy.io" })}` },
  })
  check(
    "HS256 token is rejected where ES256 is required (no alg confusion)",
    algConfusion.status === 401 || algConfusion.status === 503,
    `got ${algConfusion.status}`
  )

  const bodyToken = await req("POST", "/api/auth/privy", { body: { token: forgedJwt() } })
  check(
    "forged token in the JSON body is rejected too",
    bodyToken.status === 401 || bodyToken.status === 503,
    `got ${bodyToken.status}`
  )

  check(
    "rejection responses never echo the token",
    !forged.raw.includes("eyJ") && !garbage.raw.includes("not-a-jwt"),
    forged.raw.slice(0, 160)
  )

  // ── Session cookie cannot be forged ───────────────────────────────
  console.log("— session cookie —")

  for (const secret of ["", "wrong-secret", "donate-protocol-jwt-secret-2026"]) {
    const cookie = hs256Jwt(secret || "empty")
    const res = await req("GET", "/api/auth/privy", { headers: { cookie: `${SESSION_COOKIE}=${cookie}` } })
    check(
      `cookie signed with ${secret ? JSON.stringify(secret) : "an empty key"} is not accepted`,
      res.body?.authenticated === false,
      res.raw.slice(0, 120)
    )
  }

  const junkCookie = await req("GET", "/api/auth/privy", {
    headers: { cookie: `${SESSION_COOKIE}=not.a.jwt` },
  })
  check("malformed session cookie yields no session", junkCookie.body?.authenticated === false, junkCookie.raw.slice(0, 120))

  const logout = await req("DELETE", "/api/auth/privy")
  check("DELETE returns 200", logout.status === 200, `got ${logout.status}`)
  check(
    "DELETE clears the cookie",
    /dp_session=;|dp_session=""|Max-Age=0/i.test(setCookieOf(logout)),
    setCookieOf(logout).slice(0, 120)
  )

  // ── A correctly signed session is accepted, and changes the actor ─
  // Only runs when the suite is told the server's SESSION_SECRET, since it has
  // to sign a cookie the server will accept. This is the positive half: the
  // assertions above prove forgeries fail, this proves the real thing works and
  // that logging in actually changes which user the API acts as.
  const SESSION_SECRET = process.env.SESSION_SECRET
  if (SESSION_SECRET && SESSION_SECRET.length >= 16) {
    console.log("— valid session (signed with the server's key) —")
    const did = "did:privy:test" + crypto.randomBytes(8).toString("hex")
    const good = hs256Jwt(SESSION_SECRET, { userId: did, sub: did })
    const cookie = `${SESSION_COOKIE}=${good}`

    const session = await req("GET", "/api/auth/privy", { headers: { cookie } })
    check("valid session cookie is accepted", session.body?.authenticated === true, session.raw.slice(0, 160))
    check("session reports the signed-in DID", session.body?.user?.userId === did, JSON.stringify(session.body?.user))

    // The acting user must follow the session, not stay on the demo identity.
    const scoped = await req("GET", "/api/tradingview/connection", { headers: { cookie } })
    check(
      "TradingView connection is scoped to the session user, not the demo user",
      scoped.status === 200 && scoped.body?.connection?.userId === did,
      JSON.stringify(scoped.body?.connection?.userId)
    )

    const anon = await req("GET", "/api/tradingview/connection")
    check(
      "without a session the same route falls back to the demo user",
      anon.status === 200 && anon.body?.connection?.userId !== did,
      JSON.stringify(anon.body?.connection?.userId)
    )

    // ── Sign-up vs sign-in ──────────────────────────────────────────
    // A session alone must not manufacture an account record. Only a verified
    // Privy token exchange may do that, and this suite cannot mint one of
    // those — which is the point: if holding a cookie were enough to appear as
    // a signed-up account, that would be the bug.
    check(
      "a minted session for an unseen DID reports no account",
      session.body?.account === null || session.body?.account === undefined,
      JSON.stringify(session.body?.account)
    )
    const reread = await req("GET", "/api/auth/privy", { headers: { cookie } })
    check(
      "reading the session repeatedly still creates no account",
      reread.body?.account === null || reread.body?.account === undefined,
      JSON.stringify(reread.body?.account)
    )

    const tampered = `${SESSION_COOKIE}=${good.slice(0, -4)}AAAA`
    const tamperRes = await req("GET", "/api/auth/privy", { headers: { cookie: tampered } })
    check(
      "flipping bytes in a valid session invalidates it",
      tamperRes.body?.authenticated === false,
      tamperRes.raw.slice(0, 120)
    )
  } else {
    console.log("\n   (set SESSION_SECRET to also exercise the valid-session path)\n")
  }

  // ── Identity does not leak into unauthenticated reads ─────────────
  console.log("— identity wiring —")
  const audit = await req("GET", "/api/audit?limit=5")
  check("audit endpoint still responds", audit.status === 200, `got ${audit.status}`)
  check(
    "audit ledger holds no Privy token material",
    !/"(access_token|privy_token|token)"\s*:\s*"ey/i.test(audit.raw),
    "token-shaped value in the ledger"
  )

  const loginPage = await fetch(`${BASE_URL}/login`)
  const loginHtml = await loginPage.text()
  check("login page renders", loginPage.status === 200, `got ${loginPage.status}`)
  check(
    "login page never ships the app secret",
    !/PRIVY_APP_SECRET/.test(loginHtml),
    "PRIVY_APP_SECRET appears in the login page HTML"
  )
  check(
    "login page never ships the session secret",
    !/SESSION_SECRET\s*[:=]\s*["'][^"']{8,}/.test(loginHtml),
    "a SESSION_SECRET value appears in the login page HTML"
  )

  const signupPage = await fetch(`${BASE_URL}/signup`)
  const signupHtml = await signupPage.text()
  check("signup page renders", signupPage.status === 200, `got ${signupPage.status}`)
  check(
    "signup page never ships the app secret",
    !/PRIVY_APP_SECRET|privy_app_secret_/.test(signupHtml),
    "an app-secret reference appears in the signup page HTML"
  )
  check(
    "signup page offers no password field",
    !/type=["']password["']/.test(signupHtml),
    "the Privy signup page is collecting a password"
  )
  check(
    "signup page links to sign-in",
    /href="\/login"/.test(signupHtml),
    "no /login link on the signup page"
  )

  // ── Private wallet access ─────────────────────────────────────────
  // This page was an email/password form posting to endpoints that never
  // existed, and the wallet area behind it gated on a localStorage flag.
  console.log("— private wallet access —")
  const pwLogin = await fetch(`${BASE_URL}/private-wallet-login`)
  const pwHtml = await pwLogin.text()
  check("private wallet login renders", pwLogin.status === 200, `got ${pwLogin.status}`)
  check(
    "private wallet login collects no password",
    !/type=["']password["']/.test(pwHtml),
    "a password field is still on the private wallet login page"
  )
  check(
    "private wallet login targets no dead auth endpoint",
    !/\/api\/auth\/(login|signup|exchange-login)/.test(pwHtml),
    "the page still references an endpoint that does not exist"
  )

  // The routes the old page posted to must stay absent, so a future edit
  // pointing a form back at them fails here rather than in production.
  for (const dead of ["/api/auth/login", "/api/auth/signup", "/api/auth/exchange-login"]) {
    const res = await req("POST", dead, { email: "x@example.com", password: "x" })
    check(`${dead} does not exist`, res.status === 404, `got ${res.status}`)
  }

  const pwArea = await fetch(`${BASE_URL}/private-wallet`)
  const pwAreaHtml = await pwArea.text()
  check(
    "wallet area no longer gates on a localStorage token",
    !/localStorage\.getItem\(\s*["']authToken["']\s*\)/.test(pwAreaHtml),
    "the localStorage gate is still shipped to the browser"
  )
  check(
    "wallet area claims no encryption it does not do",
    !/credentials are encrypted and stored securely/i.test(pwAreaHtml),
    "the false 'encrypted and stored securely' claim is still shown"
  )

  // ── Repo hygiene ──────────────────────────────────────────────────
  // A Privy app secret was once committed to this repo in eight files. This
  // asserts none is present now, so CI fails rather than a reviewer noticing.
  console.log("— repo hygiene —")
  const { execSync } = require("child_process")
  let tracked = ""
  let scanned = false
  try {
    tracked = execSync("git grep -I -l -E 'privy_app_secret_[A-Za-z0-9]{20,}' -- . || true", {
      encoding: "utf8",
      cwd: __dirname,
    }).trim()
    scanned = true
  } catch (e) {
    // Fail the assertion rather than pass silently: an unrunnable scan is not
    // evidence of a clean tree.
    tracked = `scan did not run: ${e instanceof Error ? e.message : e}`
  }
  check(
    "no tracked file contains a Privy app secret",
    scanned && tracked === "",
    tracked ? `secret-shaped value in: ${tracked.split("\n").join(", ")}` : "scan did not run"
  )

  console.log("\n" + "=".repeat(64))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log("=".repeat(64))
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  console.error("Fatal error:", e)
  process.exit(1)
})
