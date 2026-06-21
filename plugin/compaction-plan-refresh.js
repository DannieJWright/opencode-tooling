import fs from "node:fs"
import path from "node:path"

/**
 * After session compaction, reminds the agent to re-read current-plan.md
 * if it exists in the project directory.
 */
export const CompactionPlanRefresh = async ({ client, directory, worktree }) => {
	return {
		event: async ({ event }) => {
			if (event.type !== "session.compacted") {
				return
			}

			const searchDir = worktree ?? directory
			const planFile = path.join(searchDir, "current-plan.md")

			if (!fs.existsSync(planFile)) {
				return
			}

			const sessionId = event.session?.id ?? event.id

			if (!sessionId) {
				return
			}

			await client.session.prompt({
				path: { id: sessionId },
				body: {
					noReply: true,
					parts: [
						{
							type: "text",
							text: [
								"Session was just compacted. Before continuing, please read current-plan.md in the project root.",
								"It contains the path to the 'plan' file you are implementing, plus any additional instructions to follow.",
								"Re-read the 'plan' referenced in current-plan.md to refresh your context and ensure accurate implementation.",
								"Also follow any additional instructions within current-plan.md.",
							].join("\n"),
						},
					],
				},
			})
		},
	}
}
