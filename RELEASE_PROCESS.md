# Release Process

This document describes the standard procedure for creating and publishing new releases of the RAG Hands-On Garage project.

## Versioning Strategy

This project follows [Semantic Versioning (SemVer)](https://semver.org/spec/v2.0.0.html):

**Format:** `MAJOR.MINOR.PATCH` (e.g., 1.2.3)

### Version Bump Rules

- **MAJOR** (X.0.0): Breaking changes, incompatible API changes
  - Example: Removing services, changing public interfaces, changing CLI commands
  - Example: `1.5.2` → `2.0.0`

- **MINOR** (0.X.0): New features, non-breaking enhancements
  - Example: Adding new services, adding CLI flags, new configuration options
  - Example: `1.5.2` → `1.6.0`

- **PATCH** (0.0.X): Bug fixes, documentation updates, internal improvements
  - Example: Fixing bugs, updating README, refactoring without API changes
  - Example: `1.5.2` → `1.5.3`

## Pre-Release Checklist

Before starting the release process, ensure:

- [ ] All changes are committed and tested
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Documentation is updated (README.md, CLAUDE.md if applicable)
- [ ] Working directory is clean (no uncommitted changes)
- [ ] You're on the `main` branch
- [ ] You've pulled the latest changes: `git pull origin main`

## Release Process

### Step 1: Determine Version Number

Decide the new version based on changes since the last release:

```bash
# View current version
grep '"version"' package.json

# View changes since last release
git log --oneline $(git describe --tags --abbrev=0)..HEAD

# List all tags
git tag -l
```

**Decision matrix:**
- Breaking changes? → Bump MAJOR
- New features? → Bump MINOR
- Bug fixes only? → Bump PATCH

### Step 2: Update package.json

Edit the version field in `package.json`:

```bash
# Manual edit or use npm version (without git tag)
npm version 1.2.0 --no-git-tag-version
```

### Step 3: Update RELEASES.md

Add a new section at the top of `RELEASES.md` (after `[Unreleased]`):

```markdown
## [1.2.0] - 2026-02-10

### Added
- New feature X that does Y
- New CLI command `npm run new-command`

### Changed
- Updated service Z to improve performance
- Modified configuration format for better clarity

### Fixed
- Fixed bug in service A that caused B
- Corrected documentation error in README.md

### Deprecated
- Old configuration option X (use Y instead)

### Migration Guide
```bash
# Steps to upgrade from previous version
```

**Commit:** [View changes](../../commit/HEAD)
```

**Categories to use (if applicable):**
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Features that will be removed in future
- **Removed**: Features removed in this version
- **Fixed**: Bug fixes
- **Security**: Security improvements
- **Performance**: Performance improvements
- **Migration Guide**: Steps for users to upgrade

### Step 4: Commit Changes

Create a release commit with all version-related changes:

```bash
# Stage version changes
git add package.json RELEASES.md

# Create commit with detailed message
git commit -m "$(cat <<'EOF'
Release 1.2.0: Brief description of main changes

Detailed description of what's in this release.

Features:
- Feature 1 description
- Feature 2 description

Changes:
- Change 1 description
- Change 2 description

Fixes:
- Fix 1 description
- Fix 2 description

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**Commit message format:**
- First line: `Release X.Y.Z: Brief summary` (50 chars max)
- Blank line
- Detailed description organized by category
- Include migration notes if applicable
- End with co-author attribution

### Step 5: Create Git Tag

Create an annotated tag for the release:

```bash
# Replace X.Y.Z with your version number
git tag -a vX.Y.Z -m "Release X.Y.Z: Brief summary

Detailed description of major changes:
- Change 1
- Change 2
- Change 3"
```

**Tag naming convention:**
- Always prefix with `v` (e.g., `v1.2.0`, not `1.2.0`)
- Use annotated tags (`-a` flag), not lightweight tags
- Include meaningful message describing the release

### Step 6: Verify Release

Run verification commands before pushing:

```bash
# Verify tag exists and points to correct commit
git tag -l
git show vX.Y.Z --oneline -1

# Verify package.json version in tag
git show vX.Y.Z:package.json | grep '"version"'

# View commit history
git log --oneline -5

# Ensure working directory is clean
git status
```

**Expected output:**
- Tag appears in tag list
- Tag points to latest commit
- package.json shows correct version
- No uncommitted changes

### Step 7: Push to Remote

Push both the commit and the tag:

```bash
# Push commit
git push origin main

# Push tag
git push origin vX.Y.Z

# Or push all tags at once
git push origin --tags
```

**Important:**
- Push commit first, then tags (or use `--tags`)
- Never force push tags (`git push --force` on tags is bad practice)
- Tags are immutable - if you make a mistake, create a new version

## Post-Release Tasks

After publishing the release:

- [ ] Verify tag appears on GitHub/GitLab
- [ ] Create GitHub Release (if using GitHub):
  - Go to repository → Releases → Create new release
  - Select the tag (vX.Y.Z)
  - Copy content from RELEASES.md for this version
  - Publish release

- [ ] Announce the release (if applicable):
  - Team chat/email
  - Project documentation
  - Training materials

- [ ] Update any dependent documentation

## Example: Complete Release

Here's a complete example of releasing version 1.2.0:

```bash
# 1. Check current state
git status
npm test
git pull origin main

# 2. Update version
npm version 1.2.0 --no-git-tag-version

# 3. Edit RELEASES.md (manually add new section)

# 4. Commit changes
git add package.json RELEASES.md
git commit -m "$(cat <<'EOF'
Release 1.2.0: Add streaming support for LLM responses

Add streaming capability to LlmClient for real-time output.

Features:
- Streaming mode for chat interface
- Progress indicators during generation
- Configurable stream buffer size

Changes:
- LlmClient now supports stream parameter
- Chat CLI displays tokens as they arrive

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# 5. Create tag
git tag -a v1.2.0 -m "Release 1.2.0: Add streaming support

- Streaming mode for LLM responses
- Real-time chat output
- Improved user experience"

# 6. Verify
git tag -l
git show v1.2.0 --oneline -1
git show v1.2.0:package.json | grep '"version"'

# 7. Push
git push origin main
git push origin v1.2.0
```

## Troubleshooting

### Wrong Version Number

If you tagged the wrong version and haven't pushed yet:

```bash
# Delete local tag
git tag -d vX.Y.Z

# Fix version in package.json
# Edit RELEASES.md

# Amend the commit
git add package.json RELEASES.md
git commit --amend

# Create correct tag
git tag -a vX.Y.Z -m "Correct message"
```

### Already Pushed Wrong Tag

**DO NOT** delete remote tags unless absolutely necessary. Instead:

```bash
# Create a new patch version
# Example: If v1.2.0 was wrong, create v1.2.1

# Update version to 1.2.1
npm version 1.2.1 --no-git-tag-version

# Add note in RELEASES.md explaining v1.2.1 supersedes v1.2.0
# Commit and tag as normal
```

### Forgot to Update RELEASES.md

If you already committed/tagged but forgot to update RELEASES.md:

```bash
# Don't amend! Create a new commit
# Edit RELEASES.md

git add RELEASES.md
git commit -m "docs: Update RELEASES.md for v1.2.0"
git push origin main
```

## Best Practices

1. **Release Early, Release Often**: Don't wait too long between releases
2. **Keep RELEASES.md Current**: Update it as you make changes, not just at release time
3. **Test Before Release**: Always run full test suite before creating a release
4. **Meaningful Messages**: Write clear, descriptive commit and tag messages
5. **Never Rewrite Published History**: Don't force push or delete remote tags
6. **Consistent Timing**: Consider releasing on a regular cadence (e.g., bi-weekly)
7. **Communicate Changes**: Make sure users know about breaking changes in advance
8. **Backup First**: Before major version bumps, ensure you can rollback if needed

## Release Checklist Template

Copy this checklist for each release:

```markdown
## Release vX.Y.Z Checklist

- [ ] All tests pass
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] Working directory clean
- [ ] On main branch
- [ ] Pulled latest changes
- [ ] Determined version number (X.Y.Z)
- [ ] Updated package.json version
- [ ] Updated RELEASES.md with changes
- [ ] Created release commit
- [ ] Created annotated tag
- [ ] Verified tag points to correct commit
- [ ] Verified package.json version in tag
- [ ] Pushed commit to remote
- [ ] Pushed tag to remote
- [ ] Created GitHub Release (if applicable)
- [ ] Announced release (if applicable)
```

## Version History

For the complete version history of this project, see [RELEASES.md](./RELEASES.md).

## Related Documents

- [RELEASES.md](./RELEASES.md) - Changelog with all version history
- [README.md](./README.md) - Project documentation
- [CLAUDE.md](./CLAUDE.md) - Development guide
- [Semantic Versioning](https://semver.org/) - Official SemVer specification
- [Keep a Changelog](https://keepachangelog.com/) - Changelog format guide
