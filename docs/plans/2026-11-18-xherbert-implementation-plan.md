# XHerbert Web Application Implementation Plan

> **For Agent:** Follow strict Specification-Driven and Test-Driven Development (TDD) workflow task-by-task. Every module must have failing tests written first, implementation second, and pass all unit, integration, mutation, and E2E quality gates.

**Goal:** Build **XHerbert** (`xherbert.maxithome.com`), a zero-backend, responsive (Desktop/Tablet/Mobile), Light/Dark-themed web application in React + Vite + TypeScript that faithfully implements the classic Herbert algorithmic game, the H programming language, flexible odd-dimension $W \times H$ grids ($25 \le W, H \le 75$), visual recursion debugging, an interactive 5-stage tutorial, and a custom level editor with batch `.txt` import/export.

**Architecture:** Clean layered architecture decoupling pure TypeScript domain modules (`src/core/{lexer,parser,interpreter,levelCodec,gridEngine}`) from browser persistence (`src/storage/localRepository`) and responsive React UI components (`src/ui/{play,learn,create,common}`). Every core module supports standalone CLI invocation via `uv run` (wrapping Node/TSX) with full parameter descriptions, and every UI feature supports standalone manual verification via an isolated harness view.

**Tech Stack:** React 19, Vite 6, TypeScript 5 (Strict Mode, zero `any`), Tailwind CSS, Lucide React, Vitest + React Testing Library (Unit & Integration Tests, $\ge 90\%$ coverage), StrykerJS (Mutation Testing, $\ge 85\%$ score), Playwright (Multi-viewport Browser E2E Tests), ESLint (complexity $< 10$, max lines per function $< 30$).

---

## Phase 1: Project Scaffolding, Quality Gates & Python `uv` CLI Bridge

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `stryker.config.mjs`, `playwright.config.ts`, `eslint.config.js`, `pyproject.toml`
- Replace: `index.html` (Vite React entry point), `.github/workflows/static.yml` (Cloudflare Pages / static build workflow)
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`

**Verification Gate 1:**
- `npm run lint` passes with 0 warnings (enforcing `complexity: ["error", 9]` and `max-lines-per-function: ["error", { max: 30, skipBlankLines: true, skipComments: true }]`).
- `npm run typecheck` passes with 0 errors.
- `uv run python -m unittest` / `uv run herbert-cli --help` invokes the standalone module CLI runner cleanly.

---

## Phase 2: Core Module 1 - `src/core/lexer` (H Language Tokenizer & Official Byte Counter)

**Contract:**
- **Input:** Raw H source string (`string`).
- **Output:** `LexResult` containing:
  - `tokens: Token[]` (type, value, byteCost: `0 | 1`, line, col, startOffset, endOffset)
  - `byteCount: number` (sum of `1 Byte` tokens: `s/l/r`, `a-z`, `A-Z`, and contiguous integer literals `0-9+`; punctuation `: ( ) , + -` and whitespace cost `0 Bytes`)
  - `diagnostics: CompileDiagnostic[]` (for any illegal characters outside the H alphabet)

**Files:**
- Test: `tests/unit/lexer.test.ts`
- Create: `src/core/types.ts`
- Create: `src/core/lexer.ts`
- Create: `src/cli/lexerCli.ts` (Standalone CLI: `uv run npx tsx src/cli/lexerCli.ts --code "a(X):sa(X-1)\na(15)"`)

**TDD Steps:**
1. Write failing unit tests in `tests/unit/lexer.test.ts` covering:
   - Single commands `s`, `l`, `r` (1 byte each)
   - Procedure defs & calls `a(X):sa(X-1)\na(15)` (verifying `15` costs 1 byte total, `: ( ) -` cost 0 bytes, total = 8 bytes)
   - Multi-parameter & negative/positive arithmetic `b(X,Y):a(X+100,Y-255)`
   - Whitespace, tabs, CRLF/LF newlines (0 bytes)
   - Illegal characters (e.g., `@`, `;`, `*`, `$`) producing exact line/col diagnostics
2. Run `npx vitest run tests/unit/lexer.test.ts` -> confirm RED.
3. Implement `src/core/lexer.ts` with pure functions under 30 lines and complexity $< 10$.
4. Run unit tests + CLI verification -> confirm GREEN.

---

## Phase 3: Core Module 2 - `src/core/parser` (AST Builder & Static Semantic Validator)

**Contract:**
- **Input:** `LexResult` or raw H source string.
- **Output:** `ParseResult` containing immutable `ProgramAST` (`procedures: Record<string, ProcedureDef>`, `main: StatementNode[]`) and `errors: CompileDiagnostic[]`.
- **Static Checks Enforced:**
  1. Reserved primitive names (`s`, `l`, `r`) cannot be defined as procedures.
  2. Duplicate procedure definitions (`a:s` and `a:l`) are rejected.
  3. Duplicate parameter names in a procedure signature (`a(X,X):s`) are rejected.
  4. Undeclared parameter references (`a(X):sY`) are rejected.
  5. Procedure call arity mismatch (`a(X,Y):s` called with `a(1)` or `a`, or `a:s` called with `a(1)`) is rejected.
  6. Empty program (no main execution statement) or statements appearing after the main execution line are rejected.
  7. Type mismatch: passing a command sequence to a parameter used inside an arithmetic expression (or using a numeric expression as a statement body).

**Files:**
- Test: `tests/unit/parser.test.ts`
- Create: `src/core/parser.ts`
- Create: `src/cli/parserCli.ts` (Standalone CLI: `uv run npx tsx src/cli/parserCli.ts --code "..."`)

**TDD Steps:**
1. Write failing tests in `tests/unit/parser.test.ts` for valid AST generation and all 7 static validation error cases.
2. Run `npx vitest run tests/unit/parser.test.ts` -> confirm RED.
3. Implement `src/core/parser.ts`.
4. Run unit tests + CLI verification -> confirm GREEN.

---

## Phase 4: Core Module 3 - `src/core/interpreter` (Execution Engine, Lexical Closures & Call Stack)

**Contract:**
- **Input:** `ProgramAST` and `InterpreterOptions` (`maxSteps: 10000`, `maxStackDepth: 256`, `minInt: -255`, `maxInt: 255`).
- **Output:** Step-by-step generator / trace yielding `InterpreterEvent`:
  - Emitted primitive command (`'s' | 'l' | 'r'`)
  - Source token span of the active command
  - Active `CallStackFrame[]` (procedure name, bound parameter map `Record<string, BoundValue>` where `BoundValue` is either `{ kind: 'num', value: number }` or `{ kind: 'seq', label: string, nodes: BoundStatement[] }`)
  - `skippedCalls: SkippedCallEvent[]` (recording when a call like `a(0)` or `f(2, -1)` was skipped due to the Non-Positive Termination Rule $\le 0$)
- **Core Semantics:**
  - **Call-by-Value Numeric Evaluation**: Evaluates arithmetic expressions in the caller's environment before entering the callee; raises `RuntimeDiagnostic` if value $< -255$ or $> +255$.
  - **Any-Non-Positive Termination Rule**: If a procedure call has $\ge 1$ numeric argument and **any** numeric argument evaluates to $\le 0$, the entire call is skipped immediately.
  - **Lexical Binding for Command Sequences**: When passing a command sequence argument (e.g., `a(Xs)` or `f(b(X-1)r)`), binds free parameter references to the caller's environment so recursive macro growth (`a(X):Xra(Xs)` called with `a(s)`) expands accurately without variable capture bugs.

**Files:**
- Test: `tests/unit/interpreter.test.ts`
- Create: `src/core/interpreter.ts`
- Create: `src/cli/interpreterCli.ts` (Standalone CLI: `uv run npx tsx src/cli/interpreterCli.ts --code "..." --max-steps 100`)

**TDD Steps:**
1. Write failing unit tests in `tests/unit/interpreter.test.ts` covering:
   - Basic sequence `sslr`
   - Endless tail recursion `a:sra\na` up to step limit
   - Numeric countdown `a(X):sa(X-1)\na(4)` -> `ssss` + recorded skip `a(0)`
   - Multi-parameter termination `f(A,B):sf(A-1,B-2)\nf(5,3)` stopping when either reaches $\le 0$
   - Higher-order command doubler `a(X):XX\na(a(a(s)))` -> 8 steps
   - Dynamic sequence growth spiral `a(X):Xra(Xs)\na(s)` -> `s r ss r sss r ...`
   - Alternating polymorphic parameters `a(X,Y):Xa(Y,X)\na(sl,sr)`
   - Integer overflow ($> 255$ or $< -255$) and stack overflow error reporting
2. Run `npx vitest run tests/unit/interpreter.test.ts` -> confirm RED.
3. Implement `src/core/interpreter.ts`.
4. Run unit tests + CLI verification -> confirm GREEN.

---

## Phase 5: Core Module 4 - `src/core/levelCodec` & `src/core/gridEngine` ($W \times H$ Odd Grids, Physics & Scoring)

**Contract:**
- **`levelCodec`:**
  - Parses and serializes single and batch `.txt` level files.
  - Enforces dimension constraints:
    - Width $W \in [25, 75]$ and $W \bmod 2 === 1$
    - Height $H \in [25, 75]$ and $H \bmod 2 === 1$
    - Supports both square ($W = H$, default $25 \times 25$) and rectangular ($W \neq H$, e.g., $35 \times 25$ or $25 \times 51$) maps.
    - Every row must have length $W$; valid chars `.`, `*`, `w`, `g`, `u`, `r`, `d`, `l`; exactly 1 start char; $\ge 1$ white button `w`.
- **`gridEngine`:**
  - Manages robot state `(row, col, dir)` and button states on any $W \times H$ grid.
  - `s`: moves 1 cell forward if inside bounds and not `*`; otherwise stays in place (`bumped = true`).
  - `w`: marks white button at `(row, col)` as lit; if `litCount === totalWhiteButtons`, sets `status = 'SOLVED'` immediately.
  - `g`: if `litCount > 0`, resets all lit white buttons to unlit (`grayResetTriggered = true`).
  - Time-travel simulation controller supporting `stepForward()`, `stepBackward()`, `runToCompletion()`, `reset()`, and `calculateScore(byteCount, maxBytes, basePoints, litCount, totalWhite)`.

**Files:**
- Test: `tests/unit/levelCodec.test.ts`, `tests/unit/gridEngine.test.ts`, `tests/integration/gameSimulation.test.ts`
- Create: `src/core/levelCodec.ts`, `src/core/gridEngine.ts`
- Create: `src/cli/simulateCli.ts` (Standalone CLI: `uv run npx tsx src/cli/simulateCli.ts --level path/to/level.txt --code "a:sa\na"`)

**TDD Steps:**
1. Write failing unit and integration tests for `levelCodec` (25x25 default, 35x25 and 25x51 rectangular odd grids, 75x75 max grid, rejection of 24x24 even grid, 23x23 too small, 77x25 too large, missing start, zero `w`) and `gridEngine` (movement, wall alignment bump, white button collection, gray button reset, immediate win mid-loop, step backward restoration, score calculation).
2. Run Vitest -> confirm RED.
3. Implement `src/core/levelCodec.ts` and `src/core/gridEngine.ts`.
4. Run unit/integration tests + CLI verification -> confirm GREEN.

---

## Phase 6: Content Library & Client Persistence (`src/content/*` & `src/storage/*`)

**Contract:**
- **`src/content/campaignLevels.ts`**: 12+ curated levels across 4 chapters (all unlocked by default), including classic Imagine Cup puzzles (*Hello World*, *Corners*, *Diamond*, *Snake*, *Windmill*, *Stairway*, plus dedicated numeric recursion, higher-order macro, and rectangular odd-grid challenges). Every built-in level includes a verified reference solution tested in CI.
- **`src/content/tutorialLessons.ts`**: 5 interactive guided lessons + structured H Language Reference data.
- **`src/storage/localRepository.ts`**: Type-safe `localStorage` persistence for theme (`light` | `dark`), level progress (draft code, best solved code, best bytes, high score), tutorial progress, and custom levels.

**Files:**
- Test: `tests/unit/localRepository.test.ts`, `tests/integration/campaignSolutions.test.ts`
- Create: `src/content/campaignLevels.ts`, `src/content/tutorialLessons.ts`, `src/storage/localRepository.ts`

**TDD Steps:**
1. Write failing tests verifying that every built-in campaign level and tutorial lesson passes `levelCodec` validation and is solved within `max_bytes` by its reference H solution, and testing `localRepository` CRUD operations.
2. Run Vitest -> confirm RED.
3. Implement content and storage modules.
4. Run Vitest -> confirm GREEN.

---

## Phase 7: Responsive React UI (`Play`, `Learn`, `Create` & Isolated Harness)

**Files:**
- Test: `tests/integration/ui/PlayWorkspace.test.tsx`, `tests/integration/ui/LearnTutorial.test.tsx`, `tests/integration/ui/LevelEditor.test.tsx`
- Create:
  - `src/ui/common/HeaderNav.tsx` (Brand, Mode Tabs: Play / Learn / Create, Theme Toggle, Reference Drawer Trigger)
  - `src/ui/common/GridCanvas.tsx` (Responsive $W \times H$ canvas with Zoom/Pan, Fit-to-View, Follow-Herbert camera, coordinate rulers, wall bump & gray reset animations)
  - `src/ui/play/CodeEditorPanel.tsx` (Token cost highlighter, disabled autocapitalize/spellcheck, Mobile Quick-Symbol Bar `s l r : ( ) , - + a<->A`, Live Byte Quota HUD)
  - `src/ui/play/DebuggerPanel.tsx` (Transport controls: Play/Pause/Step Forward/Step Back/Instant Run/Reset/Speed + Live Call Stack & Parameter Inspector)
  - `src/ui/play/LevelSelectorModal.tsx` (4 chapters + Custom Levels tab, all unlocked, badges for Solved / Best Bytes / Score)
  - `src/ui/learn/TutorialWorkspace.tsx` (5-stage interactive onboarding walkthrough)
  - `src/ui/learn/ReferenceDrawer.tsx` (Slide-out H Language Cheat Sheet)
  - `src/ui/create/LevelEditorWorkspace.tsx` (Odd $W, H \in [25, 75]$ selectors, drawing tools, symmetry modes, live validator, "Test & Calibrate" in simulator, Batch `.txt` Upload & Export)
  - `src/ui/harness/ComponentHarness.tsx` (Isolated manual test UI accessible via `?harness=grid|editor|debugger|creator`)

**TDD Steps:**
1. Write failing React Testing Library integration tests for Play, Learn, and Create workflows.
2. Run Vitest -> confirm RED.
3. Implement UI components adhering to $< 30$ lines per helper/render function and complexity $< 10$.
4. Run Vitest -> confirm GREEN.

---

## Phase 8: E2E Browser Simulation, Mutation Testing & Final Quality Gauntlet

**Files:**
- Create: `tests/e2e/xherbert.spec.ts`
- Modify: `README.md` (Add project architecture, build, dependency setup with `uv`, testing, deployment, and CLI/UI usage sections while preserving the authoritative Herbert & H specification)

**Verification Steps:**
1. **Playwright Automated E2E Tests (`npx playwright test`)** across Desktop ($1440 \times 900$), Tablet ($768 \times 1024$), and Mobile ($390 \times 844$):
   - Load app, toggle Light/Dark theme, verify responsive layout.
   - Enter H code via keyboard and Mobile Quick-Symbol Bar, verify live byte counter (`1 Byte` vs `0 Byte` tokens), step forward, step backward, inspect live call stack, and solve a level.
   - Complete an interactive tutorial lesson in `Learn` mode and open the Reference drawer.
   - Open `Create` mode, resize grid to a non-square odd dimension (e.g., $35 \times 25$), paint walls/white buttons/gray buttons/start, test-play in simulator, batch-upload multiple `.txt` level files (valid + invalid error reporting), and export `.txt` levels.
2. **Live Browser Subagent Visual & Interactive Verification**:
   - Start local server and inspect the live application in the browser across viewports for pixel-perfection.
3. **Full Quality Gauntlet**:
   - `npm run lint` & `npm run typecheck` -> 0 warnings, 0 errors.
   - `npm run test:coverage` -> $\ge 90\%$ unit test coverage.
   - `npx stryker run` -> $\ge 85\%$ mutation test score.
