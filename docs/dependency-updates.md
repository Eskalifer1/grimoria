# Dependency updates

Dependabot keeps `package.json` / `yarn.lock` and (once CI exists) Actions versions current. Two
mechanisms share the name, and only one is configured by a file:

| | Trigger | Enabled by |
| --- | --- | --- |
| **Version updates** | A newer release exists | `.github/dependabot.yml` |
| **Security updates** | An advisory names the installed version | Repository setting, **not** the file |

Version updates obey the schedule, grouping and PR limit below; security updates ignore all
three and open individual PRs as soon as an advisory lands.

## Noise policy

`monthly`, with all `minor`/`patch` bumps collapsed into one grouped PR per ecosystem.
`major` updates are deliberately outside the npm group, so each arrives as its own PR and
actually gets read.

**Why**: the default (`weekly`, ungrouped) produces several PRs a week on a solo project. The
failure mode is not the noise — it is that the noise gets Dependabot switched off entirely,
taking the security half down with it.

Actions group all update types together, majors included: an action major is usually a tag bump
(`actions/checkout@v5`), not a migration.

## Cooldown

npm updates wait 7 days after release, 14 for majors.

**Why**: Yarn quarantines npm releases from the last few days (CLAUDE.md, "Package manager").
Without the wait, Dependabot could open a PR for a version `yarn install` then refuses to
resolve — a red PR caused entirely by timing. Cooldown does not apply to security updates.

## Bot commits

`prefix: chore` for npm (`chore(deps):` / `chore(deps-dev):`) and `prefix: ci` for Actions, both
within the ten types in `docs/git-workflow.md`. PRs are labelled `chore` + `infra`.

## Still open

**Security updates are disabled** on the repository, and the file cannot turn them on — alerts
first, since security updates are built on them:

```bash
gh api --method PUT repos/Eskalifer1/grimoria/vulnerability-alerts
gh api --method PUT repos/Eskalifer1/grimoria/automated-security-fixes
```

**No CI workflow exists yet**, so Dependabot PRs arrive with nothing verifying them. Until that
lands a grouped bump is a manual check, not a green tick, and the `github-actions` ecosystem
block does nothing at all.
