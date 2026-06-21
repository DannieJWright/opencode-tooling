import fs from "node:fs"
import path from "node:path"
import { tool } from "@opencode-ai/plugin"

const HELPER_SCRIPT_NAME = "OpencodeValidate.cs"

const HELPER_SCRIPT_CONTENT = `using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;

public static class OpencodeValidate
{
    static string sOperation;
    static string sCustomMethod;
    static string sLogPath;
    static bool sDone;
    static int sExitCode;

    public static void CompileAndQuit()
    {
        sOperation = "compile";
        Setup();
    }

    public static void TestsAndQuit()
    {
        sOperation = "tests";
        Setup();
    }

    public static void CustomAndQuit()
    {
        sOperation = "custom";
        sCustomMethod = Environment.GetEnvironmentVariable("OPENCODE_UNITY_CUSTOM_METHOD");
        Setup();
    }

    static void Setup()
    {
        sLogPath = Environment.GetEnvironmentVariable("OPENCODE_UNITY_LOG");
        EditorApplication.update += UpdateLoop;
        Log("OpencodeValidate started. Operation: " + sOperation);
    }

    static void UpdateLoop()
    {
        if (sDone)
            return;

        if (EditorApplication.isCompiling)
        {
            Log("Waiting for compilation...");
            return;
        }

        switch (sOperation)
        {
            case "compile":
                HandleCompile();
                break;
            case "tests":
                HandleTests();
                break;
            case "custom":
                HandleCustom();
                break;
        }
    }

    static void HandleCompile()
    {
        var errors = GetCompilationErrors();
        if (errors.Count > 0)
        {
            Log("COMPILATION_FAILED");
            Log("Error count: " + errors.Count);
            foreach (var e in errors)
                Log("ERROR: " + e);
            sExitCode = 1;
        }
        else
        {
            Log("COMPILATION_OK");
            sExitCode = 0;
        }
        sDone = true;
        EditorApplication.quitting += () => EditorApplication.Exit(sExitCode);
        EditorApplication.Exit(sExitCode);
    }

    static void HandleTests()
    {
        Log("EditMode tests will run via -runTests flag. Waiting for completion...");
        sDone = true;
        EditorApplication.quitting += () => EditorApplication.Exit(0);
        EditorApplication.Exit(0);
    }

    static void HandleCustom()
    {
        if (string.IsNullOrEmpty(sCustomMethod))
        {
            Log("ERROR: OPENCODE_UNITY_CUSTOM_METHOD not set");
            sExitCode = 1;
            sDone = true;
            EditorApplication.Exit(sExitCode);
            return;
        }

        try
        {
            var parts = sCustomMethod.Split(':');
            if (parts.Length != 2)
            {
                Log("ERROR: Invalid method format. Expected 'Namespace.Class:MethodName'");
                sExitCode = 1;
                sDone = true;
                EditorApplication.Exit(sExitCode);
                return;
            }

            var type = Type.GetType(parts[0], true, true);
            var method = type.GetMethod(
                parts[1],
                BindingFlags.Public | BindingFlags.Static
            );

            if (method == null)
            {
                Log("ERROR: Method '" + parts[1] + "' not found on type '" + type.FullName + "'");
                sExitCode = 1;
                sDone = true;
                EditorApplication.Exit(sExitCode);
                return;
            }

            var result = method.Invoke(null, null);
            Log("CUSTOM_OK");
            Log("Result: " + (result?.ToString() ?? "null"));
            sExitCode = 0;
            sDone = true;
            EditorApplication.Exit(sExitCode);
        }
        catch (Exception ex)
        {
            Log("ERROR: " + ex.Message);
            if (ex.InnerException != null)
                Log("Inner: " + ex.InnerException.Message);
            sExitCode = 1;
            sDone = true;
            EditorApplication.Exit(sExitCode);
        }
    }

    static List<string> GetCompilationErrors()
    {
        var errors = new List<string>();

        try
        {
            var logFile = EditorApplication.logPath;
            if (!File.Exists(logFile))
                return errors;

            var lines = File.ReadAllLines(logFile);
            bool inErrorBlock = false;
            string currentError = "";

            for (int i = 0; i < lines.Length; i++)
            {
                var line = lines[i];

                if (line.Contains("(UnityEditor.BuildPipeline:interfaceCompile"))
                    continue;

                if (line.Contains("Error") && line.Contains("CS"))
                {
                    inErrorBlock = true;
                    currentError = line.Trim();
                    continue;
                }

                if (inErrorBlock)
                {
                    if (line.StartsWith("  at ") || line.StartsWith("   at ") || line.Contains(".cs:"))
                    {
                        currentError += " | " + line.Trim();
                    }
                    else if (line.Trim().Length > 0 && !line.StartsWith("-"))
                    {
                        errors.Add(currentError);
                        inErrorBlock = false;
                        currentError = "";
                    }
                    else
                    {
                        errors.Add(currentError);
                        inErrorBlock = false;
                        currentError = "";
                    }
                }
            }

            if (inErrorBlock && !string.IsNullOrEmpty(currentError))
                errors.Add(currentError);
        }
        catch (Exception ex)
        {
            Log("Warning: Could not read log file: " + ex.Message);
        }

        return errors;
    }

    static void Log(string message)
    {
        Debug.Log("[OpencodeValidate] " + message);
        if (!string.IsNullOrEmpty(sLogPath))
        {
            try
            {
                File.AppendAllText(sLogPath, message + Environment.NewLine);
            }
            catch { }
        }
    }
}
`;

function findUnityEditor() {
	const envPath = process.env.UNITY_EDITOR_PATH;
	if (envPath) {
		const resolved = path.resolve(envPath);
		if (fs.existsSync(resolved)) {
			return resolved;
		}
		console.error(`[unity-validate] UNITY_EDITOR_PATH "${resolved}" does not exist`);
	}

	const hubBase = "C:\\Program Files\\Unity\\Hub\\Editor";
	if (!fs.existsSync(hubBase)) {
		return null;
	}

	try {
		const versions = fs
			.readdirSync(hubBase)
			.filter((entry) => {
				const fullPath = path.join(hubBase, entry);
				const editorPath = path.join(fullPath, "Editor", "Unity.exe");
				return fs.statSync(fullPath).isDirectory() && fs.existsSync(editorPath);
			})
			.sort((a, b) => {
				const numA = a.replace(/[^0-9.]/g, "").split(".").map(Number);
				const numB = b.replace(/[^0-9.]/g, "").split(".").map(Number);
				for (let i = 0; i < Math.max(numA.length, numB.length); i++) {
					const diff = (numB[i] || 0) - (numA[i] || 0);
					if (diff !== 0) return diff;
				}
				return 0;
			})[0];

		if (!versions) {
			return null;
		}

		return path.join(hubBase, versions, "Editor", "Unity.exe");
	} catch {
		return null;
	}
}

function ensureHelperScript(projectDir) {
	const editorDir = path.join(projectDir, "Assets", "Editor");
	const scriptPath = path.join(editorDir, HELPER_SCRIPT_NAME);

	if (fs.existsSync(scriptPath)) {
		return true;
	}

	try {
		fs.mkdirSync(editorDir, { recursive: true });
		fs.writeFileSync(scriptPath, HELPER_SCRIPT_CONTENT);
		return true;
	} catch (err) {
		console.error(`[unity-validate] Failed to install helper script: ${err.message}`);
		return false;
	}
}

async function runUnity(unityPath, args, projectDir, env, timeoutMs) {
	const logFile = path.join(
		projectDir,
		"Temp",
		`.opencode_log_${Date.now()}.txt`
	);

	try {
		fs.mkdirSync(path.join(projectDir, "Temp"), { recursive: true });
	} catch {
		// best-effort
	}

	const fullArgs = [
		...args,
		`-logFile "${logFile}"`,
	];

	const envVars = {
		...env,
		OPENCODE_UNITY_LOG: logFile,
	};

	try {
		const result = await Bun.$`
			${unityPath} ${fullArgs.join(" ")}
		`.env(envVars).timeout(timeoutMs).nothrow();

		return { exitCode: result.exitCode, log: logFile, stdout: result.stdout.toString() };
	} catch (err) {
		return {
			exitCode: err.exitCode ?? 1,
			log: logFile,
			error: err.message,
		};
	}
}

function parseLogFile(logFile) {
	try {
		return fs.readFileSync(logFile, "utf-8");
	} catch {
		return "";
	}
}

function parseHelperLog(logContent) {
	const lines = logContent
		.split("\n")
		.filter((line) => line.includes("[OpencodeValidate]"))
		.map((line) => line.replace(/\[OpencodeValidate\]\s*/, ""));
	return lines;
}

function parseUnityLogForErrors(logContent) {
	const errors = [];
	const lines = logContent.split("\n");

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (
			(line.includes("error") && line.includes("CS")) ||
			line.includes("Compilation failed") ||
			line.includes("Script compilation failed")
		) {
			const nextLine = i + 1 < lines.length ? lines[i + 1] : "";
			errors.push({
				message: line.trim(),
				detail: nextLine.trim(),
			});
		}
	}
	return errors;
}

function parseTestResults(projectDir) {
	const resultsPath = path.join(projectDir, "test-results.xml");
	try {
		const content = fs.readFileSync(resultsPath, "utf-8");

		const totalMatch = content.match(/tests="(\d+)"/);
		const passedMatch = content.match(/success="(\d+)"/);
		const failedMatch = content.match(/failures="(\d+)"/);
		const errorsMatch = content.match(/errors="(\d+)"/);

		const total = parseInt(totalMatch?.[1] ?? "0");
		const passed = parseInt(passedMatch?.[1] ?? "0");
		const failed = parseInt(failedMatch?.[1] ?? "0");
		const errors = parseInt(errorsMatch?.[1] ?? "0");

		const failures = [];
		const failureRegex = /<failure[^>]*>([\s\S]*?)<\/failure>/g;
		let m;
		while ((m = failureRegex.exec(content)) !== null) {
			const msgMatch = m[1].match(/<message[^>]*>([\s\S]*?)<\/message>/);
			failures.push(msgMatch?.[1]?.trim() ?? m[1].trim());
		}

		return { total, passed, failed, errors, failures };
	} catch {
		return null;
	}
}

export const UnityValidatePlugin = async ({ directory, worktree }) => {
	const projectDir = worktree ?? directory;

	const unityPath = findUnityEditor();
	if (!unityPath) {
		console.warn(
			"[unity-validate] Unity Editor not found. Set UNITY_EDITOR_PATH or install via Unity Hub."
		);
	}

	return {
		tool: {
			unity_compile: tool({
				description:
					"Validate Unity C# compilation without opening the editor viewport. Uses -batchmode -nographics (zero VRAM). Installs a helper script on first use. Always run this after writing or modifying C# scripts to verify they compile.",
				args: {
					projectPath: tool
						.schema.string()
						.optional()
						.describe(
							"Unity project root directory. Defaults to current project."
						),
				},
				async execute(args) {
					const targetDir = args.projectPath ?? projectDir;

					if (!unityPath) {
						return {
							output:
								"ERROR: Unity Editor not found. Install Unity via Unity Hub or set UNITY_EDITOR_PATH environment variable.",
							title: "Unity Compile Check",
						};
					}

					if (!ensureHelperScript(targetDir)) {
						return {
							output:
								"ERROR: Failed to install helper script. Check file permissions in Assets/Editor/.",
							title: "Unity Compile Check",
						};
					}

					const { exitCode, log: logFile } = await runUnity(
						unityPath,
						[
							"-batchmode",
							"-nographics",
							"-accept-apiupdate",
							`-projectPath "${targetDir}"`,
							'-executeMethod "OpencodeValidate.CompileAndQuit"',
							"-quit",
						],
						targetDir,
						{},
						180000
					);

					const logContent = parseLogFile(logFile);
					const helperLines = parseHelperLog(logContent);

					const compileOk = helperLines.some(
						(l) => l === "COMPILATION_OK"
					);
					const compileFailed = helperLines.some(
						(l) => l === "COMPILATION_FAILED"
					);
					const errorLines = helperLines.filter(
						(l) => l.startsWith("ERROR:")
					);
					const errorCountMatch = helperLines.find(
						(l) => l.startsWith("Error count:")
					);
					const errorCount = errorCountMatch
						? parseInt(errorCountMatch.split(":")[1])
						: errorLines.length;

					let output;
					if (compileOk) {
						output = "Compilation succeeded. No errors found.";
					} else if (compileFailed) {
						output = [
							`Compilation failed with ${errorCount} error(s):`,
							"",
							...errorLines.map(
								(e, i) => `${i + 1}. ${e.replace("ERROR: ", "")}`
							),
						].join("\n");
					} else {
						const unityErrors = parseUnityLogForErrors(logContent);
						if (unityErrors.length > 0) {
							output = [
								`Compilation issues detected (${unityErrors.length}):`,
								"",
								...unityErrors.map(
									(e, i) =>
										`${i + 1}. ${e.message}${e.detail ? "\n   " + e.detail : ""}`
								),
							].join("\n");
						} else {
							output =
								"Unable to determine compilation status. Unity exited with code " +
								exitCode +
								". Check the Unity log for details.";
						}
					}

					return {
						output,
						title: "Unity Compile Check",
						metadata: { exitCode, success: compileOk },
					};
				},
			}),

			unity_run_tests: tool({
				description:
					"Run Unity EditMode tests headlessly without GPU. Uses -batchmode -nographics (zero VRAM). Installs helper script on first use. Use this to verify script logic and game systems without opening the editor.",
				args: {
					projectPath: tool
						.schema.string()
						.optional()
						.describe(
							"Unity project root directory. Defaults to current project."
						),
					testFilter: tool
						.schema.string()
						.optional()
						.describe(
							"Filter tests by name pattern. Only matching tests will run."
						),
				},
				async execute(args) {
					const targetDir = args.projectPath ?? projectDir;

					if (!unityPath) {
						return {
							output:
								"ERROR: Unity Editor not found. Install Unity via Unity Hub or set UNITY_EDITOR_PATH environment variable.",
							title: "Unity Test Run",
						};
					}

					if (!ensureHelperScript(targetDir)) {
						return {
							output:
								"ERROR: Failed to install helper script. Check file permissions in Assets/Editor/.",
							title: "Unity Test Run",
						};
					}

					const testArgs = [
						"-batchmode",
						"-nographics",
						"-accept-apiupdate",
						`-projectPath "${targetDir}"`,
						"-runTests",
						"-testPlatform EditMode",
						`-testResults "${path.join(targetDir, "test-results.xml")}"`,
					];

					if (args.testFilter) {
						testArgs.push(`-testfilter "${args.testFilter}"`);
					}

					const { exitCode, log: logFile } = await runUnity(
						unityPath,
						testArgs,
						targetDir,
						{},
						300000
					);

					const testResults = parseTestResults(targetDir);

					let output;
					if (testResults) {
						output = [
							`Tests completed: ${testResults.total} total, ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.errors} errors`,
						];

						if (testResults.failures.length > 0) {
							output.push(
								"\nFailures:",
								...testResults.failures.map(
									(f, i) => `${i + 1}. ${f}`
								)
							);
						}
					} else {
						output =
							"Test results file not found. Tests may not have completed or no tests exist. Check the Unity log for details.";
					}

					return {
						output: output.join("\n"),
						title: "Unity Test Run",
						metadata: { exitCode, testResults },
					};
				},
			}),

			unity_execute: tool({
				description:
					"Run a custom Unity Editor script method headlessly. Uses -batchmode -nographics (zero VRAM). Format: 'Namespace.ClassName:MethodName'. Use this for custom validation like checking for missing references, verifying scene state, or running 2D-specific checks.",
				args: {
					method: tool
						.schema.string()
						.describe(
							"Fully qualified method to run. Format: 'Namespace.ClassName:MethodName'. The method must be public static and return void or a string."
						),
					projectPath: tool
						.schema.string()
						.optional()
						.describe(
							"Unity project root directory. Defaults to current project."
						),
				},
				async execute(args) {
					const targetDir = args.projectPath ?? projectDir;

					if (!unityPath) {
						return {
							output:
								"ERROR: Unity Editor not found. Install Unity via Unity Hub or set UNITY_EDITOR_PATH environment variable.",
							title: "Unity Custom Execute",
						};
					}

					if (!ensureHelperScript(targetDir)) {
						return {
							output:
								"ERROR: Failed to install helper script. Check file permissions in Assets/Editor/.",
							title: "Unity Custom Execute",
						};
					}

					const { exitCode, log: logFile } = await runUnity(
						unityPath,
						[
							"-batchmode",
							"-nographics",
							"-accept-apiupdate",
							`-projectPath "${targetDir}"`,
							'-executeMethod "OpencodeValidate.CustomAndQuit"',
							"-quit",
						],
						targetDir,
						{ OPENCODE_UNITY_CUSTOM_METHOD: args.method },
						180000
					);

					const logContent = parseLogFile(logFile);
					const helperLines = parseHelperLog(logContent);

					const customOk = helperLines.some(
						(l) => l === "CUSTOM_OK"
					);
					const resultLines = helperLines.filter(
						(l) => l.startsWith("Result: ")
					);
					const errorLines = helperLines.filter(
						(l) => l.startsWith("ERROR:")
					);

					let output;
					if (customOk) {
						output = resultLines.join("\n");
					} else if (errorLines.length > 0) {
						output = errorLines.join("\n");
					} else {
						output =
							"No output captured. The method may have run silently or failed before logging.";
					}

					return {
						output,
						title: "Unity Custom Execute",
						metadata: { exitCode, method: args.method, success: customOk },
					};
				},
			}),
		},
	};
};
