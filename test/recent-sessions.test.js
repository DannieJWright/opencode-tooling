// Test: recent-sessions plugin - formatRelativeTime, getResumeCmd, exports
//
// Dynamically imports the real functions from the ESM plugin file.
// Uses fixed timestamps for deterministic test results.

;(async () => {
	const assert = require("node:assert")
	const path = require("node:path")
	const { pathToFileURL } = require("node:url")

	// ---- Dynamic import of real plugin functions ----
	const pluginPath = path.resolve(__dirname, "..", "plugin", "recent-sessions.js")
	let formatRelativeTime, getResumeCmd
	try {
		const plugin = await import(pathToFileURL(pluginPath).href)
		formatRelativeTime = plugin.formatRelativeTime
		getResumeCmd = plugin.getResumeCmd
	} catch (e) {
		console.error(`[FATAL] Could not import plugin: ${e.message}`)
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

	// Fixed reference timestamp for deterministic tests
	const NOW = 1_000_000_000_000

	// --- formatRelativeTime ---
	console.log("\n--- formatRelativeTime ---")

	ok("just now (< 60s)", () => {
		assert.strictEqual(formatRelativeTime(NOW - 0, NOW), "just now")
	})

	ok("1 minute ago", () => {
		assert.strictEqual(formatRelativeTime(NOW - 60_000, NOW), "1 minute ago")
	})

	ok("2 minutes ago", () => {
		assert.strictEqual(formatRelativeTime(NOW - 120_000, NOW), "2 minutes ago")
	})

	ok("59 minutes ago (upper boundary of minutes)", () => {
		assert.strictEqual(formatRelativeTime(NOW - 59 * 60_000, NOW), "59 minutes ago")
	})

	ok("1 hour ago", () => {
		assert.strictEqual(formatRelativeTime(NOW - 3600_000, NOW), "1 hour ago")
	})

	ok("3 hours ago", () => {
		assert.strictEqual(formatRelativeTime(NOW - 3 * 3600_000, NOW), "3 hours ago")
	})

	ok("23 hours ago (upper boundary of hours)", () => {
		assert.strictEqual(formatRelativeTime(NOW - 23 * 3600_000, NOW), "23 hours ago")
	})

	ok("1 day ago", () => {
		assert.strictEqual(formatRelativeTime(NOW - 86400_000, NOW), "1 day ago")
	})

	ok("5 days ago", () => {
		assert.strictEqual(formatRelativeTime(NOW - 5 * 86400_000, NOW), "5 days ago")
	})

	ok("6 days ago (upper boundary of days)", () => {
		assert.strictEqual(formatRelativeTime(NOW - 6 * 86400_000, NOW), "6 days ago")
	})

	ok("1 week ago", () => {
		assert.strictEqual(formatRelativeTime(NOW - 7 * 86400_000, NOW), "1 week ago")
	})

	ok("3 weeks ago", () => {
		assert.strictEqual(formatRelativeTime(NOW - 21 * 86400_000, NOW), "3 weeks ago")
	})

	ok("4 weeks ago (upper boundary of weeks)", () => {
		assert.strictEqual(formatRelativeTime(NOW - 4 * 7 * 86400_000, NOW), "4 weeks ago")
	})

	ok("1 month ago (30+ days)", () => {
		assert.strictEqual(formatRelativeTime(NOW - 30 * 86400_000, NOW), "1 month ago")
	})

	ok("2 months ago", () => {
		assert.strictEqual(formatRelativeTime(NOW - 62 * 86400_000, NOW), "2 months ago")
	})

	ok("0 seconds (exact now)", () => {
		assert.strictEqual(formatRelativeTime(NOW, NOW), "just now")
	})

	// --- getResumeCmd ---
	console.log("\n--- getResumeCmd ---")

	ok("returns correct opencode command", () => {
		assert.strictEqual(getResumeCmd("abc123"), "opencode -s abc123")
	})

	ok("handles longer session IDs", () => {
		assert.strictEqual(getResumeCmd("session-uuid-42"), "opencode -s session-uuid-42")
	})

	// --- Summary ---
	console.log(`\n${passed} passed, ${failed} failed.\n`)
	process.exit(failed > 0 ? 1 : 0)
})()
