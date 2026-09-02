# Python Reference (pseudocode-v2)

Per-language companion to `explanation.md`. The abstract drafting rules live in that document (§2–§6); below is how each translates into **Python** — the implementation language of the source project for the annotated real-document excerpts included in this file. Sibling files cover other languages; reach them only through the router at `../examples.md`.

## Idiom Translations

- **Model shape (near-compilable skeleton):** `@dataclass` for record types; a plain class when behavior exceeds accessors. Every field typed; inline comments state the *semantics* of optionals, not just their type.
  ```python
  @dataclass
  class TodoItem:
      due_date: datetime | None   # None == "eventually"
  ```
- **Typed signatures everywhere:** annotate parameters **and** return on every `def`; no bare `(x)` parameters except `self`/`cls`.
- **Labeled arguments at call sites:** keyword args — `store.add(item=item)`, `TodoItem(id=..., status=...)`. Positional calls are a review finding.
- **Named errors → exit codes:** however many the spec needs; handlers never call `sys.exit` themselves.
  ```python
  except UsageError as e:    print(e); return 1
  except NotFoundError as e: print(e); return 1
  except StoreError as e:    print(e); return 2
  ```
- **No magic constants:** one or more `Config` classes + enums hold every literal, format string, and key name (each with a comment citing why it exists); a grep for raw date strings / top-level keys anywhere else in the file should return nothing.

## Annotated Real-Document Excerpts

The following are curated, lightly-trimmed excerpts from a real pseudocode document. Each carries a **"Why this works"** note — that note, not the code, is the transferable content; the same patterns apply to whatever language you are actually drafting in.

### 1. A per-piece section: explicit model shape + typed methods + tests

<example_1>

```python
@dataclass
class TodoItem:
    id: str
    status: Status
    priority: Priority | None          # None == absent (YAML null)
    tags: list[str]
    text: str
    due_date: datetime | None          # None == "eventually"
    created_date: datetime
    completed_date: datetime | None
    last_checked: datetime | None

    def to_record(self) -> dict:       # YAML-shaped: datetimes → Config.DATETIME_FMT strings,
                                       # priority → value or None; key order = dataclass field order above

    @classmethod
    def from_record(cls, record: dict) -> "TodoItem":
        # validate: required keys present & non-empty (id, text, created_date),
        # enums parseable, datetime strings parse with Config.DATETIME_FMT.
        # any violation → StoreError("bad record ...")  [data corruption, not user input]

    def sort_key(self) -> tuple[bool, datetime, int]:
        # spec §5: dated items first, ascending by due_date; null-due ("eventually") sink last;
        # ties broken by priority rank immediate < high < absent < low.
        return (self.due_date is None, self.due_date or datetime.min,
                self.priority.value if self.priority else Priority.NONE.value)

    def is_visible(self, now: datetime) -> bool:
        # spec §6 "active": status != DONE, OR done but not yet past the weekly archival gate —
        # i.e. completed in the current calendar week (or un-stamped manual-done) stays visible.
        if self.status is not Status.DONE: return True
        return self.completed_date is None or start_of_week(dt=now) <= self.completed_date
```

**Expected tests (`test_item.py`)**
- Round-trip: `TodoItem.from_record(record=item.to_record()) == item` for a fully-populated item and one with all optionals None.
- YAML round-trip through PyYAML: `yaml.safe_load(dump)` preserves `null` priority as null (not string `"None"`).
- Key order in `to_record()` is the dataclass field order (id, status, priority, tags, text, due_date, created_date, completed_date, last_checked); SPEC §3 example must match — matters for diff-friendly files.
- `from_record(record={...})`: missing or blank `text` → StoreError; malformed date string → StoreError; bad status value → StoreError.
- Sort: fixture with due-date ties across all 4 priority levels + absent → exact expected order via `sorted(items, key=TodoItem.sort_key)`; null-due items always after dated ones regardless of priority.
- `is_visible(now=...)`: done+completed-last-Sunday (now midweek) → False; done+completed-any-day-of-current-week → True; done with completed_date=None → True; todo/in-progress always True.

</example_1>

**Why this works**
- Field comments state **semantics of optionals**, not types (`None == "eventually"`) — the implementer never has to guess what a null means in the domain.
- Every signature is complete (params + return); bodies are one-line pseudocode or spec-citing comments, so transcription is mechanical but each behavior still points back to its requirement (`spec §5`, `spec §6`).
- Tests are given → expect bullets that name **exact fixtures and exact outcomes** — including the tie-ordering fixture and the null-handling round-trip that serialization bugs usually hide. No bullet says "test edge cases."

### 2. Pure logic with a verified anchor table for date behavior

<example_2>

```python
def floor_to_minute(dt: datetime) -> datetime: dt.replace(second=0, microsecond=0)

def start_of_week(dt: datetime) -> datetime:   # Monday 00:00 of the week containing dt (Mon-Sun weeks, spec §4)
    return (dt - timedelta(days=dt.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)

@dataclass(frozen=True)
class Range: start: datetime; end: datetime     # both inclusive, minute resolution

class TierCalculator:
    def __init__(self, now: datetime):
        self.now = floor_to_minute(dt=now)      # drop seconds for stable comparisons

    def range_for(self, tier: TierName) -> Range:
        d = self.now.date()
        TODAY:      (d @00:00,  d @EOD)
        TOMORROW:   (d+1 @00:00, d+1 @EOD)
        THIS_WEEK:  monday=d - timedelta(days=d.weekday())          # Mon=weekday 0
                    (monday @00:00, monday+6 days @EOD)             # Sunday end (spec §4)
        NEXT_WEEK:  (monday+7 @00:00, monday+13 @EOD)
        THIS_MONTH: first=(y,m,1); last=calendar.monthrange(y,m)[1]
                    (first @00:00, last day @EOD)
        NEXT_MONTH: roll (y,m)+1 handling Dec→Jan year increment;
                    use monthrange for that month's length           # leap-year Feb handled here

    def tiers_containing(self, due: datetime) -> list[TierName]:
        # all tiers where start <= due <= end — INCLUSIVE overlap (spec §4).
        # Ordered TODAY → NEXT_MONTH. due may fall outside every range (e.g., 2 weeks out) → [].

    def resolve_due(self, spec: str) -> datetime | None:
        "eventually"                       → None
        tier name                          → self.range_for(tier=tier).end   # END of bucket (spec round-4 answer)
                                             raise UsageError if end < self.now  (past buckets rejected)
        full ISO "YYYY-MM-DDTHH:MM"        → parse; UsageError if < now (consistent with past rejection)
        date only "YYYY-MM-DD"             → that day @EOD; same past check
        anything else                      → UsageError("unrecognized due spec")
```

**Expected tests (`test_tiers.py`)** — use real calendar dates (mocked `now`) as anchors:

| Anchor `now` | Asserts |
|---|---|
| Sun 2026-08-30 (real "today"; weekday=6) | THIS_WEEK = Aug 24 → Aug 30 23:59; NEXT_WEEK = Aug 31 → Sep 6 23:59; TOMORROW = Aug 31 (a Monday — cross-boundary case); THIS_MONTH ends Aug 31; NEXT_MONTH = Sep 1 → Sep 30 |
| Thu 2026-12-31 (weekday=3) | THIS_MONTH = Dec 1–Dec 31 **2026**; NEXT_MONTH rolls year: Jan 1 → Jan 31 **2027**; TOMORROW rolls year: Fri Jan 1 **2027**; THIS_WEEK spans the year boundary: Mon Dec 28 **2026** → Sun Jan 3 **2027**; NEXT_WEEK = Mon Jan 4 → Sun Jan 10 **2027** |
| Tue 2028-02-15 (leap year) | THIS_WEEK = Mon Feb 14 → Sun Feb 20; THIS_MONTH ends Feb **29** 23:59; NEXT_MONTH = Mar 1–31 |

(The full document carries additional anchors, including an exact-set membership table for the inclusive-overlap rule.)

- `resolve_due(tier name)` returns that tier's range END — e.g., with now=Mon 2026-08-31: `calc.resolve_due(spec="tomorrow")` == `datetime(2026, 9, 1, 23, 59)`.
- `resolve_due(bare date)` — a due spec with no time component defaults to end-of-day for that day (same rule as tier buckets): e.g., `calc.resolve_due(spec="2026-09-15")` == `datetime(2026, 9, 15, 23, 59)`.
- `resolve_due(spec="eventually")` → None.
- Rejections: with now=Mon Aug 31, `calc.resolve_due(spec="this-week")` (ended Sun 23:59) → UsageError; explicit past ISO → UsageError; garbage string → UsageError.

</example_2>

**Why this works**
- Date logic is the classic place plans go hand-wavy; here every anchor is a **real, verified date chosen to hit a boundary** — cross-week day (Sunday), year rollover mid-week, leap-year month end. The weekday labels are part of the assertion (`weekday=3`), not decoration.
- Happy paths and rejection paths sit in the same bullet list, each with a concrete input and named error type.
- `resolve_due` is written as an input→output table inside the signature block — unambiguous without any prose paragraph.

### 3. Locked-decision notes (the load-bearing sentences)

<example_3>

```
Interpretation notes (locked here for implementation):
- `last_checked` is stamped on **all non-done items** each sync (their expiry was evaluated), not only the overdue ones — per spec §3 field note. Stamping happens in the store layer after analysis.
- **Weekly archival gate.** An item is archivable when done AND completed before this week's Monday 00:00. A mid-week sync right after a month rollover therefore never sweeps work from the current week — nothing completed Mon–Sun of the *current* week is ever touched by sync; an item completed last Sunday becomes archivable at any sync on/after this Monday (spec §7 step 4).
- **Manual-done items** (`status=done` with `completed_date=None`, i.e. a hand edit) are not malformed data: apply_sync stamps `completed_date=now`, after which they follow the normal weekly gate — visible for the rest of this week, archived at the first sync on/after next Monday (spec §7 step 2b).
```

</example_3>

**Why this works**
- Each note is **decision + provenance tag + concrete consequence**. The second bullet doesn't just state the rule; it states what the rule *prevents* ("never sweeps work from the current week") — that's the sentence a future maintainer (or reviewer) quotes.
- Provenance tags (`spec §7 step 4`, `round-N answer`) make every choice auditable and prevent re-litigation; the orientation note at the top of the document lists these by name for exactly that reason.
- The third bullet resolves a *category* question (is this malformed data or expected state?) — locking categories, not just values, is what stops implementers from inventing error handling around normal inputs.

### 4. Clean core / explained handlers split (CLI layer)

<example_4>

```python
def main(argv: list[str] | None = None) -> int:   # argv injectable → tests call main([...]) in-process
    parser = argparse...               # global: --root <dir>, ...
    subparsers: add | remove | update-status | sync | list | search | list-eventually

    now = floor_to_minute(dt=datetime.now())   # ← the ONLY wall-clock read in the file
    calc  = TierCalculator(now=now)
    store = TodoStore(ws=resolve_workspace(args))
    try:
        return dispatch(...)          # per-handler pseudocode below; prints result via Formatter
    except UsageError as e:      print err → return 1
    except NotFoundError as e:   print err → return 1
    except StoreError as e:      print err → return 2

# handlers (composition of pieces above) -------------------------------------------
add:            due = calc.resolve_due(spec=args.due if not args.eventually else "eventually")
                item = TodoItem(id=new_id(), status=Status.TODO,
                                priority=Priority.parse(raw=args.priority), tags=split_tags(raw=args.tags),
                                text=args.text, due_date=due, created_date=now,
                                completed_date=None, last_checked=None)
                store.add(item=item); print confirmation (human) or item YAML

sync:           report = SyncEngine(now=now).analyze(items=store.load())
                if args.dry_run: render report only; return 0 (no writes)
                summary = store.apply_sync(report=report, now=now)   # stamps last_checked + completed_date + archives
                output YAML block: {overdue: [...], needs_completed_stamp: [...], archived_summary}   # agent-facing per spec §7
```

</example_4>

**Why this works**
- The core (`main`) is five lines of composition; each handler below it reads as **pure assembly of already-specified pieces** — no business logic smuggled into the CLI layer, which keeps every rule testable at its owning piece.
- Labeled arguments are visible in action everywhere (`store.add(item=item)`, `TodoItem(id=..., status=...)`), so a reader can see the convention enforced rather than merely declared.
- Error mapping lives exactly once (the try/except ladder); handlers never exit on their own. The "ONLY wall-clock read" comment marks the single injection point by name.

### 5. Traceability tables & implementation order (document tail)

<example_5>

```
| File | Piece under test | ~Cases |
|---|---|---|
| `test_tiers.py` | date helpers + TierCalculator ranges/membership/resolve (4 anchors) | ~16 |
| `test_sync.py` | SyncEngine.analyze: overdue, weekly gate, stamping | 8 |

Location: `notes/todo-skill/tests/`, run with `python3 -m pytest notes/todo-skill/tests/ -v`.
Conventions: no network, no real workspace writes (always `tmp_path` + `--root`), fixed literal datetimes as `now` — never mock time.

### Acceptance mapping to SPEC §12 checklist

| Spec acceptance item | Covered by |
|---|---|
| overdue surfaced w/ 3 options; abandon → abandoned.yaml | test_sync.overdue, test_store.move_to_abandoned (option application is agent behavior per SKILL.md) |
| eventually items only via someday view | test_cli list-eventually, test_tiers (null never in tiers_containing) |

## Implementation Order (suggested)
1. Config/Workspace/enums/errors → `test_config`, `test_enums` green.
2. TodoItem + new_id → `test_item`, `test_id`.
3. TierCalculator → `test_tiers` (the date-logic heart; do before anything that displays).
4. sort/filter + Formatter → `test_sort_filter`, `test_format`.
5. SyncEngine → `test_sync`.
6. TodoStore → `test_store`.
7. CLI main → `test_cli`; then manual smoke by invoking the script directly (`python3 notes/todo-skill/todo.py list --root <throwaway-dir>`) before ever touching real `notes/todos.yaml`. The justfile recipes (spec §8) and SKILL.md (spec §9) are written afterwards as separate deliverables.
```

</example_5>

**Why this works**
- The run command is **exact**, the conventions line pre-empts the three most common test mistakes (real workspace writes, mocked time, network).
- Acceptance mapping names *specific tests* per criterion — and where a behavior belongs to the agent rather than the script, it says so explicitly instead of pretending code covers it.
- The order is dependency-respecting with a **green-tests gate per step**, ends in smoke-testing against throwaway data before real files are touched, and names follow-up deliverables as out-of-scope later steps — so a fresh session knows exactly when "done" means done.
