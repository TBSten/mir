export interface MessageCatalog {
  // errors
  "error.snippet-not-found": string;
  "error.snippet-already-exists": string;
  "error.registry-not-found": string;
  "error.registry-remote": string;
  "error.registry-remote-named": string;
  "error.path-traversal": string;
  "error.file-conflict": string;
  "error.validation": string;
  "error.invalid-snippet-name": string;
  "error.variable-empty": string;
  "error.variable-required": string;
  "error.exit-hook": string;
  "error.hook-input-required": string;
  "error.no-snippets": string;
  "error.remote-fetch": string;
  "error.remote-fetch-status": string;
  "error.invalid-manifest": string;
  "error.fetch-timeout": string;
  "error.symlink-detected": string;
  "error.symlink-in-snippet": string;
  "error.safe-mode-overwrite": string;
  "error.file-not-found": string;
  "error.file-read-failed": string;
  "error.snippet-not-found-details": string;

  // create
  "create.success": string;

  // publish
  "publish.success": string;
  "publish.cancelled": string;
  "publish.confirm-overwrite": string;

  // install
  "install.success": string;
  "install.skip": string;
  "install.confirm-overwrite": string;
  "install.dry-run-files": string;
  "install.dry-run-complete": string;
  "install.multiple-snippets": string;
  "install.snippet-n-of-m": string;
  "install.completed-multiple": string;
  "install.failed-multiple": string;
  "install.safe-mode-hooks-skipped": string;
  "install.symlink-warning": string;

  // sync
  "sync.no-new-vars": string;
  "sync.success": string;

  // error specific
  "error.no-failed-snippets": string;
  "error.publish-token-required": string;
  "error.publish-auth-failed": string;
  "error.publish-token-invalid": string;
  "error.publish-failed": string;
  "error.publish-network-error": string;

  // clone
  "clone.success": string;

  // preview
  "preview.title": string;
  "preview.confirm": string;

  // prompt
  "prompt.snippet-name": string;
  "prompt.select-snippet": string;
  "prompt.select": string;
  "prompt.enter-number": string;
  "prompt.other-manual": string;
  "prompt.use-default": string;
  "prompt.use-default-value": string;
  "prompt.yes-no-all": string;
  "prompt.yes-no": string;

  // batch-summary
  "batch-summary.results": string;
  "batch-summary.success": string;
  "batch-summary.failure": string;
  "batch-summary.skipped": string;
  "batch-summary.counts": string;
  "batch-summary.retry-hint": string;

  // validate
  "validate.success": string;
  "validate.no-template-dir": string;
  "validate.undefined-vars": string;
  "validate.unused-vars": string;

  // general
  "general.variables": string;
  "general.default": string;
}

export type MessageKey = keyof MessageCatalog;
