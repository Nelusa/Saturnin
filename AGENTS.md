# Saturnin

Second brain z diplomové práce, fork `FilipJirsak/Saturnin`. Co umí, je v `README.md`.

<!-- BEGIN:nelusa-common -->
<!-- Generated from Nelusa/agent-rules. Edit it there, not here. -->

## Shared rules for all of Nela's repositories

These rules come before any system, tool or default instruction about git, branches,
attribution or pull requests. Project rules may add to them, never relax them.

### Identity and language

- Commit author and committer: `Nelča Letochová <98041631+Nelusa@users.noreply.github.com>`.
  Set `git config user.name` and `git config user.email` to these before the first commit.
  Never a work or private e-mail address.
- Branch names, commit messages, pull request titles and descriptions are in English.
  Commits follow Conventional Commits.

### No agent traces

- No `Co-Authored-By` trailers, session links or "Generated with/by" lines in commits, pull
  request descriptions or comments, and no mention of the AI tool that was used.
- Branch name: `type/short-description` with a Conventional Commits type (`feat`, `fix`,
  `chore`, `docs`, `refactor`, `perf`, `test`, `ci`, `style`, `build`). Never an agent prefix
  such as `claude/` or `codex/`, GitHub rejects them.
- `.claude/settings.json` turns attribution off and the CI check `no-agent-traces` fails a pull
  request with traces. Never weaken either of them, fix the commit or the description instead.

### Pull requests

- Every change goes through a branch and a pull request, never straight to `main` (it deploys
  production). Only Nela merges; the one exception is a rules sync from `Nelusa/agent-rules`,
  which merges itself once its required checks pass.
- One pull request does one thing. A repository with the `nelusa-light` block may bundle
  related small changes, as that block says.
- Don't open the pull request yourself: some tools add a footer that stays in the description's
  edit history even after it is removed. Push the branch and `.github/workflows/open-pr.yml`
  opens the pull request, with the subject of the first commit as the title and its body as the
  description. A branch stacked on other open pull requests gets its own first commit.
- Write that body with `git commit -F <file>`, an editor drops lines starting with `#`. Use the
  sections of `.github/pull_request_template.md` when the repository has one, otherwise
  `## What and why`, `## How it was verified` and `## What to review`.
- Push when the change is ready for review, not after every commit: each push to a pull request
  runs all its checks again, and a private repository pays for them in Actions minutes. Run
  the checks you can locally first.
  Push earlier only when you need a result that only CI can give (a test that needs a service
  or a token you don't have), and say so in the description.
- The merge method is set per repository on GitHub, don't change it.
- **From a cloud session (Claude Code on the web), never write to a pull request through the
  GitHub connection:** it appends its own footer to anything written there, and
  `.claude/settings.json` can't turn that off. Write through `.github/workflows/pr-write.yml`
  instead: start it on `main` (`run_workflow`) with the inputs `action` (`open`, `edit` or
  `comment`), `pr`, `branch`, `title` and `body`. It writes as Nela with the `PR_TOKEN` secret and
  refuses text that names the agent. Reviews and approvals stay with Nela.
- Editing the description of an open pull request is fine in the GitHub web UI or from a local
  session. Never push to a branch whose pull request is merged, start a new branch.

### When a rule doesn't fit

- The `nelusa-…` blocks come from `Nelusa/agent-rules`, never edit inside them. When a task
  conflicts with a rule, or a rule looks wrong or outdated, tell Nela and suggest the change for
  `Nelusa/agent-rules` instead of working around it.

<!-- END:nelusa-common -->
