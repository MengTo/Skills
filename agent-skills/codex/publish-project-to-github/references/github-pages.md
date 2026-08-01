# GitHub Pages reference

Read this reference only when the user wants a public website or when Pages needs diagnosis.

## Static branch deployment

For a new static project served from the repository root:

```bash
project_repo="OWNER/REPOSITORY"
project_branch="main"

gh api --method POST "repos/${project_repo}/pages" \
  -f "source[branch]=${project_branch}" \
  -f 'source[path]=/'
```

Quote the `source[...]` arguments in shells that treat brackets as globs.

Use `/docs` only when that directory contains the complete deployable site:

```bash
gh api --method POST "repos/${project_repo}/pages" \
  -f "source[branch]=${project_branch}" \
  -f 'source[path]=/docs'
```

If Pages already exists, read the current configuration first. Use the update endpoint only when the user authorized changing that source:

```bash
gh api "repos/${project_repo}/pages"

gh api --method PUT "repos/${project_repo}/pages" \
  -f "source[branch]=${project_branch}" \
  -f 'source[path]=/'
```

## Repository metadata

Set the public URL as the repository homepage after Pages accepts the configuration:

```bash
project_url="https://OWNER.github.io/REPOSITORY/"
gh repo edit "${project_repo}" --homepage "${project_url}"
```

Add only accurate topics. Six focused topics are more useful than a long generic list.

## Build status

Read the latest build:

```bash
gh api "repos/${project_repo}/pages/builds/latest" \
  --jq '{status,commit,updated_at,error}'
```

Poll with a short bounded interval. Stop on `built`, `errored`, or `canceled`. Do not leave an unbounded loop running.

After `built`, verify the deployed commit matches the intended local commit.

## Repository subpaths

A project site is served from `https://OWNER.github.io/REPOSITORY/`, not the domain root.

Prefer relative asset URLs:

```html
<link rel="stylesheet" href="./styles.css">
<script type="module" src="./app.js"></script>
<img src="./assets/preview.jpg" alt="">
```

Root-relative URLs such as `/assets/preview.jpg` resolve against `OWNER.github.io` and commonly break project sites.

Test deep links, module imports, workers, manifests, fonts, and fetch requests for the same base-path issue.

## Framework projects

Do not paste a stale generic Actions workflow. Identify the framework and check its current official Pages deployment guidance.

Verify at least:

- the correct build command
- the generated output directory
- repository subpath or base URL configuration
- the official Pages artifact action versions
- whether SPA fallback routing is required

For Next.js, Astro, Vite, or another framework, use its supported static export or Pages adapter. If the application needs server functions, a database, authentication callbacks, or secret runtime variables, Pages is not a compatible deployment target.

## Common failures

### 404 immediately after configuration

- Wait for the latest build to reach a terminal status.
- Verify `index.html` exists in the configured source directory.
- Verify the configured branch exists on the remote.
- Confirm repository visibility and Pages availability for the account.

### HTML loads but assets fail

- Inspect network and console errors.
- Replace root-relative paths with repository-aware relative paths.
- Verify capitalization exactly; GitHub's host is case-sensitive.
- Confirm large or generated assets were committed and pushed.

### Module MIME or import errors

- Confirm the referenced file exists at the deployed URL.
- Avoid importing local filesystem paths.
- Use browser-compatible ES modules rather than package names that require a bundler.

### Custom domain problems

Do not add or change a custom domain without explicit authorization. Read current GitHub documentation, verify DNS ownership, and keep HTTPS enforcement enabled after the domain is verified.
