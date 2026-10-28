# Model usage

Every SDD phase runs in a sub-agent, and every Agent call sets `model` explicitly (sub-agents may default to a
different model on each machine).

| Work | SDD phases | Model |
|---|---|---|
| Planning and thinking | `sdd-explore`, `sdd-propose`, `sdd-spec`, `sdd-design`, `sdd-tasks` | Fable if available, otherwise Opus |
| Writing code | `sdd-apply` | Opus |
| Tests and verification | `sdd-verify`, and any test run | Sonnet — never Opus or Fable |

# Agents

The main session coordinates and delegates the work to one or more agents; it does not do phase work itself.

- **Sub-agents:** one per SDD phase, or several in parallel when tasks are independent (different files, no
  shared state). Work on the same files stays sequential.
- **Agent team:** for larger changes, run an agent team when `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set
  (see `.claude/settings.local.json`).
- **Limits** come from `.claude/settings.local.json`: at most `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` agents at
  once and `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` levels of nesting.
- Every agent gets its model from the table above and follows Strict TDD below.

# Strict TDD

Strict TDD is mandatory for all code. `sdd-apply` follows `.claude/skills/sdd-apply/strict-tdd.md` and
`sdd-verify` follows `.claude/skills/sdd-verify/strict-tdd-verify.md`; never fall back to standard mode.

1. **Red:** write the test first and run it; it must fail for the expected reason.
2. **Green:** write the minimum code that makes it pass.
3. **Refactor:** clean up with all tests green.

No production code without a failing test that requires it.

# Custom instructions

1. Before writing or running any test, say so and wait for confirmation to switch to Sonnet — never use Fable or Opus for tests.
2. Do not write any new code without the express permission of the user.
3. Do not write any test unless new code has been written.
4. Do not fix isolated edge cases or write code tailored to specific instances. Always provide a generalized, scalable solution that solves the root problem for all cases. Focus on abstract patterns and architectural principles rather than case-by-case debugging.
5. ALWAYS write all source code, variable names, tables, fields, documentation, and commit messages strictly in English. Comments must be in Spanish.
