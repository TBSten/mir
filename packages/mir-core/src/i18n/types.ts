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

  // sync
  "sync.no-new-vars": string;
  "sync.success": string;

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

  // general
  "general.variables": string;
  "general.default": string;
}

export type MessageKey = keyof MessageCatalog;
