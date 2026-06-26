Invoke the `brainstorming` and creative writing skills first! They are necessary for this prompt

Help me build a plan for implementing a research workflow. I wrote this originally as a single prompt to supply to the orchestrating agent, and I need your help to convert that into a workflow based off the information in `docs/research/big-picture/guide.md`. Please review the input prompt I prepared and help me turn it into a workflow. In particular, help me make it a checklist based on the guide doc's main numbered points and the lettered subpoints. Here was the original prompt:
```
Help me plan building a 2D turn based gladiator fighting game in the Unity game engine using the C# programming lanugage. Your goal is to establish the "big pieces" that are needed for the game to work (ie player characters/enemies/ui/combat scene/on boarding/saving game state/etc) through the use of subagent researchers. 

You are an orchestrator that manages the subagents to find the appropriate information, and kick off subagents to review, and write plans as well. **Do not read any files or lookup any information yourself, delegate to subagents to do all of your work.** As the orchestrator, it is not your job to read the research output files, it is not your job to read any documentation, nor write to any files directly. Aggresively rely on subagents to do work and summarize information for you. 

Once you have done an extensive amount of research to establish what the "big picture" apsects are, write down your findings to your own docs/research/big-picture output .md file. Do not try to implement any code, do not have the subagents try to implement anything, this is only a research phase, so collect a lot of useful information. The purpose is to extensively establish what will be need to be further researched for the actual development process with well organized documented output that can be re-used in the future.


With regard to the subagents:
 - You should only spawn one single subagent at a time and wait for them to finish before continuing to the next subagent. 
 - Each subagent should be restricted to a single topic for the current batch.
 - You, as the orchestrator, should tightly limit what each subagent researches to prevent open-ended subagents expanding past their expected scope. 
 - As the orchestrator, it is your job to feed in the appropriate references from the url researcher subagent at the start of the batch when starting each of the other subagents in the batch.
 - Explicitly inform all subagents to include their results in documentation files organized under a `docs/research/big-picture` folder. These research docs must include the subagent prompts at the start of each of their output .md files (do not include the full conversation/thought process, just the prompt and results that would be reported to the primary agent). 
 - Explicitly inform all subagents they must write their promtps/results to their own output research output files before returning their results to you the orchestrator. 
 - Explicitly inform each subagent to only perform a single websearch/webfetch tool call at a time, do not run any of these in parallel. Webfetch tool calls should be using known valid urls, do not make up urls to query, use previous information or findings from a websearch. 
 - Explicitly inform each subagent that this is part of a large research effort, they should not be generating implementation plans. The point is to collect information, not create any designs nor prepare for implementation. They should be researching important information with regard to the expected tech stack (2D turn based Unity c# video game development) and the topics they have been assigned.
 - Explicitly inform each subagent to limit their current research to the broad strokes, they do not need to know the fine details of implementations, we are doing generic research so keep it to the big aspects of the topics.
 - Explicitly inform the subagents where the reference doc is located `input-references.md` and that the subagents should look in there for the appropriate links related to their topic. Explicitly inform the subagent these docs and the associated references are meant to provide a jumping off point in the research and MUST NOT be considered the sole source of knowledge for the subagent's research.
 - Explicitly inform the subagents to expand their research through online references, not just local documentation.
 - Explicitly inform the subagents to include a section for the references they used that were valid in their documentation. Only include valid references, urls that resulting in failed webfetches must be excluded from the references list.
 - Agents should not be making decisions about "what to go with"/"what to use"/deciding between frameworks/tooling when there are multiple competing options. Instead mention each, noting whether the option is native to unity and which is the most recent (such as in the case of legacy vs new systems)
 - Include the expected tech stack for each agent to keep research narrowed (2D turn based gladiator fighting game in the Unity game engine using the C# programming lanugage)


Proceed to spawn a subagent for each individual sub-item in the guide document `docs/research/big-picture/guide.md` (ie 1.a., then 1.b., then 1.c, etc) sequentially, waiting for the previous subagent to finish it's research before moving onto the next one. Do not spawn multiple agents in parallel.

Stop after each main section (ie section 1, then section 2, etc).
```


Here's the big picture synthesis, the primary components alongside local research file references and further readings links:
1. Architecture Foundation
    a. 3-layer model (SO definition > runtime state > MonoBehaviour system)
    b. composition over inheritance,
    c. EventBus/event channels
    d. object pooling
    e. coroutines.
`unity-core-guide.md` references:
- Sec 1 "Unity Architecture: Component-Based" (L16-22): composition over inheritance — game entities are GameObjects + components
- Sec 2 "The Game Loop: Three Ticks" (L24-33): Update/FixedUpdate/LateUpdate cadence
- Sec 5 "MonoBehaviour Lifecycle" (L51-66): event subscription at OnEnable/OnDisable
- Sec 8 "Object Pooling" (L89-93): pre-instantiate, dequeue on spawn, requeue on death
- Sec 9 "ScriptableObject" (L95-104): data-only containers, decouple data from behavior
`unity-agents-template.md` references:
- Sec 4.1 "Component-Based Architecture" (L529-543): SRP, MonoBehaviours as engine boundary
- Sec 4.2 "ScriptableObject Architecture" (L546-599): explicit 3-layer model, event channels, flyweight pattern, delegate objects
- Sec 4.3 "State Machine Patterns" (L601-655): FSM implementation, guard conditions, hierarchical FSMs
- Sec 4.5 "Event-Driven Architecture" (L674-688): strongly-typed EventBus publish/subscribe
- Sec 4.7 "Object Pooling and Factory" (L725-752): benchmarked pooling (79ms vs 29ms), warm-up pools
- Sec 2.6 "Coroutines vs async/await" (L379-404): coroutines for gameplay timing, async for I/O
- Sec 4.8 "SOLID Principles" (L754-765): SOLID applied to Unity context
- Sec 4.9 "Clean Architecture" (L767-779): Domain > Application > Infrastructure > Presentation
Associated URLs:
- https://docs.unity3d.com/Manual/class-ScriptableObject.html — SO data assets
- https://github.com/UnityTechnologies/PaddleGameSO — official SO architecture demo with event channels
- https://docs.unity3d.com/Manual/Coroutines.html — coroutines
- https://docs.unity3d.com/Manual/async-awaitable-introduction.html — async/await Awaitable
- https://docs.unity3d.com/Manual/ExecutionOrder.html — script execution order
- https://docs.unity3d.com/Manual/class-MonoBehaviour.html — MonoBehaviour lifecycle
- https://docs.unity3d.com/Manual/Components.html — component-based architecture
2. Combat System
    a. FSM (finite state machines) for combat state
    b. Command pattern
    c. turn flow management
    d. status effects
    e. damage pipeline
    f. buff/debuff system.
    g. damage types
`unity-core-guide.md` references:
- Sec 1 "Unity Architecture" (L16-22): combat abilities = components, not subclass chains
- Sec 5 "MonoBehaviour Lifecycle" (L51-66): OnEnable/OnDisable for combat event subscription
- Sec 9 "ScriptableObject" (L95-104): ability/damage definitions as SOs
`unity-agents-template.md` references:
- Sec 4.3 "State Machine Patterns" (L601-655): FSM for combat states (attack/defend/stunned), guard conditions, hybrid FSM+behavior tree
- Sec 4.5 "Event-Driven Architecture" (L674-688): events for turn transitions, damage broadcast to UI
- Sec 4.2 "ScriptableObject Architecture" (L546-599): delegate objects for skill effects with Execute(), variable references for health coupling
- Sec 4.11 "ECS/DOTS" (L796-830): ECS for massive status effects/projectiles, tag components for IsStunned/IsPoisoned
- Sec 4.7 "Object Pooling" (L725-752): pooling projectiles and combat VFX
- Sec 3.2 "What Goes Where" (L469-480): attack cooldown tracking in Update
Associated URLs:
- https://docs.unity3d.com/Manual/class-ScriptableObject.html — ability/attack data containers
- https://docs.unity3d.com/Manual/Physics2D.html — 2D physics for hitboxes
- https://docs.unity3d.com/Manual/AnimationsOverview.html — animator for attack/idle/death states
- https://docs.unity3d.com/Manual/Coroutines.html — attack animation sequencing
3. Character/Entity Architecture
    a. Component breakdown per gladiator entity
    b. sprite layering
    c. tat calculation model
    d. skill system design.
`unity-core-guide.md` references:
- Sec 1 "Unity Architecture" (L16-22): Gladiator = GameObject + components (stats, animations, hitbox, AI)
- Sec 4 "GameObject & Transform Hierarchy" (L42-48): weapon as child of hand pivot, empty GameObjects as anchors
- Sec 7 "Prefabs" (L77-87): prefab variants for different classes
- Sec 9 "ScriptableObject" (L95-104): character stats, weapon/ability definitions as SOs
`unity-agents-template.md` references:
- Sec 4.1 (L529-543): SRP — separate HealthComponent, MovementComponent, AttackComponent
- Sec 4.2 (L546-599): 3-layer model applied to character data; SOs immutable, runtime copies mutable
- Sec 4.8 "SOLID Principles" (L754-765): open/closed for adding new gladiator types
- Sec 4.11 "ECS/DOTS" (L796-830): granular components instead of monolithic CharacterStats
- Sec 1.1 (L20-86): Characters subfolder structure
- Sec 2.2 "Naming Conventions" (L264-302): interfaces (IDamageable, IKillable), prefab naming (PF_)
Associated URLs:
- https://docs.unity3d.com/Manual/class-ScriptableObject.html — SO data containers
- https://docs.unity3d.com/Manual/Serialization.html — serializable classes for stat structs
- https://docs.unity3d.com/Packages/com.unity.2d.animation@latest/ — 2D skeletal bone-based rigging
- https://docs.unity3d.com/Manual/SpriteRenderer.html — sorting layers for depth
- https://docs.unity3d.com/Manual/Prefabs.html — prefab system
- https://docs.unity3d.com/Manual/instantiating-prefabs.html — runtime prefab instantiation
4. Scene Management & Game Flow
    a. Bootstrap pattern
    b. async transitions
    c. persistent managers
    d. scene organization.
`unity-core-guide.md` references:
- Sec 3 "Scenes" (L36-39): single/additive loading, async loading for transitions
`unity-agents-template.md` references:
- Sec 1.4 "Scene Organization" (L145-179): persistent manager chain (00_Bootstrap > 01_Loading > 02_Meta > 03_Core > 04_Empty), hierarchy roots (_SceneContext, _Characters, UI), @ prefix
- Sec 5.3 "Memory Optimization" (L928-936): Addressables grouped by usage (Intro, Tutorial, Level1)
- Sec 4.7 "Object Pooling" (L725-752): DontDestroyOnLoad for persisting pool managers across scene loads
- Sec 1.1 (L48-56): Scenes/ subdirectory layout
- Sec 3.1 "Execution Order" (L451-467): all Awake calls finish before any Start — bootstrap ordering
Associated URLs:
- https://docs.unity3d.com/Manual/SceneManagement.html — SceneManager, LoadSceneAsync, additive loading
- https://docs.unity3d.com/ScriptReference/SceneManagement.SceneManager.html — API reference
- https://docs.unity3d.com/Manual/MultiSceneEditing.html — persistent manager patterns
- https://docs.unity3d.com/Packages/com.unity.addressables@latest/ — modern asset loading
- https://docs.unity3d.com/Manual/LoadingResourcesatRuntime.html — runtime asset loading
- https://docs.unity3d.com/Manual/event-functions.html — lifecycle callbacks
5. UI/HUD
    a. uGUI vs UI Toolkit, 
    b. canvas patterns, 
    c. combat UI elements (health bars, turn indicators), 
    d. responsive layout.
`unity-core-guide.md` references:
- No direct references in Part 1 (UI covered in Part 2, Chapter 14 only)
`unity-agents-template.md` references:
- Sec 1.1 (L34-35, L54-55): UI sub-folders in Scripts/, Prefabs/, dedicated UI/ for fonts/icons/sprites
- Sec 1.4 (L175-176): hierarchy — UI as root for Canvas/panels
- Sec 2.5 (L348-376): [SerializeField] for UI-bound fields
- Sec 4.2 "Variable References" (L569-572): health bar reads shared FloatVariable SO — decoupled binding
- Sec 4.7 (L725-752): pooling damage numbers and UI popups
- Sec 5.3 (L888-925): UI text update only when values change (avoid per-frame GC)
Associated URLs:
- https://docs.unity3d.com/Manual/GUIScriptingGuide.html — uGUI Canvas system
- https://docs.unity3d.com/Packages/com.unity.textmeshpro@latest/ — TextMesh Pro for HUD text
- https://docs.unity3d.com/Manual/Canvas.html — Canvas render modes
- https://docs.unity3d.com/ScriptReference/RectTransform.html — UI positioning, anchors, pivots
6. Audio & VFX
    a. AudioMixer architecture, 
    b. particle systems, 
    c. screen shake, 
    d. feedback sequencing.
`unity-core-guide.md` references:
- Sec 8 "Object Pooling" (L89-93): hit effects, blood splatter VFX as pool candidates
`unity-agents-template.md` references:
- Sec 1.1 (L44-47): Audio/ subdirectories (Music, SFX, Ambient)
- Sec 1.1 (L43): VFX/ subdirectory under Art/
- Sec 2.2 "Asset Naming" (L289-302): prefixes — P_/PS_ for particles, SFX_, S_M_
- Sec 4.2 (L546-599): SO event channels for audio system subscribing to gameplay events
- Sec 2.6 (L379-404): coroutines for VFX/animation timing sequences
- Sec 4.7 (L725-752): pooling particles, damage numbers, projectiles
Associated URLs:
- https://docs.unity3d.com/Manual/audio.html — AudioSource, AudioClip, spatial blend
- https://docs.unity3d.com/Manual/AudioManager.html — Audio Mixer groups, snapshots, ducking
- https://docs.unity3d.com/Manual/class-ParticleSystem.html — Particle System for hit feedback
7. Arena Environment
    a. Tilemap system,
    b. per-arena configuration, 
    c. camera/lighting.
`unity-core-guide.md` references:
- No direct references in Part 1 (Tilemap in Part 2, Chapter 13)
`unity-agents-template.md` references:
- Sec 3.2 (L469-480): LateUpdate for camera follow/aim
- Sec 5.1 (L839-855): Job System for arena-wide spatial queries
- Sec 5.4 (L942-963): light baking for arena scenes, occlusion culling for indoor arenas
- Sec 5.5 (L966-982): layer collision matrix for combat zone boundaries
- Sec 1.4 (L169-177): _Environment root for static world objects
Associated URLs:
- https://docs.unity3d.com/Manual/class-Tilemap.html — Tilemap/Grid/RuleTile
- https://docs.unity3d.com/Manual/Tilemaps.html — terrain painting, authoring tools
- https://docs.unity3d.com/Manual/SpriteRenderer.html — sorting layers for depth
- https://docs.unity3d.com/Packages/com.unity.2d.pixel-perfect@latest/ — Pixel Perfect Camera
- https://docs.unity3d.com/Packages/com.unity.2d.tilemap@latest/ — RuleTiles, animated tiles
- https://docs.unity3d.com/Packages/com.unity.2d.tilemap.extras@latest/ — NodeTile, RandomTile
- https://docs.unity3d.com/Manual/Physics2D.html — 2D Physics for combat zones
8. Progression & Balance
    a. Stat categories, 
    b. leveling, 
    c. skill trees, 
    d. balance methods.
`unity-core-guide.md` references:
- Sec 9 "ScriptableObject" (L95-104): weapon stats, enemy/level configs as shared SOs
`unity-agents-template.md` references:
- Sec 4.2 (L546-599): data containers with flyweight pattern; SOs immutable, runtime copies mutable; SO vs JSON vs SQLite comparison
- Sec 2.5 (L348-376): [Serializable] for nested stat classes
- Sec 4.8 (L754-765): Open/Closed — new gladiator types via SO assets, not code changes
- Sec 4.11 (L796-830): granular stat components (Health, Mana, Stamina)
Associated URLs:
- https://docs.unity3d.com/Manual/class-ScriptableObject.html — SO for character stats, weapon definitions
- https://docs.unity3d.com/6000.4/Documentation/Manual/script-serialization-rules.html — serialization rules
- https://docs.unity3d.com/Manual/Serialization.html — serializable classes for stat structs
- https://github.com/UnityTechnologies/PaddleGameSO — flyweight pattern for shared data
9. Save & Persistence
    a. JsonUtility/PlayerPrefs, 
    b. serialization patterns, 
    c. three-tier persistence model.
`unity-core-guide.md` references:
- Sec 9 "ScriptableObject" (L95-104): SOs as persistent .asset files
`unity-agents-template.md` references:
- Sec 2.5 "Serialization" (L348-376): full serialization rules, [SerializeField], [NonSerialized], [SerializeReference], [CreateAssetMenu], Editor persistence in Play Mode
- Sec 4.2 (L546-599): SOs as immutable definitions; JSON for small saves, SQLite for large inventories
- Sec 4.7 (L725-752): DontDestroyOnLoad for persisting managers across scenes
- Sec 3.1/3.2 (L451-480): OnDestroy for cleanup, OnEnable/OnDisable for subscription lifecycle
Associated URLs:
- https://docs.unity3d.com/Manual/class-ScriptableObject.html — SO data assets
- https://docs.unity3d.com/6000.4/Documentation/Manual/script-serialization-rules.html — serialization rules
- https://docs.unity3d.com/Manual/Serialization.html — serialization overview
- https://docs.unity3d.com/Manual/event-functions.html — lifecycle callbacks for state cleanup
- https://docs.unity3d.com/Manual/performance-memory-overview.html — memory management, GC
10. Onboarding
    a. Tutorial patterns, 
    b. progressive difficulty, 
    c. contextual tooltips.
`unity-core-guide.md` references:
- No direct references
`unity-agents-template.md` references:
- Sec 1.1 (L50-51): Scenes/Loading/ for tutorial asset preparation
- Sec 2.5 (L371-376): [Tooltip()], [Header()], [ContextMenuItem()] for contextual guidance
- Sec 6.2 (L1079-1097): Debug.DrawLine, OnDrawGizmos() for tutorial testing
- Sec 5.3 (L928-936): Addressables grouped by usage (Intro, Tutorial, Level1) — progressive loading
Associated URLs:
- No matching URLs
11. Enemy AI
    a. AI behavior design, 
    b. behavior trees, 
    c. difficulty scaling for NPC opponents.
`unity-core-guide.md` references:
- Sec 9 "ScriptableObject" (L95-104): enemy definitions as shared SO data
`unity-agents-template.md` references:
- Sec 4.3 "State Machine Patterns" (L601-655): FSM vs Behavior Tree comparison — FSM for 3-12 states, BT for 50+ behaviors; hybrid pattern; guard conditions with hysteresis; shared blackboard; animation coordination
- Sec 1.1 (L78): Enemies/ feature folder in large project structure
- Sec 2.2 (L268): EnemyBase abstract class pattern
- Sec 4.11 (L796-830): ECS for hundreds of NPCs, EntityQuery for targeting
Associated URLs:
- https://docs.unity3d.com/Manual/class-ScriptableObject.html — enemy definition data containers
- https://docs.unity3d.com/Manual/AnimationsOverview.html — Animator for AI state coordination
- https://docs.unity3d.com/Packages/com.unity.2d.animation@latest/ — 2D skeletal animation for enemies
12. Input Handling
    a. New Input System, 
    b. action maps, 
    c. input buffering, 
    d. gamepad support.
`unity-core-guide.md` references:
- No direct references in Part 1 (Input in Part 2, Chapter 15)
`unity-agents-template.md` references:
- Sec 5.6 "Input System" (L983-995): New Input System recommended; cache action refs in Start(), read .value in Update(); unsubscribe on scene unload
- Sec 3.3 "Critical Rules" (L483-497): never read input in FixedUpdate — read in Update, store intent
- Sec 3.4 (L499-519): input buffer pattern — read in Update, apply in FixedUpdate via _inputBuffer
- Sec 1.1 (L54): Settings/ folder for input settings
Associated URLs:
- https://docs.unity3d.com/Packages/com.unity.inputsystem@latest/ — New Input System
13. Stretch Goals
    a. Localization, 
    b. accessibility, 
    c. build/deployment, 
    d. performance budget.
`unity-core-guide.md` references:
- No direct references
`unity-agents-template.md` references:
- Sec 5.1-5.2 (L839-883): CPU/GPU budgets — mobile 30-60fps, <200 draw calls mobile, <2000 desktop
- Sec 5.3 (L888-925): 0 bytes GC/frame golden rule, allocation avoidance, Addressables, Memory Profiler
- Sec 5.7 "Profiling Workflow" (L996-1008): bottleneck identification, CPU/GPU profiling, memory snapshots
- Sec 5.8 "Platform-Specific" (L1013-1038): mobile targets, Build Profiles for platform-specific settings
- Sec 1.3 "Assembly Definitions" (L106-139): platform-specific compilation support
- Sec 6.3 "CI/CD Pipeline" (L1096-1115): lint -> test -> build -> deploy, parallel multi-platform builds
Associated URLs:
- https://docs.unity3d.com/Manual/Profiler.html — CPU/profiling tools
- https://docs.unity3d.com/Packages/com.unity.memoryprofiler@1.1/ — memory profiler
- https://docs.unity3d.com/Manual/Jobs.html — Job System
- https://docs.unity3d.com/Manual/Burst-Overview.html — Burst Compiler
- https://docs.unity3d.com/Manual/BestPracticeUnderstandingPerformanceInUnity.html — performance best practices
- https://docs.unity3d.com/Manual/UnityCloudBuild.html — Cloud Build
- https://docs.unity3d.com/Manual/ci-cd-overview.html — CI/CD practices
- https://docs.unity3d.com/Manual/performance-memory-overview.html — memory overview
- https://docs.unity3d.com/Manual/AssetsScenesAndResources.html — asset pipeline for build optimization








 Start by having subagents read through the files ``unity-agents-template.md`` and ``unity-core-guide.md``, as well as research online what are the "big picture" aspects of the game that are going to need to be fleshed out and planned before we can begin development. To avoid running out of context, make sure to split the subagent tasks into small pieces (especially with regard to the two input files I gave you which are large)



Next, with the new full list please dispatch a subagent to look through the ``unity-core-guide.md`` and ``unity-agents-template.md`` for references for each of the topics. Organize the output for each big picture idea alongside their associated references.


The subagents are trying many random urls resulting in compactions and loss of data. Restart section 8 with the following additional constraints explicitly included in the subagent instructions: 
- Use "websearch" when you run out of known valid urls to perform "webfetch" with. If you get two `404`s from "webfetch" calls in a row, use "webfetch" on the current topic to find new valid urls to search.
- Only use "webfetch" with known valid urls.
- You may only lookup a maximum of 10 websites.

Since section 13 was partially worked before, instruct the subagents to merge their findings into the existing file for their topic (if it exists) instead of overriding it. The subagents must NOT read their existing output file before doing research, their research should be fresh without bias to the previous run. 
Make sure the changes aren't marked as "new" or anything like that, they should be seamlessly added to the existing body of work, adding new sections and references as appropriate.


Looks good, but for all new subagents make sure to include these additional requirements within their set of critical instructions along side the existing critical instructions:
- The agent should run a quick curl call on each URL **before** running webfetch on it to establish if it is a valid endpoint by checking the status code `curl -s -o /dev/null -w "%{http_code}" <url>`. Do not webfetch urls that return a non-valid status code (2xx)

Should have subagents look to wikipedia for context and related material for generic topics






<!-- First/second pass -->

## Mission

Plan a 2D turn-based gladiator fighting game in Unity using C#. Establish the "big pieces" needed for the game (player characters, enemies, UI, combat scene, onboarding, saving state, etc.) through subagent researchers.

You are the orchestrator. The ONLY file you are allowed to read from is the "guide" document at `docs/research/big-picture/guide.md`, **do not read any other files or lookup information yourself** - delegate all work to subagents. Aggressively rely on subagents and have them summarize information back to you.

**This is research only.** Do not implement code. Do not have subagents implement anything. Collect information and produce well-organized documentation for reuse during development.

## Tech Stack

All research targets: **2D turn-based gladiator fighting game in the Unity game engine using C#**

## Subagent Rules

Only spawn @Librarian subagents for the research. Apply these rules to EVERY subagent you spawn (be explicit in the subagent prompts):

1. **Sequential execution** - Spawn one subagent at a time. Wait for completion before spawning the next. Never spawn multiple agents in parallel.
2. **Single topic scope** - Each subagent researches one checklist subpoint. Limit tightly to prevent scope creep.
3. **Output files** - Subagent must write results to `docs/research/big-picture/` as a `.md` file named after the subpoint (e.g. `01.a-three-layer-model.md`). The file must include the subagent's prompt at the top, then findings, then valid references used. Do not include full conversation or thought process - just prompt, reported results, and references. Additionally, include valid associated references that were used in the findings (file refernces with lines as well as url links).
4. **Write before return** - Subagent must write its research file BEFORE returning results back to you.
5. **Web research** - Subagents must perform ONE websearch/webfetch at a time. Never in parallel. Webfetch URLs must come from known valid sources or previous websearch results, never guessed.
6. **Research only** - No implementation plans. Collect information about the expected tech stack and assigned topic. Broad strokes only, no fine implementation details.
7. **References** - Include only valid references in the documentation. URLs that resulted in failed webfetches must be excluded.
8. **No decisions** - Agents should not decide between competing options. When multiple options exist, mention each, note whether native to Unity, and note which is most recent (e.g. legacy vs new systems).
9. **Local docs are starting point** - The guide document and associated local references provide a starting point but are NOT the sole source. Expand research through online references. Explicitly inform the subagents where the guide document is located, and to use it as a jumping off point to collect basic information from the associated files/urls. Again, these should be mentioned as the starting point for the subagent's research and MUST NOT be the sole source of their findings.
10. Explicitly include the expected tech stack for each agent to keep research narrowed (2D turn based gladiator fighting game in the Unity game engine using the C# programming lanugage)
11. Explictly tell the subagents they MUST NOT read the input documents directly (`unity-core-guide.md` and `unity-agents-template.md`), they can only read the lines specified in their given references.
12. Merge their findings into the existing file for their topic (if it exists) instead of overriding it. The subagents must NOT read their existing output file before doing research, their research should be fresh without bias to the previous run. Make sure the changes are not marked as "new" or anything like that, they should be seamlessly added to the existing body of work, updating existing sections, adding new sections and references as appropriate.

## Stop Checkpoints

After completing each main section (all subpoints within section 1, all subpoints within section 2, etc.), **stop and report progress**. Do not continue to the next section until confirmed.


## Research Checklist

Work through these subpoints sequentially. Each gets its own subagent.

## Execution Order

1. Start with Section 1, subpoint 1.a
2. Spawn subagent with the topic, relevant local doc references from `docs/research/big-picture/guide.md`, and all subagent rules
3. Wait for completion, verify output file was written
4. Mark subpoint complete, proceed to next
5. After finishing all subpoints in a section, **stop and report**
6. Upon confirmation, continue to next section
7. Repeat through all 13 sections

## Guide Document Reference

Local doc for section-specific references and URLs: `docs/research/big-picture/guide.md`

When spawning a subagent for a given subpoint, provide that subagent with:
- The subpoint topic description
- The `guide.md` references relevant to that section (the local doc references and Associated URLs listed under that section number)
- All subagent rules from above
- The tech stack context
- The output file path to write to




⚙websearch_web_search_exa [query=Unity uGUI vs UI Toolkit comparison 2024 2025 2026 2D game UI]
Streamable HTTP error: Error POSTing to endpoint: {"jsonrpc":"2.0","error":{"code":-32000,"message":"You've hit Exa's free MCP rate limit. To continue using without limits, create your own Exa API key.\n\nFix: Create API key at https://dashboard.exa.ai/api-keys , then either:\n- Set the header: Authorization: Bearer YOUR_EXA_API_KEY\n- Or use the URL: https://mcp.exa.ai/mcp?exaApiKey=YOUR_EXA_API_KEY"},"id":null}









<!-- Fresh pass -->

## Mission

Plan a 2D turn-based gladiator fighting game in Unity using C#. Establish the "big pieces" needed for the game (player characters, enemies, UI, combat scene, onboarding, saving state, etc.) through subagent researchers.

You are the orchestrator. The ONLY file you are allowed to read from is the "guide" document at `docs/research/big-picture/guide.md`, **do not read any other files or lookup information yourself** - delegate all work to subagents. Aggressively rely on subagents and have them summarize information back to you.

**This is research only.** Do not implement code. Do not have subagents implement anything. Collect information and produce well-organized documentation for reuse during development.

## Tech Stack

All research targets: **2D turn-based gladiator fighting game in the Unity game engine using C# (2026)**

## Subagent Rules

Only spawn @Librarian subagents for the research. Apply these rules to EVERY subagent you spawn (be explicit in the subagent prompts):

1. **Sequential execution** - Spawn one subagent at a time. Wait for completion before spawning the next. Never spawn multiple agents in parallel.
2. **Single topic scope** - Each subagent researches one checklist subpoint. Limit tightly to prevent scope creep.
3. **Output files** - Subagent must write results to `docs/research/big-picture/` as a `.md` file named after the subpoint (e.g. `01.a-three-layer-model.md`). The file must include the subagent's prompt at the top, then findings, then valid references used. Do not include full conversation or thought process - just prompt, reported results, and references. Additionally, include valid associated references that were used in the findings (file refernces with lines as well as url links).
4. **Write before return** - Subagent must write its research file BEFORE returning results back to you.
5. **Web research** - Subagents must perform ONE websearch/webfetch at a time. Never in parallel. Webfetch URLs must come from known valid sources or previous websearch results, never guessed.
6. **Research only** - No implementation plans. Collect information about the expected tech stack and assigned topic. Broad strokes only, no fine implementation details.
7. **References** - Include only valid references in the documentation. URLs that resulted in failed webfetches must be excluded.
8. **No decisions** - Agents should not decide between competing options. When multiple options exist, mention each, note whether native to Unity, and note which is most recent (e.g. legacy vs new systems).
9. **Subagents must NOT read ANY local documentation before research**. They cannot read ANY! NONE! Not a single file before completing their research. 
10. **All information must come from the web!!**
11. Explicitly include the expected tech stack for each agent to keep research narrowed (2D turn based gladiator fighting game in the Unity game engine using the C# programming lanugage).
12. Explictly tell the subagents they MUST NOT read the input documents directly (`unity-core-guide.md` and `unity-agents-template.md`).
13. Merge their findings into the existing file for their topic (if it exists) instead of overriding it. **The subagents must NOT read their existing output file before doing research**, their research should be fresh without bias to the previous run. Make sure the changes are not marked as "new" or anything like that, they should be seamlessly added to the existing body of work, updating existing sections, adding new sections and references as appropriate.
14. Perform "websearch"es for their assigned topic with the tech stack in mind.
15. Return to the primary agent only the number of git line changes for the subagent output file, nothing else.

## Research Checklist

Work through these subpoints sequentially. Each gets its own subagent.

## Execution Order

1. Start with Section 1, subpoint 1.a
2. Spawn subagent with the topic and all subagent rules
3. Wait for completion, verify output file was written
4. Mark subpoint complete, proceed to next
5. After finishing all subpoints in a section, spawn a new subagent to:
    a. Verify all the current section's output files were updated (using git stats). 
    b. If any subsections were missed, return to the primary agent which subsection(s) were missed so they can be re-done.
    c. If all subsections were updated, commit the changes using conventional commits, then return to the primary agent that the section is complete and the number of file lines that were changed via git stats. Do not return anything else (no summary, change details, etc).
6. If the reviewer subagent found any subsections were not updated, restart at step 2 for each of the missed subsections.
7. Upon confirmation all subsections for the current section were completed, continue to next section
8. Repeat through all 13 sections

## Guide Document Reference

**CRITICAL: NEVER SPAWN SUBAGENTS IN PARALLEL!**

When spawning a subagent for a given subpoint, provide that subagent with:
- The subpoint topic description
- All subagent rules from above
- The tech stack context
- The output file path to write to
- The subagent **must NOT read their output file until after their research is completed**.



Help me write a user agent skill. The purpose of the skill is to generate a "guide" document for the the skill at 'skill/research/phase-1-overview/Skill.md' by establishing the "big ideas" or "core components" to a project.

This is a workflow skill meant to first capture the key components/topic of the work to be researched directly from the user, then to research the appropriate "big ideas" associated with that topic. The skill needs to start by collecting the following information (tailored towards software development):
- What is the general topic being researched?
    - eg) "2D game development on the Unity engine", "Frontend website development", "New backend service to manage okta groups", etc
    - the point is to help narrow the scope of the research, establish associated topics to drive research, and to ensure the consistency between research topics 
- What is the tech stack?
    - Need to find out specifics about the proposed topic. Some information can be directly found from the users topic (for example using "Unity game engine" means the programming language will be "C#")
    - Is the topic about fronend/backend work? What programming language(s) are expected to be used with it? Required framework constrains?
    - Keep it broad, this step does not need to decide on all the specifics (like all the frameworks, necessary infrastructure, design patterns, etc), just the core details that serve as immutable requirements for the work being researched/planned.
    - Ask 2-5 follow up questions to narrow down the requirements.
    - Allow the user to provide as much detail as they would like for this step, as some users may have a specific scenario in mind.

Once the agent has a general understanding of what is in scope and what is out of scope, they should start a couple independent subagents to find out what the "big ideas"/"core featues" of the tech stack that will need to be research later in further depth.













<!-- Summary from big-overview prompt - TODO - change footer from line numbers to files last edited commit sha -->
Aggressively use subagents to summarize each "section" of the docs located at './docs/research/big-picture/' (each section starts with the same number ie, 01.a-..., 01.b-..., 01.c-..., are all the same section, and are different from 02.a-..., 02.b-... which is another section). **CRITICAL: DO NOT READ ANYTHING YOURSELF, SPAWN A SUBAGENT TO REVIEW EACH SECTION** (one subagent per section). **CRITICAL: DO NOT SPAWN PARALLEL SUBAGENTS** - only spawn one subagent at a time. Have them output their summaries under 'docs/research/summaries/<section>-summary.md' where the file-name should be the section summarized (01.a-01.z -> '01-summary.md'
Please make sure to request the following formatting from all summary subagents:
```
# Chapter NN Summary — <Title>

<1-line scope>

---

## NN.a — <Topic>

**What it is / Core rule / Why:** <one-liner>

### <Sub-area 1>
- **Key label:** detail
- **Key label:** detail

### <Sub-area 2>
1. numbered item
2. numbered item

| table for comparison/decision |

---

## NN.b — <Topic>

(same pattern repeats)

---

## Cross-Cutting Takeaways

### Architecture Decision
- decision bullets

### Data Flow
- flow bullets

### Modern Patterns Worth Adopting
- pattern bullets

### Anti-Pattern Checklist
1. bad pattern — fix
2. bad pattern — fix

---

*Generated from: NN.a (lines), NN.b (lines), ...*
```
Styling: No H4+. --- between sections. Bold-colon bullets. Code blocks for technical identifiers. Tables for decision-making content.
Key stylistic notes:
1. H1 Header - # Chapter NN Summary — <Topic Title> + 1-line scope + ---
2. H2 Subsections - ## NN.X — <Sub-topic> (one per source doc) + --- separator
3. Intro line - **What it is:** or **Core rule:** one-liner
4. H3 Sub-subsections - Pattern breakdowns, best practices, APIs, pitfalls
5. Content format - Bold-colon bullets, numbered lists, inline code for technical refs
6. Tables - For comparisons, decisions, type listings
7. Cross-Cutting Takeaways - Final H2 before footer, covers architecture decisions, data flow, patterns, anti-pattern checklist
8. Footer - *Generated from: NN.a (NNN lines), ...*













<!-- phase 2 - generate descisions doc -->

<!-- original prompt -->
Please review the summary docs at 'docs/research/summaries/' and establish a "decision" doc at docs/research/dicisions.md. This file should contain all of the big dicisions that need to be made in order to implement "a 2D gladiator fighting game in the Unity game engine C# programming language (2026)" based on the existing summaries. The doc should cover all of the conflicting details (such as multiple options for frameworks, differing design patterns, differing practices, major game design choices) necessary for the techstack and based on the input documents. Provide suggestions for which items should be prefered (along with the reasoning for why one choice is prefered over others). List each of the items that needs a dicision using unmarked checkboxes with a "decision" subsection defaulted to "UNDECIDED" (since no decision has been made yet). Be sure to reference which file the conflicting items came from. Keep in mind that decisions may effect other sections, so this needs to be a cummulative document taking into account all of the summary files. Include a separate list with expected/required decisions for design patterns/best practices/architecture decisions that do not have multiple options and are there for automatic requirements for the expected project that will be produced by this analysis.


<!-- skill -->

## Output File Format

```markdown
# Research Decisions — [PROJECT TITLE]

> Cumulative decision register derived from `docs/research/summaries/` source documents.
> Each item lists conflicting options, reasoning for preferred choice, and current decision state.

---

## Table of Contents

- [Mandatory Requirements](#mandatory-requirements)
- [CATEGORY-1 Decisions](#category-1-decisions)
- [CATEGORY-2 Decisions](#category-2-decisions)
- ...

---

## Mandatory Requirements

### Requirements with no viable alternatives — automatic constraints for this project.

- [x] **Requirement Name** — One-line justification. *(source-ref)*
- [x] **Requirement Name** — One-line justification. *(source-ref)*

---

## Category Decisions

### Prefix-NN: Decision Title

**Options:**
- **Option A** — Brief description, key tradeoff
- **Option B** — Brief description, key tradeoff
- **Option C** — Brief description, key tradeoff

**Sources:** `source-ref-1` (topic covered), `source-ref-2` (detail covered)

> **Preferred:** Chosen option + 2-3 sentence reasoning. Reference architectural constraints, performance, or scope. Why this over Others.

**Decision:** UNDECIDED | LOCKED | DEFERRED

---

## Cross-Decision Dependencies

| Decision | Affects | Notes |
|----------|---------|-------|

---

## Decisions List Summary

| ID | Category | Decision | Status |
|----|----------|----------|--------|

---

*Last updated: YYYY-MM-DD*
*Source documents: N-summary.md through M-summary.md*
```

Key structural rules the AI agent follows:
1. Mandatory first — no-alternative constraints listed before debatable decisions
2. ID prefix by category — Arch-, Comb-, UI-, etc. for cross-referencing
3. Options always enumerated — never just a decision, always the alternatives considered
4. Sources cited — back-references to source documents in parens
5. Preferred block in blockquote — separate reasoning from options
6. Decision state explicit — UNDECIDED/LOCKED/DEFERRED, not implied
7. Summary table at bottom — machine-parseable status register
8. Dependency matrix — shows which decisions couple together