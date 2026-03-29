## Development Workspace Isolation

If you maintain a persistent `dev` branch with your custom local setup (configs, environment, etc.), use this workflow to submit clean PRs:

1. **Branch from `main`**: Always create feature branches from `main`, not your `dev` branch.
   ```bash
   git checkout main && git pull origin main
   git checkout -b feat/your-feature main
   ```
2. **Test on `dev`**: If you need your custom environment to test, merge your feature branch *into* `dev` locally.
   ```bash
   git checkout dev
   git merge feat/your-feature
   ```
3. **Submit from Feature**: Switch back to the feature branch to push and PR. This ensures your PR only contains the feature code, not your local setup.
   ```bash
   git checkout feat/your-feature
   git push origin feat/your-feature
   ```

