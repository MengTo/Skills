---
name: publish-project-to-github
description: Package a finished local project into an intentional GitHub repository, create a strong README and visual preview, push it safely, configure a public GitHub Pages URL when the project is compatible, and verify the deployed result. Use when a user asks to upload, publish, open-source, share, or turn a local HTML/CSS/JavaScript experiment or small web project into a documented GitHub repository with a live demo.
---

# Publish Project to GitHub

Turn a finished local project into a clean public artifact. Treat repository creation, public visibility, and deployment as separate gates; a successful push is not proof that the public site works.

## Deliverables

Produce the applicable items:

- a narrowly scoped Git repository
- an intentional public or private GitHub repository
- a project-specific `README.md`
- a real preview image when the project is visual
- a portable build or remix prompt when it adds value
- a configured GitHub Pages site for compatible web projects
- post-push and post-deploy read-back

## 1. Resolve scope and authority

Inspect the local project, repository state, remotes, and local instructions before writing.

Confirm or safely infer:

- the exact project directory and intended files
- repository name and owner
- whether the target should be public or private
- whether an existing repository must be updated or a new one created
- whether the user wants a live website, source hosting only, or both

Creating a public repository is authorized only when the user explicitly asks for public sharing, a public URL, open source, or equivalent. Otherwise ask for visibility before creating it.

Never force-push, overwrite an existing remote, change repository visibility, or replace an existing Pages configuration without exact authorization.

## 2. Audit before packaging

Run the bundled audit from the project root:

```bash
bash /path/to/publish-project-to-github/scripts/audit_public_project.sh .
```

Then inspect findings rather than treating the script as a substitute for judgment.

Block publication on:

- API keys, tokens, private keys, passwords, or `.env` files
- personal data or private client information
- absolute local filesystem paths required at runtime
- unlicensed or private assets
- missing runtime files
- unclear ownership of a repository name that already exists

Review all external runtime URLs and generated assets. State any required network dependency in the README.

Inspect the existing license before publishing. If the user explicitly wants others to reuse or modify the project and no license exists, ask which license to add rather than inventing one. If the goal is only public viewing, a missing license does not block deployment, but report that reuse rights are not granted explicitly.

## 3. Choose the packaging model

### Clean existing repository

Use the existing checkout when its remote, history, and tracked files match the intended public project. Stage only the requested files.

### Mixed or unrelated workspace

Create a clean project directory or sibling checkout when the source workspace contains unrelated experiments, deletions, private files, or history. Copy only the intended runtime files. Do not publish an entire mixed folder for convenience.

### Existing public repository

Inspect its default branch, Pages source, README, license, and remote state before changing it. Pull or reconcile deliberately; never hide divergence with a force push.

For a static one-file experiment, prefer this minimal shape:

```text
project-name/
├── index.html
├── README.md
├── PROMPT.md        # optional
├── assets/          # optional previews or runtime assets
└── .gitignore
```

## 4. Build the repository presentation

Write the README from the real project. Use `assets/README-template.md` as a starting structure, not as final copy.

Include:

- project name and one concrete sentence explaining the experience
- a live demo link near the top and, when useful outside GitHub, a repository source link
- a screenshot or short GIF captured from the actual running project
- key interactions or features
- a concise explanation of the architecture and unusual implementation choices
- accurate local run instructions
- project structure
- runtime dependencies and network requirements
- originality, attribution, or non-affiliation notes when references inspired the work

For agent-built projects, optionally add official links and a portable prompt showing how to rebuild or remix the project with relevant coding agents. Verify current official URLs before publishing.

Avoid generic claims such as “cutting-edge,” “stunning,” or “production-ready.” Prefer specific craft and behavior.

## 5. Verify locally

Use the project's real runtime rather than opening module-based sites directly from disk.

For static sites:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Check:

- initial render
- the primary interaction path
- the primary interaction's return, close, or recovery path
- a normal desktop viewport and a narrow viewport around `390 × 844` when the project is responsive
- every README run command
- missing files and 404s
- console errors and warnings
- relative URLs under a repository subpath such as `/project-name/`

Use the browser requested by the user or required by repository instructions. Capture the README preview from this verified runtime.

## 6. Commit and create the repository

Require GitHub CLI and an authenticated session:

```bash
gh --version
gh auth status
```

Check name availability before creation:

```bash
gh repo view OWNER/REPOSITORY
```

Initialize and commit only the intended package:

```bash
git init -b main
git add -- README.md index.html .gitignore
git diff --cached --check
git commit -m "Publish PROJECT_NAME"
```

Add optional files explicitly rather than replacing the narrow `git add` with `git add -A` in a mixed tree.

Create and push only after the audit and local verification pass:

```bash
gh repo create OWNER/REPOSITORY \
  --public \
  --source=. \
  --remote=origin \
  --push \
  --description "CONCRETE_DESCRIPTION"
```

Use `--private` unless public visibility is authorized. When the repository already exists, configure its remote explicitly and push without recreating it.

## 7. Configure the public site

Classify the project before enabling Pages:

- **Static root:** publish `main` and `/`.
- **Static docs folder:** publish `main` and `/docs`.
- **Framework build:** use the framework's supported Pages output and the current official GitHub Actions guidance.
- **Server, database, or private runtime:** GitHub Pages is not compatible; explain the blocker and choose another host only with user authorization.

Read `references/github-pages.md` before changing Pages settings. Set the repository homepage to the resulting public URL and add a small set of accurate discovery topics.

## 8. Verify external state

Read back all external changes:

```bash
gh repo view OWNER/REPOSITORY \
  --json nameWithOwner,url,visibility,description,homepageUrl,defaultBranchRef

gh api repos/OWNER/REPOSITORY/pages
gh api repos/OWNER/REPOSITORY/pages/builds/latest
```

Wait until the Pages build reports `built` or fails concretely. Then open the public URL and verify:

- HTTP navigation succeeds at the final HTTPS URL
- the expected project UI appears
- one representative interaction changes the main application state and returns or closes cleanly
- assets resolve under the repository subpath
- no browser errors or warnings appear
- README links resolve

Keep the public page open for the user when it is the requested deliverable.

## 9. Hand off exact results

Return:

- repository URL
- public site URL, when created
- commit and branch
- Pages build status
- checks actually run
- any dependency, licensing, or deployment limitation still present

Distinguish “pushed,” “Pages configured,” “Pages built,” and “live site verified.” Never collapse them into one success claim.

## Failure rules

- Preserve unrelated dirty work and history.
- Do not publish secrets and remove them from history before any push if they were committed.
- Do not guess a GitHub owner or existing repository target when local context cannot resolve it.
- Do not claim a `file://` preview proves GitHub Pages compatibility.
- Do not use a successful CLI exit as the only verification of an external write.
- Do not silently substitute another host when GitHub Pages is incompatible.

## Resources

- Run `scripts/audit_public_project.sh` before packaging or publishing.
- Read `references/github-pages.md` before configuring or debugging Pages.
- Copy `assets/README-template.md` and rewrite every placeholder from project evidence.
