---
name: dependency-audit
description: >
  Use when auditing project dependencies for security, supply-chain risks,
  typosquatting, maturity, and validity before installation or reviewing
  existing project packages. Triggers: "review dependencies", "audit packages",
  "check for malicious packages", "validate dependencies", "supply chain review",
  "dependency security check", or reviewing documents that reference packages.
---

# Dependency Security Audit

## Overview
Comprehensively audit project dependencies for safety, supply-chain integrity, typosquatting, maturity, and known vulnerabilities. Supports two input modes: reviewing existing project manifests or auditing dependencies referenced in documentation before installation.

**Core principle:** Validate every dependency against registry data, vulnerability databases, maintainer reputation, and typosquatting signals before any package is trusted.

## Configuration

These configurable values serve as placeholders. Values with defaults are used automatically; values marked Example require context from the user.

| Variable | Purpose | Default/Example |
|----------|---------|-----------------|
| (`OUTPUT_FILE`) | Path for the consolidated audit report | Default: `docs/dependency-audit/dependency-audit.md` |
| (`BATCH_SIZE`) | Number of packages per subagent batch | Default: `8` |
| (`INPUT_SOURCES`) | Paths or mode specification | Example: `package.json` or `docs/spec.md` |
| (`PROJECT_NAME`) | Project identifier for report title | Default: `project` |

## When to Use

- **Preemptive review** — User provides documentation referencing packages to include and wants to validate them before installing
- **Existing project audit** — User requests review of a repository's current dependency tree
- **Supply chain concerns** — Any question about whether a named package is legitimate
- **Typosquatting checks** — Validating that package names match their legitimate registries
- **Security compliance** — Auditing for known vulnerabilities and maintainer trust signals

## When NOT to Use

- Simple version bump verification without security concerns
- Transitive-only dependency audits without explicit user request
- Package comparison or "which library should I use" questions (use research skills instead)

---

## Workflow

```dot
digraph workflow {
    rankdir=LR;
    A["Determine input mode"] -> B["Discover dependencies"];
    B -> C["Deduplicate & normalize"];
    C -> D["Batch into groups"];
    D -> E["Dispatch subagent per batch"];
    E -> F{"All batches done?"};
    F ->|"no"| E;
    F ->|"yes"| G["Compile consolidated report"];
    G -> H["Write to OUTPUT_FILE"];
    H -> I["Present executive summary"];
}
```

### Phase 1: Discovery

**Determine input mode** based on user context:

**Mode A — Project Manifests (existing project):**
1. Scan workspace for known manifest files. Supported ecosystems:
   - npm: `package.json`
   - Python: `requirements.txt`, `pyproject.toml`, `Pipfile`
   - Rust: `Cargo.toml`
   - Go: `go.mod`
   - Ruby: `Gemfile`
   - Java: `pom.xml`, `build.gradle`
   - Dart/Flutter: `pubspec.yaml`
2. Parse each manifest to extract `{package_name, version_constraint, ecosystem}` tuples
3. Auto-detect ecosystem per manifest file

**Mode B — Documentation Review (preemptive):**
1. Read specified document(s) from (`INPUT_SOURCES`)
2. Extract package references using these patterns:
   - Import/require statements: `import foo`, `require('bar')`, `from 'baz'`
   - Install commands: `npm install foo`, `pip install bar`, `cargo add baz`, `gem install qux`
   - Explicit mentions: "we use [package-name]")
   - Dependency lists or tables
3. For ambiguous references, ask the user to confirm the package name and ecosystem
4. If the user provides explicit package names, use those directly

### Phase 2: Deduplication & Normalization

1. Normalize package names per ecosystem conventions (e.g., npm uses lowerdash, PyPI case-insensitive)
2. Remove duplicates (same package referenced multiple times)
3. Build final dependency list with `{name, version?, ecosystem, source_file, line_number?}`
4. Report the count: "Discovered N dependencies across M ecosystems"

### Phase 3: Batch & Dispatch

1. Split dependency list into batches of (`BATCH_SIZE`) packages
2. For each batch, dispatch ONE subagent sequentially (never parallel)
3. Include in each subagent prompt:
   - The batch of packages with their ecosystems
   - All subagent rules (below)
   - `(`PROJECT_NAME`)` for report attribution
4. Wait for each subagent to complete before dispatching the next
5. Verify each subagent returned structured data before proceeding
6. **Error handling** — If a subagent fails or returns malformed data, retry that batch once. If the retry also fails, mark those packages as "Unknown/Unverifiable" and continue to the next batch.

### Phase 4: Compilation

1. Merge all subagent results into the consolidated report format (below)
2. Calculate risk summary counts
3. Write final report to (`OUTPUT_FILE`), creating parent directories if needed
4. Present executive summary to user

---

## Subagent Rules

Include these rules verbatim in every subagent dispatch:

1. **Research only** — collect information, do not install anything, no implementation code
2. **One web fetch at a time** — sequential URL fetching, never parallel web requests
3. **No recommendations** — factual findings only. The parent orchestrator synthesizes recommendations after compilation.
4. **References mandatory** — every factual claim must include a source URL. No unverifiable claims.
5. **Typosquatting is critical** — explicitly compare each package name against well-known packages in the same ecosystem
6. **Check all dimensions** — cover every category in the Research Scope section (below)
7. **Return structured data** — use the exact output schema specified below
8. **If registry lookup fails** — mark package as `UNKNOWN` with explanation; do not skip it
9. **Be conservative** — when signals are mixed, prefer the higher risk level

---

## Research Scope (Per Package)

Each subagent researches these six dimensions. Report findings with inline URLs:

| Dimension | What to Research | Key Data Points |
|-----------|------------------|-----------------|
| **Name Validity & Typosquatting** | Does the exact package exist? Is name similar to a well-known package? | Registry confirmation, semantic similarity to well-known packages in the same ecosystem, alternative spelling checks |
| **Registry Metadata** | Publisher identity, publication history, activity | First publish date, recent update frequency, download counts, total versions, npmjs.com/pypi.org/crates.io URLs |
| **Known Vulnerabilities** | CVE databases and security advisories | NVD CVE list, GitHub Security Advisories, Snyk, osv.dev, npm/advisory, Ruby Advisory Database |
| **Maintainer Reputation** | Who publishes this? Are they trusted? | GitHub profile age, other published packages, response patterns, abandoned-project signals |
| **Maturity Signals** | Project health and community | GitHub stars, contributors, issue/PR velocity, release frequency, documentation quality, changelog presence |
| **Supply Chain Risk** | Does the package do anything suspicious? | postinstall/preinstall scripts, native binary bundles, transitive dep count, ownership transfers, repo URL mismatches |

---

## Output Report Format

The consolidated report at (`OUTPUT_FILE`) must follow this structure:

```markdown
# Dependency Security Audit: (`PROJECT_NAME`)

Generated: <date>
Mode: <Project Manifests | Document Review>
Source: <manifest file paths or document paths>

---

## Executive Summary

- **Total packages analyzed:** N
- **Low risk (✅):** X packages
- **Medium risk (⚠️):** Y packages
- **High risk (🔴):** Z packages
- **Unknown/Unverifiable (❓):** W packages
- **Overall assessment:** <brief risk classification>

---

## Risk Summary Table

| Package | Version | Ecosystem | Risk | Key Concern |
|---------|---------|-----------|------|-------------|
| <name> | <ver> | <eco> | ✅/⚠️/🔴/❓ | <1-line reason> |

---

## Detailed Findings

### Package: `<name>`

- **Ecosystem:** <npm / PyPI / crates.io / ...>
- **Version:** <specified or "not specified">
- **Registry:** [link](<registry URL>)
- **Repository:** [link](<source repo URL>) or `No source repo found`
- **Maintainer:** <name>, <account age>, <reputation notes>
- **Name Validity:** ✅ Confirmed / ⚠️ Typosquatting risk: <details> / ❓ Unverifiable
- **Vulnerabilities:** None / CVE-XXXX-XXXXX (<summary>, [advisory link])
- **Maturity:** <stars>, <downloads>, <first published>, <update frequency>
- **Supply Chain:** <postinstall scripts?>, <transitive dep count>, <ownership history>
- **Risk Level:** ✅ Low / ⚠️ Medium / 🔴 High / ❓ Unknown
- **References:**
  - [Registry page](<url>)
  - [Repository](<url>)
  - [Security advisory](<url>)
  - [Additional source](<url>)

### Package: `<next>`
...

---

## Recommendations

### Immediate Action Required (🔴)
- <package>: <reason>, suggested alternative (if known from research data)

### Monitor Closely (⚠️)
- <package>: <concern>, recommended follow-up

### Approved (✅)
- <package>: <confirmation>

---

## Methodology

This audit checked each dependency against:
1. Package registry for name validity and typosquatting
2. Registry metadata for maintainers and publication history
3. Vulnerability databases (NVD, GitHub Advisories, osv.dev, Snyk)
4. Repository signals for maturity and activity
5. Supply chain indicators (scripts, binary bundles, ownership)

References are included for every finding. Unknown/unverifiable packages are flagged separately.
```

---

## Subagent Prompt Template

Use this template to dispatch each batch subagent. Replace (`VAR_NAME`) references with configuration values.

```
You are a dependency security research agent auditing packages for a project.

Batch of packages to research:
[one per line]
- <package_name> (<ecosystem>, version: <ver or "unspecified">)

For EACH package, research these dimensions:
1. Name Validity & Typosquatting — verify exact name, compare to well-known similar packages
2. Registry Metadata — publisher, dates, downloads, version count
3. Known Vulnerabilities — check NVD, GitHub Advisories, osv.dev, ecosystem-specific databases
4. Maintainer Reputation — profile age, other packages, activity signals
5. Maturity — stars, contributors, release frequency, documentation
6. Supply Chain Risk — postinstall scripts, binary bundles, transitive deps, ownership history

Rules:
- Research only — no installation, no code
- One web fetch at a time, sequential only
- No recommendations — factual findings only
- References mandatory — every claim needs a source URL
- Include typosquatting analysis for every package
- Return findings in the structured format below

Return structured findings for each package in this exact format:

PACKAGE: <name>
ECOSYSTEM: <ecosystem>
VERSION: <version or "unspecified">
REGISTRY_URL: <URL>
REPO_URL: <URL or "none found">
MAINTAINER: <name, age, notes>
NAME_VALIDITY: "Confirmed" | "Typosquatting risk: <detail>" | "Unverifiable"
VULNERABILITIES: "None" | "CVE-XXXX-XXXXX: <summary> (<advisory_url>)"
Maturity: "<stars> stars, <downloads>, first published <date>, <update freq>"
SUPPLY_CHAIN: "<script flags>, <transitive count>, <ownership notes>"
RISK_LEVEL: "Low" | "Medium" | "High" | "Unknown"
REFERENCES:
  - <url> — <source description>
  - <url> — <source description>
---
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping typosquatting check on obviously well-known packages | Even `lodash` had typosquats. Always run name validation |
| Accepting "no vulnerabilities found" without checking multiple databases | Check NVD + GitHub Advisories + osv.dev at minimum |
| Missing registry URL in references | Every finding needs a source; mark `Unknown` if uncheckable |
| Running subagents in parallel | Context will explode and URLs may conflict. Always sequential |
| Making version assumptions when unspecified | Always state "version unspecified" rather than guessing |
| Ignoring postinstall scripts | These are a primary supply-chain attack vector; always flag them |

---

## Critical Rules

- **Never install a package** — all research is read-only via web and registry lookups
- **Conservative risk assessment** — when signals conflict, classify at the higher risk level
- **One subagent at a time** — sequential dispatch only, no parallel research
- **Report is the output artifact** — the file at (`OUTPUT_FILE`) is the deliverable. Verify it exists after compilation
- **Typosquatting is not optional** — every package gets a name validity check, regardless of how well-known it appears

---

## Ecosystem-Specific Registry References

Use these as baseline lookup sources per ecosystem:

| Ecosystem | Registry | Vulnerability DB | Source Mirror |
|-----------|----------|------------------|---------------|
| npm | npmjs.com | npm/advisory, snyk.io, osv.dev | github.com |
| PyPI | pypi.org | snyk.io, osv.dev, pepy.tech | github.com |
| crates.io | crates.io | rustsec.org, osv.dev | github.com |
| Go modules | pkg.go.dev | osv.dev, github.com/advisories | go.googlesource.com |
| RubyGems | rubygems.org | ruby-advisory-db-db.github.io, snyk.io | github.com |
| Maven Central | mvnrepository.com | nvd.nist.gov, snyk.io | github.com |
| pub | pub.dev | osv.dev | github.com |
