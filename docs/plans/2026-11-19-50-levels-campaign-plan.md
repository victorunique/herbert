# XHerbert 50-Level (10 Chapters x 5 Challenges) Campaign Expansion Plan

> **Status**: Proposed Plan - Awaiting User Approval before implementation.

**Goal:** Expand XHerbert's built-in campaign from 9 levels (4 chapters) to **50 curated, mathematically verified levels organized into 10 Chapters (5 challenges per chapter)**, upgrading the Level Selector UI for smooth 50-level browsing and preparing the data/logic foundation for a future chapter-by-chapter unlock progression system.

**Tech Stack & Constraints:** React 19 + TypeScript (Strict) + Tailwind CSS + Vitest + StrykerJS + Playwright. Every level must satisfy `[25, 40]` integer grid dimensions, pass `levelCodec` validation, and be proven solvable within `maxBytes` by an automated reference H-language solution in CI.

---

## 1. 10-Chapter Curriculum Design (50 Challenges)

| Chapter | Title & Theme | Difficulty | Base Points | 5 Challenges |
| :---: | :--- | :--- | :---: | :--- |
| **Ch 1** | **First Steps & Endless Loops** | Beginner | 100 - 150 | `1-1 Hello Herbert`, `1-2 Right-Angle Relay`, `1-3 Perimeter Patrol`, `1-4 Four Corners` (Classic), `1-5 Twin Squares` |
| **Ch 2** | **Walls & Precision Alignment** | Beginner+ | 150 - 200 | `2-1 Dead-End Bounce`, `2-2 Wall Alignment Vault`, `2-3 Pinball Corridor`, `2-4 Boxed In`, `2-5 The Narrow Gauntlet (30x25)` |
| **Ch 3** | **Numeric Countdown & Arithmetic** | Elementary | 200 - 250 | `3-1 Precision Countdown`, `3-2 Stepping Stones`, `3-3 Shrinking Box`, `3-4 Arithmetic Spiral`, `3-5 Double-Step Ladder` |
| **Ch 4** | **Multi-Parameter Control & Base Cases** | Intermediate | 250 - 300 | `4-1 Twin Counters`, `4-2 Rectangular Sweep (32x25)`, `4-3 The Comb`, `4-4 Grand Boulevard (35x25)`, `4-5 Converging Frame` |
| **Ch 5** | **Higher-Order Macros (Code as Data)** | Intermediate+ | 300 - 350 | `5-1 Power of Two`, `5-2 9-Byte Macro Spiral`, `5-3 Polymorphic Staircase`, `5-4 Mirror Wings`, `5-5 Macro Sawtooth (36x25)` |
| **Ch 6** | **Gray Button Mastery & Strategic Resets** | Intermediate+ | 350 - 400 | `6-1 The Gray Sacrifice`, `6-2 Minefield Slalom`, `6-3 Reset Bridge`, `6-4 False Dawn`, `6-5 Twin Sacrifices` |
| **Ch 7** | **Imagine Cup Classics & Symmetries** | Advanced | 400 - 450 | `7-1 Classic Diamond`, `7-2 Classic Windmill`, `7-3 Classic Snake`, `7-4 Classic Stairway`, `7-5 Pinwheel Courtyard` |
| **Ch 8** | **Space-Filling Curves & Fractals (HOJ)** | Advanced+ | 450 - 550 | `8-1 Hilbert Order 2`, `8-2 Dragon Fold`, `8-3 Binary Tree Canopy`, `8-4 Sierpinski Steps`, `8-5 Koch Cross` |
| **Ch 9** | **Wide & Tall Arenas (26 to 40)** | Expert | 500 - 600 | `9-1 The Long Horizon (40x25)`, `9-2 Skyscraper Shaft (25x40)`, `9-3 Checkerboard Plaza (32x32)`, `9-4 Twin Towers (38x30)`, `9-5 Grand Colosseum (40x40)` |
| **Ch 10** | **Code Golf Grandmaster Gauntlet** | Grandmaster | 600 - 800 | `10-1 7-Byte Spiral Storm`, `10-2 Blind Wall Bounce`, `10-3 Gray Labyrinth`, `10-4 Recursive Crossfire (34x34)`, `10-5 Herbert's Final Exam (40x40)` |

---

## 2. Modular Architecture & File Plan

### Phase 1: Progression Module & Level Builder Utilities (TDD)
- **Create**: `src/core/progression.ts`
  - Pure functions with explicit types:
    - `getChapterCompletion(chapterNumber, levels, progressMap)` -> `{ solvedCount, totalCount, isComplete }`
    - `isChapterUnlocked(chapterNumber, levels, progressMap, requireSequentialUnlock: boolean)` -> `boolean`
    - Default mode in App: `requireSequentialUnlock = false` (all 10 chapters unlocked by default), ready to flip to `true` or expose a user setting later with zero architectural refactor.
- **Create**: `src/content/levelBuilder.ts`
  - Shared `GridBuilderSpec` and `buildCampaignLevel(spec)` plus small pure grid drawing helpers (`drawLine`, `drawRect`, `placeSymmetric4`) so every chapter file remains compact, readable, and strictly $\le 30$ lines per function.
- **Test**: `tests/unit/progression.test.ts` (write failing tests first -> implement -> verify green).

### Phase 2: 10 Modular Chapter Files (50 Verified Levels)
- **Create**:
  - `src/content/chapters/chapter01.ts` through `src/content/chapters/chapter10.ts` (5 levels per file, each with authentic H-language `referenceSolution`, calibrated `maxBytes`, `basePoints`, clear English `description` and `hint`).
- **Modify**: `src/content/campaignLevels.ts`
  - Export `CAMPAIGN_CHAPTERS` (10 chapters with `difficulty` badge metadata) and `CAMPAIGN_LEVELS` (50 levels aggregated from `chapter01`..`chapter10`).
- **Test**: Update `tests/integration/campaignSolutions.test.ts`:
  - Verify `CAMPAIGN_CHAPTERS` has 10 chapters and `CAMPAIGN_LEVELS` has 50 unique-ID levels (5 per chapter).
  - Execute every single level's `referenceSolution` through `createSimulationSession` and assert:
    - `0` compile errors & `null` runtime error
    - `finalSnap.solved === true`
    - `score.byteCount <= level.maxBytes`
    - `score.totalScore >= level.basePoints`

### Phase 3: Level Selector Modal UX Upgrade
- **Modify**: `src/ui/play/LevelSelectorModal.tsx`
  - Add **Campaign Progress Summary Bar** (`Solved X / 50` + total earned score).
  - Add **Chapter Filter Pills** (`All`, `Ch 1` .. `Ch 10`, `Custom`) for instant 1-click navigation on Desktop, Tablet, and Mobile.
  - Add **Per-Chapter Progress Badge** (`X / 5 Solved` + difficulty pill) on every chapter header, laying the visual groundwork for future chapter-unlock gating.
- **Test**: Update `tests/integration/ui/XHerbertApp.test.tsx` and `tests/e2e/xherbert.spec.ts` to test chapter filtering, `X / 50` progress counter, and selecting levels across chapters (e.g., Chapter 7 Classics and Chapter 9 40x40 arenas).

### Phase 4: Documentation & Full Quality Gauntlet
- **Modify**: `README.md` and `PRD.md` to reflect the 10-chapter, 50-level campaign library.
- **Verify**:
  - `npm run lint` (0 warnings, $\le 30$ lines/fn, complexity $< 10$)
  - `npm run typecheck` (0 errors)
  - `npm run test:coverage` ($\ge 90\%$)
  - `npx stryker run` ($\ge 85\%$ mutation score on `src/core/`, including new `progression.ts`)
  - `npm run build`
  - `npx playwright test` (all 9+ E2E tests across Desktop, Tablet, Mobile)
