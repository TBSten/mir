import { t } from "./i18n/index.js";

export class MirError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MirError";
  }
}

export class ValidationError extends MirError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class SnippetNotFoundError extends MirError {
  constructor(name: string) {
    super(t("error.snippet-not-found", { name }));
    this.name = "SnippetNotFoundError";
  }
}

export class SnippetAlreadyExistsError extends MirError {
  constructor(name: string) {
    super(t("error.snippet-already-exists", { name }));
    this.name = "SnippetAlreadyExistsError";
  }
}

export class RegistryNotFoundError extends MirError {
  constructor(name: string) {
    super(t("error.registry-not-found", { name }));
    this.name = "RegistryNotFoundError";
  }
}

export class RegistryRemoteError extends MirError {
  constructor(name?: string) {
    super(
      name
        ? t("error.registry-remote-named", { name })
        : t("error.registry-remote"),
    );
    this.name = "RegistryRemoteError";
  }
}

export class PathTraversalError extends MirError {
  constructor(filePath: string) {
    super(t("error.path-traversal", { path: filePath }));
    this.name = "PathTraversalError";
  }
}

export class FileConflictError extends MirError {
  constructor(filePath: string) {
    super(t("error.file-conflict", { path: filePath }));
    this.name = "FileConflictError";
  }
}

export class RemoteRegistryFetchError extends MirError {
  constructor(url: string, status?: number) {
    super(
      status
        ? t("error.remote-fetch-status", { url, status })
        : t("error.remote-fetch", { url }),
    );
    this.name = "RemoteRegistryFetchError";
  }
}

export class InvalidManifestError extends MirError {
  constructor(url: string) {
    super(t("error.invalid-manifest", { url }));
    this.name = "InvalidManifestError";
  }
}
