---
description: Best development workflow for feature isolation with a custom dev setup
---

# Feature Isolation Workflow

This workflow is designed for developers who want to maintain a persistent `dev` branch with a custom local setup (configs, environment, etc.) while submitting clean, feature-only pull requests to `main`.

### 1. Starting a New Feature
Always start from the latest clean state of the main branch.

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create a new feature branch
git checkout -b feat/my-new-feature main
```

### 2. Developing the Feature
Make your changes and commits only on the `feat/my-new-feature` branch. This ensures your pull request only contains relevant code.

```bash
git add .
git commit -m "feat: implement my new feature"
```

### 3. Testing with your `dev` Setup
If you need your custom environment on the `dev` branch to test the feature:

```bash
# Switch to your development branch
git checkout dev

# Merge the feature branch into dev (locally only)
git merge feat/my-new-feature

# Now you can test the feature with your custom configuration.
```

> [!TIP]
> Do NOT commit your local setup or test-only changes to the `feat/` branch. If you accidentally do, use `git rebase -i` to remove them before pushing.

### 4. Submitting a Pull Request
Once the feature is ready and tested:

```bash
# Switch back to the feature branch
git checkout feat/my-new-feature

# Optional: Rebase on current main if main has moved
git pull --rebase origin main

# Push the feature branch
git push origin feat/my-new-feature
```
Open the Pull Request on GitHub from `feat/my-new-feature` into `main`.

### 5. Cleaning Up
After the PR is merged:

```bash
# Update your main
git checkout main
git pull origin main

# Delete the local feature branch
git branch -d feat/my-new-feature

# Update dev with the newly merged code from main
git checkout dev
git rebase main
```
