#!/usr/bin/env bash
set -euo pipefail

project_dir="${1:-.}"

if [[ ! -d "$project_dir" ]]; then
  echo "ERROR: project directory does not exist: $project_dir" >&2
  exit 2
fi

if ! command -v rg >/dev/null 2>&1; then
  echo "ERROR: ripgrep (rg) is required for this audit." >&2
  exit 2
fi

project_dir="$(cd "$project_dir" && pwd)"
issue_count=0
warning_count=0

echo "Public project audit"
echo "Path: $project_dir"

file_count="$(rg --files --hidden -g '!**/.git/**' "$project_dir" | wc -l | tr -d ' ')"
echo "Files: $file_count"

if [[ -f "$project_dir/index.html" ]]; then
  echo "Entrypoint: index.html"
elif [[ -f "$project_dir/package.json" ]]; then
  echo "Entrypoint: package.json (verify the build output and host compatibility)"
else
  echo "WARNING: no index.html or package.json found at the project root."
  warning_count=$((warning_count + 1))
fi

risky_files="$(
  rg --files --hidden -g '!**/.git/**' "$project_dir" |
    rg '(^|/)(\.env($|\.)|\.npmrc$|\.pypirc$|id_(rsa|dsa|ecdsa|ed25519)$|.*\.(pem|p12|pfx|key)$)' || true
)"

if [[ -n "$risky_files" ]]; then
  echo "ERROR: sensitive-looking files require removal or explicit review:"
  printf '%s\n' "$risky_files"
  issue_count=$((issue_count + 1))
fi

secret_hits="$(
  rg -n -I --hidden \
    -g '!**/.git/**' \
    -g '!*.lock' \
    -g '!package-lock.json' \
    -g '!pnpm-lock.yaml' \
    -g '!yarn.lock' \
    '(sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----)' \
    "$project_dir" || true
)"

if [[ -n "$secret_hits" ]]; then
  echo "ERROR: possible credential material detected:"
  printf '%s\n' "$secret_hits"
  issue_count=$((issue_count + 1))
fi

personal_path_hits="$(
  rg -n -I --hidden \
    -g '!**/.git/**' \
    -g '!*.lock' \
    '(/Users/[^/[:space:]"<>]+|/home/[^/[:space:]"<>]+|[A-Za-z]:\\Users\\[^\\[:space:]"<>]+)' \
    "$project_dir" || true
)"

if [[ -n "$personal_path_hits" ]]; then
  echo "WARNING: absolute user paths require review:"
  printf '%s\n' "$personal_path_hits"
  warning_count=$((warning_count + 1))
fi

symlink_hits="$(find "$project_dir" -path "$project_dir/.git" -prune -o -type l -print)"
if [[ -n "$symlink_hits" ]]; then
  echo "WARNING: symlinks require destination review:"
  printf '%s\n' "$symlink_hits"
  warning_count=$((warning_count + 1))
fi

if git -C "$project_dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git_root="$(git -C "$project_dir" rev-parse --show-toplevel)"
  echo "Git state:"
  if [[ "$git_root" != "$project_dir" ]]; then
    echo "WARNING: project is nested inside repository root: $git_root"
    warning_count=$((warning_count + 1))
  fi
  git -C "$git_root" status --short -- "$project_dir"
  remote_url="$(git -C "$git_root" remote get-url origin 2>/dev/null || true)"
  if [[ -n "$remote_url" ]]; then
    echo "Origin: $remote_url"
  else
    echo "Origin: not configured"
  fi
else
  echo "Git state: not initialized"
fi

echo "Issues: $issue_count"
echo "Warnings: $warning_count"

if [[ "$issue_count" -gt 0 ]]; then
  echo "RESULT: blocked"
  exit 1
fi

echo "RESULT: review warnings, then continue"
