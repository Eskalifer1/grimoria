# Dependency updates

Dependabot keeps `package.json` / `yarn.lock` and (once CI exists) GitHub
Actions versions current. Two mechanisms sit under that one name, and only one
of them is configured by a file:

| | Trigger | Enabled by |
| --- | --- | --- |
| **Version updates** | A newer release exists | `.github/dependabot.yml` |
| **Security updates** | An advisory names the installed version | Repository setting, **not** the file |

Version updates obey the schedule, grouping and open-PR limit below. Security
updates ignore all three and open individual PRs as soon as an advisory lands.

## Noise policy

`monthly`, with all `minor`/`patch` bumps collapsed into a single grouped PR per
ecosystem. `major` updates are deliberately left out of the npm group so each
one arrives as its own PR and actually gets read.

**Why**: the default (`weekly`, ungrouped) produces several PRs a week on a
solo project. The failure mode isn't the noise itself — it's that the noise gets
Dependabot switched off entirely, taking the security half down with it.

GitHub Actions groups all update types together, majors included: an action
major is usually a tag bump (`actions/checkout@v5`), not a migration.

## Cooldown

npm updates wait 7 days after a release (14 for majors) before Dependabot will
propose them.

**Why**: Yarn quarantines npm releases from the last few days (see CLAUDE.md,
"Package manager"). Without the wait, Dependabot could open a PR for a version
`yarn install` then refuses to resolve — a red PR caused entirely by timing.
Cooldown does not apply to security updates.

## Bot commit messages

`prefix: chore` for npm (`chore(deps):` / `chore(deps-dev):`) and `prefix: ci`
for Actions, both within the ten types in `docs/git-workflow.md`. PRs are
labelled `chore` + `infra`.

## Still open

- **Security updates are disabled** on the repository. The file cannot turn
  them on:

  ```bash
  gh api --method PUT repos/Eskalifer1/grimoria/vulnerability-alerts
  gh api --method PUT repos/Eskalifer1/grimoria/automated-security-fixes
  ```

  Alerts first — security updates are built on them.

- **No CI workflow exists yet** (`.github/workflows/` is empty), so Dependabot
  PRs currently arrive with nothing verifying them. Until that lands, a grouped
  bump is a manual check, not a green tick. Revisit this doc when CI is set up —
  the `github-actions` ecosystem block only starts doing anything at that point.
