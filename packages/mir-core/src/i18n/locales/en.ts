import type { MessageCatalog } from "../types.js";

export const en: MessageCatalog = {
  // errors
  "error.snippet-not-found": "Snippet \"{name}\" not found. Use `mir list` to see available snippets or specify `--registry` for another registry",
  "error.snippet-already-exists": "Snippet \"{name}\" already exists. Use `--force` to overwrite or specify a different name",
  "error.registry-not-found": "Registry \"{name}\" not found. Configure registries in `~/.mir/mirconfig.yaml`",
  "error.registry-remote": "Cannot publish to remote registry",
  "error.registry-remote-named": "Cannot publish to registry \"{name}\" because it is a remote registry",
  "error.path-traversal": "Security error: File path \"{path}\" references outside the output directory. Check your template files",
  "error.file-conflict": "File \"{path}\" already exists. Use `--no-interactive` to overwrite all files or `--out-dir` to specify another directory",
  "error.validation": "Validation error",
  "error.invalid-snippet-name": "Invalid snippet name \"{name}\". Only alphanumeric characters and hyphens are allowed, and must start with an alphanumeric character",
  "error.variable-empty": "No value provided for variable \"{key}\"",
  "error.variable-required": "Variable \"{key}\" is required. Specify it with {hint}",
  "error.exit-hook": "Installation was cancelled",
  "error.hook-input-required": "Variable \"{key}\" requires input, but interactive mode is not yet supported. Please specify a default value",
  "error.no-snippets": "No snippets available to select",
  "error.remote-fetch": "Failed to fetch from remote registry: {url}",
  "error.remote-fetch-status": "Failed to fetch from remote registry: {url} (HTTP {status})",
  "error.invalid-manifest": "Invalid manifest from remote registry: {url}",
  "error.fetch-timeout": "Timeout: Connection to {url} did not complete within {timeout} seconds",
  "error.symlink-detected": "Symbolic link detected: {path}",
  "error.symlink-in-snippet": "Snippet contains symbolic links: {paths}",
  "error.safe-mode-overwrite": "Overwriting existing files is not allowed in safe mode: {path}",
  "error.file-not-found": "File \"{path}\" not found",
  "error.file-read-failed": "Failed to read file \"{path}\"",
  "error.snippet-not-found-details": "\nPossible causes:\n1. Typo in snippet name\n2. Snippet not registered in registry\n3. No access permission to registry\n\nWays to check:\n• mir list              - Show available snippets\n• mir search <keyword> - Search by keyword\n• mir info <name>      - Show snippet details",

  // create
  "create.success": "Created snippet \"{name}\"",

  // publish
  "publish.success": "Published snippet \"{name}\" to registry",
  "publish.cancelled": "Publish cancelled",
  "publish.confirm-overwrite": "Snippet \"{name}\" already exists. Overwrite?",

  // install
  "install.success": "Installed snippet \"{name}\"",
  "install.skip": "Skipped: {path}",
  "install.confirm-overwrite": "File \"{path}\" already exists. Overwrite? (y/n/a): ",
  "install.dry-run-files": "[dry-run] Files to be generated:",
  "install.dry-run-complete": "[dry-run] No actual file writes were performed.",
  "install.multiple-snippets": "Installing multiple snippets...",
  "install.snippet-n-of-m": "{current} / {total}: {name}",
  "install.completed-multiple": "Installed {count} snippet(s)",
  "install.failed-multiple": "Failed to install {count} snippet(s)",
  "install.safe-mode-hooks-skipped": "[safe] Skipped hooks execution",
  "install.symlink-warning": "Symbolic link detected: {path}",

  // sync
  "sync.no-new-vars": "No new variables to add",
  "sync.success": "Added {count} variable(s)",

  // search
  "search.query-required": "Search query is required",
  "search.no-results": "No snippets found matching \"{query}\"",

  // error specific
  "error.no-failed-snippets": "No failed snippet history",

  // clone
  "clone.success": "Cloned snippet \"{name}\" to \"{alias}\"",

  // preview
  "preview.title": "Preview: {name}",
  "preview.confirm": "Do you want to install this snippet?",

  // prompt
  "prompt.snippet-name": "Snippet name: ",
  "prompt.select-snippet": "Select a snippet",
  "prompt.select": "Select: ",
  "prompt.enter-number": "Please enter a number",
  "prompt.other-manual": "Other (manual input)",
  "prompt.use-default": "Press Enter to use {value}",
  "prompt.use-default-value": "Press Enter to use default \"{value}\"",
  "prompt.yes-no-all": "(y/n/a): ",
  "prompt.yes-no": "(y/N): ",

  // batch-summary
  "batch-summary.results": "Installation results:",
  "batch-summary.success": "Success",
  "batch-summary.failure": "Failed",
  "batch-summary.skipped": "Skipped",
  "batch-summary.counts": "Success: {success}/{total}, Failed: {failure}/{total}, Skipped: {skipped}/{total}",
  "batch-summary.retry-hint": "💡 To retry failed snippets: mir install --retry-failed",

  // general
  "general.variables": "Variables:",
  "general.default": "(default)",
};
