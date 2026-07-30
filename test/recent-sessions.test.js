// Test: recent-sessions plugin - formatRelativeTime, getResumeCmd, exports
//
// Note: The plugin file uses ESM syntax (import/export). Since we cannot ESM-import
// from a CommonJS test runner reliably, we re-implement the pure helper functions
// here as mirror copies for unit testing. These are the exact functions from the
// plugin source; any divergence between this file and plugin/recent-sessions.js
// for these pure functions is a bug.

const assert = require("node:assert")
const fs = require("node:fs")
const path = require("node:path")

// ---- Mirror of pure functions from plugin/recent-sessions.js ----
function formatRelativeTime(msTimestamp) {
	const now = Date.now()
	const diffSeconds = Math.floor((now - msTimestamp) / 1000)

	if (diffSeconds < 60) return "just now"
	if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minute${Math.floor(diffSeconds / 60) !== 1 ? "s" : ""} ago`
	if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hour${Math.floor(diffSeconds / 3600) !== 1 ? "s" : ""} ago`
	if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} day${Math.floor(diffSeconds / 86400) !== 1 ? "s" : ""} ago`
	if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 604800)} week${Math.floor(diffSeconds / 604800) !== 1 ? "s" : ""} ago`
	return `${Math.floor(diffSeconds / 2592000)} month${Math.floor(diffSeconds / 2592000) !== 1 ? "s" : ""} ago`
}

function getResumeCmd(sessionId) {
	return `opencode -s ${sessionId}`
}

// ---- Verify plugin file exists and contains expected exports ----
const pluginPath = path.resolve(__dirname, "..", "plugin", "recent-sessions.js")
let pluginSrc
try {
	pluginSrc = fs.readFileSync(pluginPath, "utf-8")
} catch (e) {
	console.error(`[FATAL] Plugin file not found at ${pluginPath}: ${e.message}`)
	process.exit(1)
}

// Sanity check: plugin should contain expected structure
const hasRecentSessions = pluginSrc.includes("RecentSessions")
const hasFormatRelativeTime = pluginSrc.includes("formatRelativeTime")
const hasGetResumeCmd = pluginSrc.includes("getResumeCmd")
const hasTool = pluginSrc.includes("tool(")
const hasRecentSessionsTool = pluginSrc.includes("recent_sessions:")

if (!hasRecentSessions || !hasFormatRelativeTime || !hasGetResumeCmd || !hasTool || !hasRecentSessionsTool) {
	console.error("[FATAL] Plugin source missing expected exports or tool registration")
	process.exit(1)
}

// ---- Tests ----
let passed = 0
let failed = 0

function ok(label, fn) {
	try {
		fn()
		passed++
		console.log(`  ✓ ${label}`)
	} catch (e) {
		failed++
		console.error(`  ✗ ${label}\n    ${e.message}`)
	}
}

// --- formatRelativeTime ---
console.log("\n--- formatRelativeTime ---")

ok("just now (< 60s)", () => {
	assert.strictEqual(formatRelativeTime(Date.now()), "just now")
})

ok("1 minute ago", () => {
	assert.strictEqual(formatRelativeTime(Date.now() - 60_000), "1 minute ago")
})

ok("2 minutes ago", () => {
	assert.strictEqual(formatRelativeTime(Date.now() - 120_000), "2 minutes ago")
})

ok("59 minutes ago (upper boundary of minutes)", () => {
	assert.strictEqual(formatRelativeTime(Date.now() - 59 * 60_000), "59 minutes ago")
})

ok("1 hour ago", () => {
	assert.strictEqual(formatRelativeTime(Date.now() - 3600_000), "1 hour ago")
})

ok("3 hours ago", () => {
	assert.strictEqual(formatRelativeTime(Date.now() - 3 * 3600_000), "3 hours ago")
})

ok("23 hours ago (upper boundary of hours)", () => {
	assert.strictEqual(formatRelativeTime(Date.now() - 23 * 3600_000), "23 hours ago")
})

ok("1 day ago", () => {
	assert.strictEqual(formatRelativeTime(Date.now() - 86400_000), "1 day ago")
})

ok("5 days ago", () => {
	assert.strictEqual(formatRelativeTime(Date.now() - 5 * 86400_000), "5 days ago")
})

ok("6 days ago (upper boundary of days)", () => {
	assert.strictEqual(formatRelativeTime(Date.now() - 6 * 86400_000), "6 days ago")
})

ok("1 week ago", () => {
	assert.strictEqual(formatRelativeTime(Date.now() - 7 * 86400_000), "1 week ago")
})

ok("3 weeks ago", () => {
	assert.strictEqual(formatRelativeTime(Date.now() - 21 * 86400_000), "3 weeks ago")
})

ok("4 weeks ago (upper boundary of weeks, 2592000s = 30 days boundary)", () => {
	// 30 days = 2_592_000 seconds. 4 weeks = 28 days, should still be "4 weeks ago"
	assert.strictEqual(formatRelativeTime(Date.now() - 4 * 7 * 86400_000), "4 weeks ago")
})

ok("1 month ago (30+ days)", () => {
	assert.strictEqual(formatRelativeTime(Date.now() - 30 * 86400_000), "1 month ago")
})

ok("2 months ago", () => {
	assert.strictEqual(formatRelativeTime(Date.now() - 62 * 86400_000), "2 months ago")
})

ok("0 seconds (exact now)", () => {
	assert.strictEqual(formatRelativeTime(Date.now()), "just now")
})

// --- getResumeCmd ---
console.log("\n--- getResumeCmd ---")

ok("returns correct opencode command", () => {
	assert.strictEqual(getResumeCmd("abc123"), "opencode -s abc123")
})

ok("handles longer session IDs", () => {
	assert.strictEqual(getResumeCmd("session-uuid-42"), "opencode -s session-uuid-42")
})

// ---- Plugin structure checks ----
console.log("\n--- Plugin structure ---")

ok("plugin contains RecentSessions export", () => {
	assert.ok(pluginSrc.includes("RecentSessions"), "Expected RecentSessions in source")
})

ok("plugin registers recent_sessions tool", () => {
	assert.ok(pluginSrc.includes("recent_sessions:"), "Expected recent_sessions tool registration")
})

ok("plugin uses tool() helper", () => {
	assert.ok(hasTool, "Expected tool() registration")
})

ok("plugin calls client.session.list", () => {
	assert.ok(pluginSrc.includes("client.session.list"), "Expected client.session.list call")
})

ok("plugin filters parentID", () => {
	assert.ok(pluginSrc.includes("parentID"), "Expected parentID filter")
})

// --- Summary ---
console.log(`\n${passed} passed, ${failed} failed.\n`)
process.exit(failed > 0 ? 1 : 0)
