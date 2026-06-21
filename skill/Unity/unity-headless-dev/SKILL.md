---
name: unity-headless-dev
description: Develop Unity 2D projects using headless validation without the editor viewport. Use when working on Unity C# scripts, game logic, or any Unity project where GPU/VRAM must be conserved for local LLM inference. Provides tools for compilation checks, test execution, and custom validation scripts.
license: MIT
compatibility: opencode
metadata:
  audience: developers
---

# Unity Headless Development

Develop Unity 2D projects without ever opening the editor viewport. All validation runs with `-batchmode -nographics` (zero VRAM), leaving GPU resources free for local LLM inference.

## Available Tools

Three tools are provided by the `unity-validate` plugin:

| Tool | Purpose |
|------|---------|
| `unity_compile` | Verify C# scripts compile without errors |
| `unity_run_tests` | Run EditMode unit tests headlessly |
| `unity_execute` | Execute custom editor validation scripts |

## Workflow

### 1. Always Compile After Changes

After writing or modifying any C# script, run `unity_compile` before claiming work is complete:

```
unity_compile()
```

If compilation fails, fix the errors and re-run. Do not proceed until compilation succeeds.

### 2. Write Tests for New Logic

For any new game logic, create EditMode tests alongside the implementation. EditMode tests run without a GPU and validate script behavior:

```csharp
using UnityEngine.TestTools;
using NUnit.Framework;
using System.Collections;

[TestFixture]
public class MySystemTests
{
    [Test]
    public void TestHealthCalculation()
    {
        var health = new HealthComponent();
        health.MaxHealth = 100;
        health.TakeDamage(30);
        Assert.AreEqual(70, health.CurrentHealth);
    }
}
```

Place test files in `Assets/Tests/EditMode/` and run with:

```
unity_run_tests()
```

Filter to specific tests:

```
unity_run_tests({ testFilter: "Health" })
```

### 3. Custom Validation Scripts

For checks that can't be unit-tested (scene state, asset references, prefab integrity), write editor scripts and run them with `unity_execute`:

```
unity_execute({ method: "MyNamespace.MyValidator:RunCheck" })
```

The method must be `public static` and return `void` or `string`.

## Writing EditMode Tests

### Test Structure

```
Assets/
  Tests/
    EditMode/
      Core/
        HealthTests.cs
        MovementTests.cs
      Data/
        ConfigTests.cs
```

### Test Template

```csharp
using NUnit.Framework;
using UnityEngine;

[TestFixture]
public class ExampleTests
{
    [Test]
    public void SimpleAssertion()
    {
        Assert.IsTrue(true, "Basic test passes");
    }

    [Test]
    public void VectorMath()
    {
        var a = new Vector2(3, 4);
        Assert.AreEqual(5f, a.magnitude, 0.001f, "Magnitude calculation");
    }

    [Test]
    public void ScriptableObjectData()
    {
        var item = ScriptableObject.CreateInstance<ItemData>();
        item.Name = "Sword";
        item.Damage = 25;
        Assert.AreEqual("Sword", item.Name);
        Assert.Greater(item.Damage, 0);
    }
}
```

### Multi-Frame Tests

For tests that need multiple frames (coroutines, async operations), use `[UnityTest]`:

```csharp
[UnityTest]
public IEnumerator TestCoroutine()
{
    var obj = new GameObject();
    yield return null;
    Assert.IsNotNull(obj);
    GameObject.Destroy(obj);
}
```

## 2D Validation Script Templates

### Missing Component Reference Checker

Detects null references on common 2D components:

```csharp
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;

public static class MissingReferenceChecker
{
    public static string RunCheck()
    {
        var issues = new List<string>();

        var scenes = EditorBuildSettings.scenes;
        foreach (var scene in scenes)
        {
            if (!scene.enabled) continue;

            var sceneAsset = EditorApplication.OpenScene(scene.path);
            if (!sceneAsset) continue;

            var roots = UnityEngine.SceneManagement.SceneManager
                .GetActiveScene()
                .GetRootGameObjects();

            foreach (var root in roots)
            {
                CheckTransform(root.transform, issues);
            }
        }

        if (issues.Count == 0)
            return "No missing references found.";

        var sb = new StringBuilder();
        sb.AppendLine($"Found {issues.Count} potential issue(s):");
        foreach (var issue in issues)
            sb.AppendLine($"  - {issue}");
        return sb.ToString();
    }

    static void CheckTransform(Transform transform, List<string> issues)
    {
        var components = transform.GetComponents<Component>();
        foreach (var comp in components)
        {
            if (comp == null)
                issues.Add($"Null component on '{transform.name}'");
        }

        foreach (Transform child in transform)
            CheckTransform(child, issues);
    }
}
```

### Orphaned Prefab Detector

Finds prefabs no longer referenced by any scene or other prefab:

```csharp
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEngine;

public static class OrphanedPrefabDetector
{
    public static string RunCheck()
    {
        var allPrefabs = AssetDatabase.FindAssets("t:Prefab");
        var referencedGuids = new HashSet<string>();

        var scenes = EditorBuildSettings.scenes;
        foreach (var scene in scenes)
        {
            if (!scene.enabled) continue;
            CheckSceneReferences(scene.path, referencedGuids);
        }

        var orphans = new List<string>();
        foreach (var guid in allPrefabs)
        {
            if (!referencedGuids.Contains(guid))
            {
                var path = AssetDatabase.GUIDToAssetPath(guid);
                orphans.Add(path);
            }
        }

        if (orphans.Count == 0)
            return "No orphaned prefabs found.";

        var sb = new StringBuilder();
        sb.AppendLine($"Found {orphans.Count} orphaned prefab(s):");
        foreach (var orphan in orphans)
            sb.AppendLine($"  - {orphan}");
        return sb.ToString();
    }

    static void CheckSceneReferences(string scenePath, HashSet<string> referencedGuids)
    {
        var scene = EditorApplication.OpenScene(scenePath);
        if (!scene) return;

        var roots = UnityEngine.SceneManagement.SceneManager
            .GetActiveScene()
            .GetRootGameObjects();

        foreach (var root in roots)
            CheckObjectReferences(root, referencedGuids);
    }

    static void CheckObjectReferences(UnityEngine.Object obj, HashSet<string> referencedGuids)
    {
        if (obj == null) return;

        var prefabType = PrefabUtility.GetPrefabAssetStatus(obj);
        if (prefabType != PrefabAssetStatus.NotAPrefab)
        {
            var guid = AssetDatabase.AssetPathToGUID(
                AssetDatabase.GetAssetPath(obj));
            if (!string.IsNullOrEmpty(guid))
                referencedGuids.Add(guid);
        }

        if (obj is GameObject go)
        {
            foreach (var child in go.GetComponentsInChildren<Transform>(true))
            {
                if (child != go.transform)
                    CheckObjectReferences(child, referencedGuids);
            }
        }
    }
}
```

### Sprite Import Settings Validator

Ensures all sprites use consistent import settings:

```csharp
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;

public static class SpriteImportValidator
{
    public static string RunCheck()
    {
        var issues = new List<string>();
        var spritePaths = AssetDatabase.FindAssets("t:Texture2D");

        foreach (var guid in spritePaths)
        {
            var path = AssetDatabase.GUIDToAssetPath(guid);
            if (path.StartsWith("Library/") || path.StartsWith("Packages/"))
                continue;

            var textureImporter = AssetImporter.GetAtPath(path) as TextureImporter;
            if (textureImporter == null)
                continue;

            if (textureImporter.textureType != TextureImporterType.Sprite)
                continue;

            if (textureImporter.spriteImportMode == SpriteImportMode.Single
                && textureImporter.spritesheet.Length > 1)
            {
                issues.Add($"{path}: Set to Single mode but has multiple sprites");
            }

            if (textureImporter.maxTextureSize > 2048)
            {
                issues.Add($"{path}: Texture size ({textureImporter.maxTextureSize}) exceeds 2048");
            }
        }

        if (issues.Count == 0)
            return "All sprite import settings look good.";

        var sb = new StringBuilder();
        sb.AppendLine($"Found {issues.Count} sprite import issue(s):");
        foreach (var issue in issues)
            sb.AppendLine($"  - {issue}");
        return sb.ToString();
    }
}
```

### Tilemap Integrity Checker

Validates tilemap configurations:

```csharp
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.Tilemaps;

public static class TilemapIntegrityChecker
{
    public static string RunCheck()
    {
        var issues = new List<string>();

        var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
        var roots = scene.GetRootGameObjects();

        foreach (var root in roots)
        {
            var tilemaps = root.GetComponentsInChildren<Tilemap>(true);
            foreach (var tilemap in tilemaps)
            {
                if (tilemap.tilemapColliderType == TilemapColliderType.GridBased)
                {
                    var collider = tilemap.GetComponent<CompositeCollider2D>();
                    if (collider == null)
                    {
                        issues.Add(
                            $"Tilemap '{tilemap.name}' uses GridBased collider " +
                            "but has no CompositeCollider2D");
                    }
                }

                var bounds = tilemap.cellBounds;
                if (bounds.size.x > 500 || bounds.size.y > 500)
                {
                    issues.Add(
                        $"Tilemap '{tilemap.name}' is very large " +
                        $"({bounds.size.x}x{bounds.size.y}), consider splitting");
                }
            }
        }

        if (issues.Count == 0)
            return "Tilemap integrity check passed.";

        var sb = new StringBuilder();
        sb.AppendLine($"Found {issues.Count} tilemap issue(s):");
        foreach (var issue in issues)
            sb.AppendLine($"  - {issue}");
        return sb.ToString();
    }
}
```

### Audio Clip Validator

Checks for common audio issues in 2D games:

```csharp
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEngine;

public static class AudioClipValidator
{
    public static string RunCheck()
    {
        var issues = new List<string>();
        var audioGuids = AssetDatabase.FindAssets("t:AudioClip");

        foreach (var guid in audioGuids)
        {
            var path = AssetDatabase.GUIDToAssetPath(guid);
            var clip = AssetDatabase.LoadAssetAtPath<AudioClip>(path);

            if (clip == null)
            {
                issues.Add($"{path}: AudioClip failed to load");
                continue;
            }

            if (clip.channels > 2)
            {
                issues.Add($"{path}: Multi-channel audio ({clip.channels} channels) may not play correctly in 2D");
            }

            if (clip.loadType == AudioDataLoadType.CompressedInMemory
                && clip.frequency < 22050)
            {
                issues.Add($"{path}: Low frequency ({clip.frequency}Hz) compressed audio may sound poor");
            }
        }

        if (issues.Count == 0)
            return "All audio clips validated successfully.";

        var sb = new StringBuilder();
        sb.AppendLine($"Found {issues.Count} audio issue(s):");
        foreach (var issue in issues)
            sb.AppendLine($"  - {issue}");
        return sb.ToString();
    }
}
```

## Running Custom Validators

Place validator scripts in `Assets/Editor/` and run them:

```
unity_execute({ method: "MissingReferenceChecker:RunCheck" })
unity_execute({ method: "OrphanedPrefabDetector:RunCheck" })
unity_execute({ method: "SpriteImportValidator:RunCheck" })
unity_execute({ method: "TilemapIntegrityChecker:RunCheck" })
unity_execute({ method: "AudioClipValidator:RunCheck" })
```

## Important Notes

- **All tools use `-nographics`**: Zero VRAM consumption. The GPU is never initialized.
- **Helper script auto-install**: On first use, `OpencodeValidate.cs` is installed to `Assets/Editor/`. This is safe to commit.
- **Compilation is required first**: Unity must compile before any validation runs. The helper script waits for compilation automatically.
- **EditMode tests recommended**: PlayMode tests can run headlessly if they don't require graphics, but EditMode tests are the safest choice for `-nographics` validation.
- **Unity version**: Auto-detected from Unity Hub. Override with `UNITY_EDITOR_PATH` environment variable.
- **Timeout**: Compile and custom execute timeout at 3 minutes. Test runs timeout at 5 minutes.
- **Scene files**: `.unity` scene files are binary and cannot be directly edited. Use editor scripts to modify scenes programmatically.

## When to Open the Editor Manually

Occasional visual spot-checks are still valuable for:
- Sprite positioning and alignment
- UI layout verification
- Animation curve inspection
- Tilemap visual placement
- Lighting and post-processing effects

Open the editor briefly to verify, then return to headless development.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `UNITY_EDITOR_PATH` | Override auto-detected Unity path |
