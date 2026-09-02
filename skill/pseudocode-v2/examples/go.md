# Go Reference (pseudocode-v2)

Per-language companion to `explanation.md`. The abstract drafting rules live in that document (§2–§6); below is how each translates into **Go**. There are no full annotated real-document excerpts for this language yet — calibrate structure and depth against the excerpts in `python.md` (the patterns there are language-agnostic).

## Idiom Translations

- **Model shape (near-compilable skeleton):** `struct` for record types; methods on pointer receivers where they mutate (`func (s *TodoStore) Save(items []Item)`). Every field typed and exported as the plan intends; comments state the semantics of optional fields — Go has no null, so use pointers or a sentinel type and say which.
  ```go
  type TodoItem struct {
      ID         string
      Due        *time.Time // nil == "eventually"
  }
  ```
- **Typed signatures everywhere:** explicit argument types and return values on every function; no `_` for results the plan needs to document.
- **Labeled arguments at call sites:** named fields in composite literals — `TodoItem{ID: id, Text: text}`; bare positional construction of multi-field structs is a review finding.
- **Named errors → exit codes:** sentinel errors or an error enum returned up through the call chain (`var ErrNotFound = errors.New(...)`), mapped to process exit codes exactly once in `func main`; inner functions never call `os.Exit` themselves.
  ```go
  func main() {
      if err := run(); err != nil {
          log.Fatal(err) // or map AppError → os.Exit(code) here, once
      }
  }
  ```
- **No magic constants:** package-level consts grouped in a single config block/file, with each const commented by why it exists; string enums are typed consts (`type Status string` + named values). A grep for raw literals elsewhere should return nothing.
