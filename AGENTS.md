# AGENTS.md — How to work in the Vaylord workspace

This file tells AI agents (and humans) how issues filed in **`lqez/vaylord-workspace`**
should be triaged and resolved. `vaylord-workspace` is a **public issue-tracking
hub**; the actual code lives in other repositories. Read this before acting on any
issue.

## Repositories in scope

| Repo | Role |
|------|------|
| `lqez/vaylord-workspace` | Public hub. Issues are **filed and discussed here**. Almost no code. |
| `lqez/vaylord` | The game — *Arcana & Mesh*, a self-playing autonomous-agent MMORPG. |
| `lqez/vaylord-world-creator` | Web-based world generation + editing tool for Vaylord. |

An issue filed in `vaylord-workspace` almost always describes work that must be
**fixed in `vaylord` or `vaylord-world-creator`**, not in the workspace itself.
Decide which one from the issue's content (screenshots, terminology, file/feature
references) before writing any code.

## The golden rule: ALWAYS fully-qualify cross-repo references

A bare `#1` is **ambiguous** — the reader cannot tell which project's issue or PR
it points to, and GitHub will auto-link it to an issue **in the repo where the
text is written**, which is usually the *wrong* repo.

**Whenever you mention an issue, PR, or commit that lives in a different repo than
the one you are writing in, use the fully-qualified form** `owner/repo#number`
(GitHub renders this as a correct cross-repo link), and prefer a full URL when
maximum clarity matters.

- ✅ `lqez/vaylord-world-creator#94`
- ✅ `https://github.com/lqez/vaylord-world-creator/pull/94`
- ✅ "Fixed in `lqez/vaylord-world-creator` (PR `lqez/vaylord-world-creator#94`), branch `claude/...`."
- ❌ `#94` written in a `vaylord-workspace` comment (links to the wrong repo / is ambiguous)
- ❌ "Done in PR #94" with no repo named

This applies to **every surface**: workspace issue comments, PR titles/bodies,
commit messages, and any cross-referencing note. A bare `#N` is only acceptable
when it refers to something **in the same repo as the text itself** — and even
then, prefer fully-qualifying it in workspace comments since work usually spans
repos.

When you resolve a workspace issue with a PR in a code repo, make the link
**bidirectional and explicit**:
- In the PR body, reference the workspace issue fully-qualified, e.g.
  `Resolves lqez/vaylord-workspace#3`.
- In the workspace issue comment, name the **target repo, branch, and PR** with
  fully-qualified links (see comment template below).

## Standard workflow for a workspace issue

1. **Read** the issue thoroughly, including screenshots and linked context.
2. **Decide the target repo** (`vaylord` vs `vaylord-world-creator`) from the
   content. State your reasoning if it isn't obvious.
3. **Develop** the fix on the designated feature branch in the **target repo**.
4. **Build / verify** (e.g. `npm run build`, type-check, tests) and report the
   result honestly.
5. **Commit** with a clear message. In the message, reference the workspace issue
   fully-qualified (e.g. `(lqez/vaylord-workspace#2)`).
6. **Push** the branch and **open a PR against the target repo**. In the PR body,
   `Resolves lqez/vaylord-workspace#<n>` (fully-qualified).
7. **Comment on the workspace issue** with a Korean work-history note (see
   template) that clearly links the target repo + PR with fully-qualified links.

## Workspace issue comment template (Korean work-history note)

Work-history comments on workspace issues are written in **Korean**. Always lead
with the target repo so it's unambiguous which project the work landed in:

```
### 작업 이력 (<target-repo>)

**대상 프로젝트:** `lqez/<target-repo>` · **브랜치:** `<branch>` · **PR:** lqez/<target-repo>#<pr>

- <변경 요약 — 무엇을 왜 어떻게>

**검증:** <build/test 결과>
```

Note that even inside the Korean note, every issue/PR reference is
fully-qualified (`lqez/<target-repo>#<n>`), never a bare `#<n>`.

## Verify with screenshots (E2E) and show your work

Many issues — especially in `vaylord-world-creator` — are **visual**. Numbers and
"it builds" are not enough to prove a fix. Whenever a change affects what the user
sees:

- **Capture end-to-end screenshots**: run the app, reproduce the relevant
  scenario, and take a screenshot of the actual rendered result (an E2E /
  headless-browser capture, not just a unit test). Where it helps, capture
  **before vs. after** so the difference is obvious.
- **Verify against the issue**: look at the screenshot and confirm it actually
  resolves what the issue describes (e.g. the coast slopes into the sea; the road
  melts into the terrain). If it doesn't, iterate before claiming it's done.
- **Post the screenshots on the workspace issue**: attach them generously to the
  Korean work-history comment so the human can confirm the result visually without
  pulling the branch. More images is better than fewer — show the key states,
  multiple seeds/cases where relevant, and any before/after pairs.

Treat "screenshot captured, checked, and posted to the issue" as part of the
definition of done for any visual change.

## Reporting & etiquette

- Be frugal with GitHub comments — post when there is genuinely something useful
  to record (a resolution, a question, a blocker), not routine chatter.
- Do **not** open a PR unless resolving an issue calls for one (this workflow
  does). Do not create PRs speculatively.
- If an issue is ambiguous in a way that changes what you build, ask the human
  (in the working session) before committing to an interpretation — unless the
  human has told you to proceed autonomously, in which case make the most
  reasonable choice, implement it, and document the decision in the PR.
