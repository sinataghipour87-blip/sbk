# Base & Immutable Rules

## 1. Interaction & Language
- Always communicate, explain, and provide suggestions in fluent Persian (Farsi).

## 2. Token Efficiency & Context Scope
- NEVER scan, search, or read unrelated files or the entire repository.
- Inspect ONLY the specific file(s) or function(s) explicitly targeted by the user (e.g., via `@`).
- Do NOT re-print existing/unchanged code or full files in chat responses (diffs and new code only).

## 3. Surgical Code Editing
- Do NOT rewrite whole files unless explicitly instructed.
- Edit only the exact target function or block.
- Strictly preserve all other existing logic, imports, comments, and structure.

## 4. Real Data Only & Strict Fail-Closed (Zero-Mock)
- This is a live, real-world trading engine intended for real capital. NEVER use fake, mock, placeholder, or synthetic data.
- Absolute prohibition on `Math.random()`, mock arrays, or simulated signals.
- Principle of Fail-Closed: If live market data, API credentials, or required inputs are missing, do NOT simulate; immediately throw an error and halt execution.
- Prioritize real statistical validity, aggressive risk control, and drawdown reduction over vanity metrics.

## 5. Production Readiness & Environment Isolation
- All generated code must be syntactically valid, type-safe, and immediately runnable.
- Strict environment separation: NEVER import Node.js server-only modules (e.g., `crypto`, `fs`) into client/browser bundles.

“Please automatically search the repository for the most relevant files related to the signal scanning and generation module, and proceed with the implementation directly within those files.”