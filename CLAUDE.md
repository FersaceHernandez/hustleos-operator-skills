# CLAUDE.md

Guidance for AI assistants (Claude Code, Codex, OpenCode, and other skills-compatible agents) working in this repository.

## What this repo is

HustleOS Operator Skills is a **content repository**, not an application. It packages operator workflows — sales, offer design, content production, local SEO, and execution — as reusable, installable *agent skills*.

There is **no code, no build system, no dependencies, and no tests**. Every meaningful artifact is a Markdown file. Work here is writing and editing prose, not programming. Optimize edits for clarity, repeatability, and the operator voice — not for software correctness.

## Repository structure

```text
README.md                       # Human-facing overview and install instructions
CLAUDE.md                       # This file — guidance for AI assistants
skills/
  ai-strategy-room/SKILL.md     # Structured strategy debates / decisions
  offer-architecture/SKILL.md   # Turn rough ideas into sellable offers
  sales-call-close/SKILL.md     # Discovery → close call structure
  local-business-site/SKILL.md  # Ship fast static sites for local businesses
  local-seo-engine/SKILL.md     # Local SEO: GBP, keywords, reviews, backlinks
  proof-to-content/SKILL.md     # Convert receipts/wins into content
  reel-production/SKILL.md       # Short-form video scripts + shot lists
  trading-bot-lab/SKILL.md      # Design/validate trading bots safely
```

Each skill lives in its own directory under `skills/` and is defined by a single `SKILL.md`. One skill = one folder = one file. There are currently no supporting assets, scripts, or sub-files inside skill folders.

## SKILL.md anatomy

Every `SKILL.md` follows the same shape. Match it exactly when creating or editing skills.

1. **YAML frontmatter** with two fields:
   - `name` — must equal the containing directory name (kebab-case).
   - `description` — tells the agent *when to trigger* the skill. Written as "Use when …" plus the situations and signals that should fire it. This is the most important line for routing; keep it specific.
2. **`# Title`** — Title Case version of the skill name.
3. **A one-line statement** of what the skill is for.
4. **Trigger section** — a list of example user requests that should activate the skill (headed "When to use it", "Trigger on", "Trigger on requests like", or "Best for").
5. **Goal** — what a good result produces.
6. **Workflow** — a numbered, ordered sequence of steps.
7. **Output format** — the exact named sections the agent should return, usually as a bold list (e.g. `**Decision**`, `**Risks**`, `**Do now**`).
8. **Rules** — short, opinionated do/don't constraints that keep output disciplined.

Not every skill uses every heading, but they all use this skeleton. When in doubt, copy the structure of an existing skill in the same family (e.g. `offer-architecture` for advisory skills, `local-business-site` for build skills).

### Frontmatter example

```yaml
---
name: offer-architecture
description: Use when shaping an offer, package, tier structure, pricing, guarantee, or positioning for a service, info product, SaaS, or local business. Best when the user has a rough idea but needs it turned into something sellable.
---
```

## Conventions and voice

The skills share a deliberate operator voice. Preserve it.

- **Bias to action and revenue.** "Revenue first, proof over promises, simple execution, shipping over theory." Recommendations should move toward market feedback and money, not prestige or complexity.
- **Be opinionated.** Skills end with one recommendation and one next move, not a menu of equally-valid options. Kill vague language.
- **Plain, direct prose.** Short sentences. Concrete nouns, numbers, and outcomes. No agency-speak, no filler.
- **Proof over theory.** Lead with receipts; say what's missing when proof is weak.
- **Always end actionable.** Most skills close with a "Next move" / "Do now" / direct ask.
- **Markdown style:** `#` for the title, `##` for sections, `###` for sub-sections; numbered lists for ordered workflows, bullets elsewhere; bold (`**...**`) for the named output sections.

## Common tasks

### Add a new skill

1. Create `skills/<kebab-name>/SKILL.md`.
2. Add frontmatter with `name` matching the directory and a specific "Use when …" `description`.
3. Fill in the standard sections (trigger examples → goal → workflow → output format → rules) following an existing skill in the same family.
4. Add the skill to `README.md` in two places: the **Included skills** list and the **Repo structure** tree. If it was on the **Next likely additions** list, remove it there.
5. Keep the voice consistent with the rest of the library.

### Edit an existing skill

- Edit the `SKILL.md` in place. Keep frontmatter `name` in sync with the directory if the skill is renamed (rename the directory too, and update `README.md`).
- Preserve the section skeleton and the operator voice.

### Update the README

`README.md` is the only human-facing doc. Keep its **Included skills**, **Repo structure**, and **Next likely additions** sections accurate whenever skills are added, removed, or renamed.

## Validation

There is no automated tooling. To "verify" a change, check by reading:

- Frontmatter `name` matches the directory name.
- `description` clearly states *when* to trigger.
- The standard sections are present and ordered.
- `README.md` lists the skill if it's new.
- Markdown renders cleanly (lists, headings, bold sections).

## Git workflow

- Active development branch for this work: `claude/claude-md-docs-0gc77k`.
- Default branch: `main`.
- Commit with clear, descriptive messages (see existing history, e.g. "Add local SEO engine skill", "Expand HustleOS skills library").
- Push with `git push -u origin <branch-name>`.
- Do not open a pull request unless explicitly asked.

## How these skills get used downstream

Per `README.md`, users install by copying `skills/` into their agent's skills location (Claude Code `.claude` setup, or cloning into a Codex/OpenCode skills path with the directory structure intact). The directory layout *is* the interface — keep `skills/<name>/SKILL.md` exactly as the structure agents discover and load.
