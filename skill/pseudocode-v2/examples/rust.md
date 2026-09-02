# Rust Reference (pseudocode-v2)

Per-language companion to `explanation.md`. The abstract drafting rules live in that document (§2–§6); below is how each translates into **Rust**. There are no full annotated real-document excerpts for this language yet — calibrate structure and depth against the excerpts in `python.md` (the patterns there are language-agnostic).

## Idiom Translations

- **Model shape (near-compilable skeleton):** `#[derive(Debug, Clone, PartialEq)] struct`; `Option<T>` for optionals with the *domain* meaning in a doc comment — Rust's `None` still needs its semantics stated.
  ```rust
  #[derive(Debug, Clone, PartialEq)]
  struct TodoItem { id: String, due_date: Option<DateTime> /* None == "eventually" */ }
  ```
- **Typed signatures everywhere:** full type annotations on every function; no `dyn` or untyped closures in the plan; generics stated explicitly.
- **Labeled arguments at call sites:** struct literals with field names (`TodoItem { id, text, ..Default::default() }`) or a builder once fields exceed ~3; functions beyond 2–3 positional args take a parameter struct instead — long positional chains are a review finding.
- **Named errors → exit codes:** `Result<T, AppError>` with an `AppError` enum bubbled via `?` to `fn main`, which maps variants to `std::process::exit` codes exactly once; library functions never call `std::process::exit`.
  ```rust
  fn main() { let code = match run() { Ok(()) => 0, Err(AppError::NotFound) => 1, _ => 2 }; std::process::exit(code); }
  ```
- **No magic constants:** associated consts on a `Config` struct plus a dedicated enum module; each constant documented by why it exists. Raw literals elsewhere are a finding.
